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
import { ElevenLabsService } from './elevenlabs.service';
// Minimal reader types to avoid depending on DOM lib in Node builds
type RSReader = { read(): Promise<{ value?: Uint8Array; done: boolean }> };
type WebReadable = { getReader(): RSReader };

type AskDto = { prompt: string; system?: string };

@Controller('ai')
export class AiController {
  private readonly DEFAULT_BASE = 'http://localhost:11434';

  constructor(
    private readonly local: LocalHFService,
    private readonly eleven: ElevenLabsService,
  ) {}

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

  @Get('tts-config')
  ttsConfig(): {
    hasApiKey: boolean;
    apiKeyPreview: string | null;
    voiceIdEnv: string | null;
    modelIdEnv: string | null;
  } {
    const apiKey = process.env.ELEVENLABS_API_KEY || '';
    return {
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey
        ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`
        : null,
      voiceIdEnv: process.env.ELEVENLABS_VOICE_ID || null,
      modelIdEnv: process.env.ELEVENLABS_MODEL_ID || null,
    };
  }

  @Post('tts-config')
  ttsConfigPost() {
    return this.ttsConfig();
  }

  @Post('tts')
  async tts(
    @Body()
    body: {
      text?: string;
      voiceId?: string;
      format?: 'mp3' | 'opus' | 'pcm_16000';
      message?: string; // alias support
      content?: string; // alias support
    },
  ): Promise<{
    audio: string; // data URL
    voiceId: string;
    cached: boolean;
    contentType: string;
  }> {
    const rawCandidate = [body?.text, body?.message, body?.content].find(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
    const text = (rawCandidate || '').trim();
    if (!text) {
      const presentKeys = Object.keys(body || {}).join(',') || 'none';
      throw new HttpException(
        `Missing text (expected 'text' field). Present keys: ${presentKeys}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      console.log(
        `[tts] incoming len=${text.length} voiceId=${body?.voiceId || 'auto'} keys=${Object.keys(
          body || {},
        ).join(',')}`,
      );
    } catch {
      /* ignore logging errors */
    }
    try {
      const { audioBase64, contentType, voiceId, cached } =
        await this.eleven.synthesize(text, {
          voiceId: body?.voiceId,
          format: body?.format,
        });
      return {
        audio: `data:${contentType};base64,${audioBase64}`,
        voiceId,
        cached,
        contentType,
      };
    } catch (e: unknown) {
      try {
        const msg = e instanceof Error ? e.message : String(e);
        // Minimal log to aid debugging when frontend reports fallback usage
        console.warn('[tts] failure', msg, 'voiceId=', body?.voiceId);
      } catch {
        /* ignore logging errors */
      }
      throw e;
    }
  }

  // Experimental streaming TTS passthrough (no caching).
  // Streams raw audio/mpeg (or chosen format) bytes as they arrive from ElevenLabs.
  @Post('tts-stream')
  async ttsStream(
    @Body()
    body: {
      text?: string;
      voiceId?: string;
      message?: string;
      content?: string;
      format?: 'mp3' | 'opus'; // restrict streaming formats to containerized types
      optimizeStreamingLatency?: number | null;
    },
    @Res() res: Response,
  ) {
    const rawCandidate = [body?.text, body?.message, body?.content].find(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
    const text = (rawCandidate || '').trim();
    if (!text) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing text' });
      return;
    }
    const voiceId = (
      body?.voiceId ||
      process.env.ELEVENLABS_VOICE_ID ||
      'g6xIsTj2HwM6VR4iXFCw'
    ).trim();
    const format = body?.format || 'mp3';
    const apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!apiKey) {
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ error: 'Missing ELEVENLABS_API_KEY env variable' });
      return;
    }
    // ElevenLabs streaming endpoint
    const latencyOpt =
      body?.optimizeStreamingLatency ??
      (process.env.ELEVENLABS_OPTIMIZE_LATENCY
        ? Number(process.env.ELEVENLABS_OPTIMIZE_LATENCY)
        : null);
    const qs = new URLSearchParams();
    if (latencyOpt !== null && Number.isFinite(latencyOpt)) {
      qs.set('optimize_streaming_latency', String(latencyOpt));
    }
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}/stream${qs.toString() ? `?${qs.toString()}` : ''}`;
    const payload: Record<string, unknown> = {
      text,
      // Forward tuning env if present (mirrors non-streaming)
      model_id: process.env.ELEVENLABS_MODEL_ID || undefined,
      voice_settings: {
        stability: Number(process.env.ELEVENLABS_STABILITY || '0.3') || 0.3,
        similarity_boost:
          Number(process.env.ELEVENLABS_SIMILARITY || '0.8') || 0.8,
        style: Number(process.env.ELEVENLABS_STYLE || '0.35') || 0.35,
        use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
      },
      output_format:
        format === 'opus'
          ? 'opus_24000'
          : process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_192',
    };
    res.setHeader(
      'Content-Type',
      format === 'opus' ? 'audio/ogg' : 'audio/mpeg',
    );
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');
    // Allow client to abort
    const controller = new AbortController();
    const abortHandler = () => controller.abort();
    res.on('close', abortHandler);
    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => '');
        res
          .status(HttpStatus.BAD_GATEWAY)
          .json({ error: `ElevenLabs error ${upstream.status}: ${detail}` });
        return;
      }
      console.log(
        `[tts-stream] elevenlabs voice=${voiceId} len=${text.length} latencyOpt=${latencyOpt}`,
      );
      const reader = (upstream.body as unknown as WebReadable).getReader?.();
      if (reader) {
        let total = 0;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value && value.length) {
            res.write(Buffer.from(value));
            total += value.length;
            if (total < 32768) {
              // Early small progress ping (client can ignore)
              // Avoid mixing binary & text; could send timing headers instead. Skipping SSE for simplicity.
            }
          }
        }
      } else {
        // Fallback: read entire buffer (less optimal)
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.write(buf);
      }
    } catch (e: unknown) {
      if (!res.headersSent) {
        res
          .status(HttpStatus.BAD_GATEWAY)
          .json({ error: `Streaming error: ${String(e)}` });
      }
    } finally {
      try {
        res.end();
      } catch {
        /* noop */
      }
      res.off('close', abortHandler);
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
      const sysAsk =
        (typeof body?.system === 'string' && body.system.trim()) || '';
      const askPayload: Record<string, unknown> = {
        model,
        prompt,
        stream: false,
        options: { temperature: 0.2 },
      };
      if (sysAsk) askPayload.system = sysAsk;
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(askPayload),
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
        const askPayload2 = { ...askPayload } as Record<string, unknown>;
        if (sysAsk) askPayload2.system = sysAsk;
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(askPayload2),
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
      const sysStream =
        (typeof body?.system === 'string' && body.system.trim()) || '';
      const streamPayload: Record<string, unknown> = {
        model,
        prompt,
        stream: true,
      };
      if (sysStream) streamPayload.system = sysStream;
      let ollamaRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamPayload),
        signal: ac.signal,
      });
      if (
        !ollamaRes.ok &&
        !process.env.OLLAMA_BASE_URL &&
        this.DEFAULT_BASE.includes('localhost')
      ) {
        base = 'http://127.0.0.1:11434';
        url = `${base}/api/generate`;
        const streamPayload2 = { ...streamPayload } as Record<string, unknown>;
        if (sysStream) streamPayload2.system = sysStream;
        ollamaRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(streamPayload2),
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
