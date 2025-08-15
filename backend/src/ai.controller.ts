import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Get,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalHFService } from './local-hf.service';
// Minimal reader types to avoid depending on DOM lib in Node builds
type RSReader = { read(): Promise<{ value?: Uint8Array; done: boolean }> };
type WebReadable = { getReader(): RSReader };

type AskDto = { prompt: string };

// Default prompts (kept out of the class to avoid long inline strings)
const DEFAULT_SYSTEM_PROMPT = [
  'You are a friendly Space Math teacher for kids ages 6–10.',
  'Explain simply with short, clear steps using everyday words and small numbers.',
  'Encourage gently.',
  'Avoid revealing chain-of-thought; give the final answer and a brief 1–2 sentence explanation or a tiny hint if the student seems stuck.',
  'Do not give game-control instructions unless the student asks about how to play or it is essential to answer their question.',
].join(' ');

const DEFAULT_GAME_GUIDE = [
  'Context: Space Math is a game with simple controls.',
  'Use this only as background knowledge; do not explain controls unless the student explicitly asks about how to play or controls,',
  'or if a very brief cue is strictly needed to answer.',
  'Controls summary: + blaster adds 1 dot; − blaster removes 1; Groups blaster adds a small cluster.',
  'Tap the space to place dots. Double‑tap to fire two quickly. Color cycles blue → green → red for new dots only. Clear removes all dots.',
  'Missions include: Addition (make more), Subtraction (take away), Multiplication (make groups), Division (split into equal groups).',
  'Prefer concise math help over gameplay instructions.',
].join(' ');

@Controller('ai')
export class AiController {
  private readonly DEFAULT_BASE = 'http://localhost:11434';
  private readonly SYSTEM_PROMPT =
    (process.env.OLLAMA_SYSTEM_PROMPT || '').trim().replace(/\s+/g, ' ') ||
    DEFAULT_SYSTEM_PROMPT;

  // Short in-context manual so the AI understands how the Space Math game works
  private readonly GAME_GUIDE = DEFAULT_GAME_GUIDE;

  private buildSystem(): string {
    return `${this.SYSTEM_PROMPT}\n\n${this.GAME_GUIDE}`.trim();
  }

  constructor(private readonly local: LocalHFService) {}

  @Get('health')
  async health(): Promise<{ ok: boolean; base: string; reason?: string }> {
    const configured = (process.env.OLLAMA_BASE_URL || this.DEFAULT_BASE)
      .trim()
      .replace(/\/$/, '');
    // Prefer configured base; if default and fetch fails, we will retry with IPv4 in ask
    const base = configured;
    const url = `${base}/api/tags`;
    const timeoutMs = Math.max(
      2000,
      Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || '', 10) || 5000,
    );
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      let res = await fetch(url, { signal: ac.signal });
      if (
        (!res.ok || res.status === 404) &&
        !process.env.OLLAMA_BASE_URL &&
        this.DEFAULT_BASE.includes('localhost')
      ) {
        const v4 = 'http://192.168.0.0:11434';
        res = await fetch(`${v4}/api/tags`, { signal: ac.signal });
      }
      if (!res.ok) {
        return { ok: false, base, reason: `HTTP ${res.status}` };
      }
      return { ok: true, base };
    } catch (e: unknown) {
      const reason =
        e instanceof Error
          ? e.name === 'AbortError'
            ? 'timeout'
            : e.message
          : 'network error';
      return { ok: false, base, reason };
    } finally {
      clearTimeout(timer);
    }
  }

  @Get('models')
  async models(): Promise<{ models: string[] }> {
    const configured = (process.env.OLLAMA_BASE_URL || this.DEFAULT_BASE)
      .trim()
      .replace(/\/$/, '');
    const base = configured;
    const url = `${base}/api/tags`;
    const timeoutMs = Math.max(
      2000,
      Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || '', 10) || 8000,
    );
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      let res = await fetch(url, { signal: ac.signal });
      if (
        (!res.ok || res.status === 404) &&
        !process.env.OLLAMA_BASE_URL &&
        this.DEFAULT_BASE.includes('localhost')
      ) {
        const v4 = 'http://127.0.0.1:11434';
        res = await fetch(`${v4}/api/tags`, { signal: ac.signal });
      }
      if (!res.ok) return { models: [] };
      const data = (await res.json()) as { models?: Array<{ name?: string }> };
      const models = Array.isArray(data?.models)
        ? data.models.map((m) => String(m?.name || '')).filter(Boolean)
        : [];
      return { models };
    } catch {
      return { models: [] };
    } finally {
      clearTimeout(timer);
    }
  }

  @Get('local-status')
  localStatus() {
    return this.local.getStatus();
  }

  @Post('local')
  async localTranscribe(
    @Body()
    body: {
      audio?: string;
      prompt?: string;
      return_timestamps?: boolean;
    },
  ): Promise<{ text?: string }> {
    const audio = (body?.audio || body?.prompt || '').trim();
    if (!audio) {
      throw new HttpException('Missing audio', HttpStatus.BAD_REQUEST);
    }
    try {
      const isData = /^data:audio\//i.test(audio);
      const len = audio.length;
      // Log minimal request details to verify receipt without dumping payload
      console.log(
        `[ai/local] received: len=${len} isDataUrl=${isData} time=${new Date().toISOString()}`,
      );
    } catch {
      // ignore logging error
    }
    try {
      const out = (await this.local.generate(audio, {
        return_timestamps: body?.return_timestamps,
      })) as { text?: string };
      try {
        const t = String(out?.text || '');
        console.log(
          `[ai/local] transcribed: empty=${t.trim().length === 0} len=${t.length}`,
        );
      } catch {
        // ignore logging error
      }
      return { text: out?.text };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'transcription error';
      const status = /not ready|unavailable|loading/i.test(msg)
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.BAD_GATEWAY;
      try {
        console.warn('[ai/local] error:', msg);
      } catch {
        // ignore logging error
      }
      throw new HttpException(`Local HF error: ${msg}`, status);
    }
  }

  @Post('ask')
  async ask(
    @Body() body: AskDto & { model?: string },
  ): Promise<{ reply: string }> {
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) {
      throw new HttpException('Missing prompt', HttpStatus.BAD_REQUEST);
    }
    const configured = (process.env.OLLAMA_BASE_URL || this.DEFAULT_BASE)
      .trim()
      .replace(/\/$/, '');
    let base = configured;
    let url = `${base}/api/generate`;
    const model =
      (body?.model && body.model.trim()) ||
      process.env.OLLAMA_MODEL ||
      'qwen3:32b';
    const timeoutMs = Math.max(
      2000,
      Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || '', 10) || 15000,
    );
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system: this.buildSystem(),
          stream: false,
          options: { temperature: 0.2 },
        }),
        signal: ac.signal,
      });
      // If default base failed immediately and base is localhost (IPv6/host issue), retry with 127.0.0.1 once
      if (
        !res.ok &&
        !process.env.OLLAMA_BASE_URL &&
        this.DEFAULT_BASE.includes('localhost')
      ) {
        base = 'http://127.0.0.1:11434';
        url = `${base}/api/generate`;
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            system: this.buildSystem(),
            stream: false,
            options: { temperature: 0.2 },
          }),
          signal: ac.signal,
        });
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(
          `Ollama error: ${res.status} ${text}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      const data = (await res.json()) as { response?: string };
      const cleaned = this.sanitizeModelText(data?.response || '');
      return { reply: cleaned };
    } catch (e: unknown) {
      if (e instanceof HttpException) throw e;
      let reason = 'network error';
      if (e instanceof Error) {
        reason = e.name === 'AbortError' ? 'timeout' : e.message || reason;
      }
      throw new HttpException(
        `Failed to reach Ollama at ${base} (${reason})`,
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  @Post('stream')
  async stream(
    @Body() body: AskDto & { model?: string },
    @Res() res: Response,
  ) {
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) {
      throw new HttpException('Missing prompt', HttpStatus.BAD_REQUEST);
    }
    const configured = (process.env.OLLAMA_BASE_URL || this.DEFAULT_BASE)
      .trim()
      .replace(/\/$/, '');
    let base = configured;
    let url = `${base}/api/generate`;
    const model =
      (body?.model && body.model.trim()) ||
      process.env.OLLAMA_MODEL ||
      'qwen3:32b';

    const timeoutMs = Math.max(
      5000,
      Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || '', 10) || 60000,
    );
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Stream sanitizer state
    const state = { inTagThink: false, inFenceThink: false } as {
      inTagThink: boolean;
      inFenceThink: boolean;
    };
    const sanitizeDelta = (delta: string) => {
      let text = delta;
      // Handle <think>...</think>
      if (state.inTagThink) {
        const endIdx = text.toLowerCase().indexOf('</think>');
        if (endIdx !== -1) {
          text = text.slice(endIdx + 8);
          state.inTagThink = false;
        } else {
          return '';
        }
      }
      const openIdx = text.toLowerCase().indexOf('<think');
      if (openIdx !== -1) {
        const before = text.slice(0, openIdx);
        const after = text.slice(openIdx);
        const endIdx = after.toLowerCase().indexOf('</think>');
        if (endIdx !== -1) {
          text = before + after.slice(endIdx + 8);
        } else {
          state.inTagThink = true;
          text = before;
        }
      }
      // Handle ```think fenced blocks
      if (state.inFenceThink) {
        const end = text.indexOf('```');
        if (end !== -1) {
          text = text.slice(end + 3);
          state.inFenceThink = false;
        } else {
          return '';
        }
      }
      const lower = text.toLowerCase();
      const fenceIdx = lower.indexOf('```think');
      if (fenceIdx !== -1) {
        const before = text.slice(0, fenceIdx);
        const after = text.slice(fenceIdx + 8);
        const end = after.indexOf('```');
        if (end !== -1) {
          text = before + after.slice(end + 3);
        } else {
          state.inFenceThink = true;
          text = before;
        }
      }
      // Drop leading "Thinking:"/"Thought:"/"Reasoning:" lines in this chunk
      text = text.replace(
        /^(\s*(?:thinking|thought|reasoning)\s*:.*(?:\r?\n|$))+?/gim,
        '',
      );
      return text;
    };

    try {
      let ollamaRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system: this.buildSystem(),
          stream: true,
        }),
        signal: ac.signal,
      });
      if (
        !ollamaRes.ok &&
        !process.env.OLLAMA_BASE_URL &&
        this.DEFAULT_BASE.includes('localhost')
      ) {
        base = 'http://127.0.0.1:11434';
        url = `${base}/api/generate`;
        ollamaRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            system: this.buildSystem(),
            stream: true,
          }),
          signal: ac.signal,
        });
      }
      if (!ollamaRes.ok || !ollamaRes.body) {
        const text = await ollamaRes.text().catch(() => '');
        const payload = {
          error: `Ollama error: ${ollamaRes.status} ${text}`,
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        res.end();
        return;
      }
      const bodyUnknown = ollamaRes.body as unknown;
      const reader: RSReader | undefined =
        bodyUnknown &&
        typeof (bodyUnknown as { getReader?: unknown }).getReader === 'function'
          ? (bodyUnknown as WebReadable).getReader()
          : undefined;
      const decoder = new TextDecoder();
      let buf = '';
      const sendDelta = (d: string) => {
        const clean = sanitizeDelta(d);
        if (clean) {
          const payload = { delta: clean };
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
      };
      if (reader) {
        // Web streams
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split(/\r?\n/);
          buf = lines.pop() || '';
          for (const line of lines) {
            const s = line.trim();
            if (!s) continue;
            try {
              const obj = JSON.parse(s) as unknown;
              const responseVal =
                typeof obj === 'object' && obj !== null
                  ? (obj as Record<string, unknown>).response
                  : undefined;
              if (typeof responseVal === 'string') sendDelta(responseVal);
              const doneVal =
                typeof obj === 'object' && obj !== null
                  ? (obj as Record<string, unknown>).done
                  : undefined;
              if (doneVal === true) {
                res.write('data: {"done":true}\n\n');
                res.end();
                clearTimeout(timer);
                return;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } else {
        // Fallback: read as text (less robust)
        const text = await ollamaRes.text();
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const s = line.trim();
          if (!s) continue;
          try {
            const obj = JSON.parse(s) as unknown;
            const responseVal =
              typeof obj === 'object' && obj !== null
                ? (obj as Record<string, unknown>).response
                : undefined;
            if (typeof responseVal === 'string') sendDelta(responseVal);
            const doneVal =
              typeof obj === 'object' && obj !== null
                ? (obj as Record<string, unknown>).done
                : undefined;
            if (doneVal === true) break;
          } catch {
            /* noop */
          }
        }
        res.write('data: {"done":true}\n\n');
        res.end();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'network error';
      const payload = { error: `Failed to reach Ollama (${msg})` };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      res.end();
    } finally {
      clearTimeout(timer);
    }
  }

  @Post('pull')
  async pull(
    @Body() body: { name?: string },
  ): Promise<{ ok: boolean; message?: string }> {
    const name = (body?.name || process.env.OLLAMA_MODEL || '').trim();
    if (!name) {
      throw new HttpException('Missing model name', HttpStatus.BAD_REQUEST);
    }
    const base = (process.env.OLLAMA_BASE_URL || this.DEFAULT_BASE).replace(
      /\/$/,
      '',
    );
    const url = `${base}/api/pull`;
    const timeoutMs = Math.max(
      5000,
      Number.parseInt(process.env.OLLAMA_PULL_TIMEOUT_MS || '', 10) || 600000,
    );
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new HttpException(
          `Ollama pull error: ${res.status} ${text}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      // Read response (can be streamed JSON lines); we'll return a simple ok message.
      await res.text().catch(() => undefined);
      return { ok: true, message: `Pulled ${name}` };
    } catch (e: unknown) {
      if (e instanceof HttpException) throw e;
      const reason =
        e instanceof Error && e.name === 'AbortError'
          ? 'timeout'
          : e instanceof Error
            ? e.message
            : 'network error';
      throw new HttpException(
        `Failed to pull model at ${base} (${reason})`,
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // Remove chain-of-thought content such as <think>...</think>, fenced ```think blocks,
  // and common "Thinking:"/"Thought:" preambles. If an "Answer:" label is present,
  // prefer the content after it.
  private sanitizeModelText(text: string): string {
    if (!text) return '';
    let out = text;
    // Remove <think>...</think> blocks (case-insensitive, dotall)
    out = out.replace(/<\s*think[^>]*>[\s\S]*?<\s*\/\s*think\s*>/gi, '');
    // Remove fenced code blocks labeled "think"
    out = out.replace(/```(?:[a-zA-Z]+)?\s*think[\s\S]*?```/gi, '');
    // Remove leading lines that start with Thinking:/Thought:/Reasoning:
    out = out.replace(
      /^(\s*(?:thinking|thought|reasoning)\s*:.*(?:\r?\n|$))+?/gim,
      '',
    );
    // If there's an explicit Answer: label, take content after the first occurrence
    const ansIdx = out.toLowerCase().indexOf('answer:');
    if (ansIdx !== -1) {
      out = out.slice(ansIdx + 'answer:'.length);
    }
    // Collapse excessive whitespace
    out = out.replace(/\n{3,}/g, '\n\n').trim();
    return out;
  }
}
