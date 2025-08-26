import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface TTSOptions {
  voiceId?: string;
  modelId?: string; // future use if selecting different models
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  optimizeStreamingLatency?: number | null;
  format?: 'mp3' | 'opus' | 'pcm_16000';
}

@Injectable()
export class ElevenLabsService {
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';
  private memoryCache = new Map<string, { b64: string; ts: number }>();
  private readonly maxCache = 50;
  private readonly ttlMs = 1000 * 60 * 10; // 10 minutes

  private get apiKey(): string {
    const key = process.env.ELEVENLABS_API_KEY || '';
    if (!key) {
      throw new HttpException(
        'Missing ELEVENLABS_API_KEY env variable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return key.trim();
  }

  async synthesize(
    text: string,
    opts: TTSOptions = {},
  ): Promise<{
    audioBase64: string;
    contentType: string;
    voiceId: string;
    cached: boolean;
  }> {
    const clean = (text || '').trim();
    if (!clean) {
      throw new HttpException('Missing text', HttpStatus.BAD_REQUEST);
    }
    if (clean.length > 5000) {
      throw new HttpException(
        'Text too long (max 5000 characters for single request)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const voiceId = (
      opts.voiceId ||
      process.env.ELEVENLABS_VOICE_ID ||
      'g6xIsTj2HwM6VR4iXFCw'
    ).trim();
    if (!voiceId) {
      throw new HttpException(
        'Missing voiceId (provide body.voiceId or ELEVENLABS_VOICE_ID)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const format = opts.format || 'mp3';
    const key = `v=${voiceId}|f=${format}|t=${clean}`;
    // Basic in-memory cache to avoid repeated billing for identical prompts.
    const now = Date.now();
    const cached = this.memoryCache.get(key);
    if (cached && now - cached.ts < this.ttlMs) {
      try {
        console.log(
          `[tts] elevenlabs voice=${voiceId} len=${clean.length} cached=true (memory)`,
        );
      } catch {
        /* logging failed */
      }
      return {
        audioBase64: cached.b64,
        contentType: this.formatToContentType(format),
        voiceId,
        cached: true,
      };
    }

    const url = `${this.baseUrl}/text-to-speech/${encodeURIComponent(voiceId)}`;
    const headers: Record<string, string> = {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    };

    // Allow env overrides for tuning so user can adjust "bland" voice without code changes
    const envNum = (name: string, fallback: number): number => {
      const raw = process.env[name];
      if (!raw) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const bodyPayload: Record<string, unknown> = {
      text: clean,
      model_id: opts.modelId || process.env.ELEVENLABS_MODEL_ID || undefined,
      voice_settings: {
        stability: opts.stability ?? envNum('ELEVENLABS_STABILITY', 0.3), // lower => more variation
        similarity_boost:
          opts.similarityBoost ?? envNum('ELEVENLABS_SIMILARITY', 0.8),
        style: opts.style ?? envNum('ELEVENLABS_STYLE', 0.35),
        use_speaker_boost:
          opts.useSpeakerBoost ??
          process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
      },
      optimize_streaming_latency:
        opts.optimizeStreamingLatency ??
        (process.env.ELEVENLABS_OPTIMIZE_LATENCY
          ? Number(process.env.ELEVENLABS_OPTIMIZE_LATENCY)
          : null),
      output_format: this.mapOutputFormat(format),
    };

    let res: Response;
    const start = Date.now();
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'network error';
      throw new HttpException(
        `ElevenLabs network error: ${msg}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (!res.ok) {
      let detail = '';
      try {
        detail = await res.text();
      } catch {
        /* noop */
      }
      throw new HttpException(
        `ElevenLabs error ${res.status}: ${detail.slice(0, 300)}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const arrayBuf = await res.arrayBuffer();
    const b64 = Buffer.from(arrayBuf).toString('base64');
    this.remember(key, b64);
    try {
      // Minimal log to verify voice usage without dumping full text
      console.log(
        `[tts] elevenlabs voice=${voiceId} len=${clean.length}ms=${Date.now() - start} cached=false`,
      );
    } catch {
      /* ignore logging errors */
    }
    return {
      audioBase64: b64,
      contentType: this.formatToContentType(format),
      voiceId,
      cached: false,
    };
  }

  private remember(key: string, b64: string) {
    this.memoryCache.set(key, { b64, ts: Date.now() });
    if (this.memoryCache.size > this.maxCache) {
      // Simple LRU-ish deletion of oldest
      const entries = [...this.memoryCache.entries()].sort(
        (a, b) => a[1].ts - b[1].ts,
      );
      const remove = entries.slice(0, this.memoryCache.size - this.maxCache);
      for (const r of remove) this.memoryCache.delete(r[0]);
    }
  }

  private mapOutputFormat(fmt: string): string {
    // Allow override for mp3 quality via env ELEVENLABS_OUTPUT_FORMAT
    const override = process.env.ELEVENLABS_OUTPUT_FORMAT;
    if (fmt === 'mp3' && override) return override;
    switch (fmt) {
      case 'opus':
        return 'opus_24000';
      case 'pcm_16000':
        return 'pcm_16000';
      case 'mp3':
      default:
        // Use higher quality by default
        return 'mp3_44100_192';
    }
  }

  private formatToContentType(fmt: string): string {
    switch (fmt) {
      case 'opus':
        return 'audio/ogg';
      case 'pcm_16000':
        return 'audio/wav'; // raw PCM might need container; signaling wav for browser ease
      case 'mp3':
      default:
        return 'audio/mpeg';
    }
  }
}
