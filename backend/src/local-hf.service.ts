import { Injectable, OnModuleInit } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';
import { promises as fs } from 'node:fs';
import path from 'node:path';

@Injectable()
export class LocalHFService implements OnModuleInit {
  private asr:
    | ((input: unknown, opts?: Record<string, unknown>) => Promise<unknown>)
    | null = null;
  private loading = false;
  private loadError: string | null = null;
  private modelId: string | null = null;

  onModuleInit() {
    // Kick off loading in the background, but don't block app startup.
    void this.ensureLoaded();
  }

  get isReady() {
    return !!this.asr && !this.loading;
  }

  private async ensureLoaded() {
    if (this.asr || this.loading) return;
    this.loading = true;
    this.loadError = null;
    const modelId =
      process.env.LOCALHF_MODEL?.trim() || 'Xenova/whisper-small.en';
    try {
      const asr = await pipeline('automatic-speech-recognition', modelId);
      this.modelId = modelId;
      this.asr = asr as unknown as (
        input: unknown,
        opts?: Record<string, unknown>,
      ) => Promise<unknown>;
    } catch (e: unknown) {
      this.asr = null;
      const msg = e instanceof Error ? e.message : 'failed to load ASR model';
      this.loadError = msg;
      // Log but do not throw to avoid crashing the app
      console.warn('[LocalHF] ASR load failed:', msg);
    } finally {
      this.loading = false;
    }
  }

  getStatus() {
    return {
      ready: !!this.asr && !this.loading,
      loading: this.loading,
      error: this.loadError,
      model:
        this.modelId ||
        process.env.LOCALHF_MODEL?.trim() ||
        'Xenova/whisper-small.en',
    };
  }

  async transcribe(
    audio:
      | ArrayBuffer
      | Uint8Array
      | Blob
      | string
      | { array?: Float32Array; audio?: Float32Array; sampling_rate?: number },
    options?: {
      chunk_length_s?: number;
      stride_length_s?: number;
      return_timestamps?: boolean;
    },
  ): Promise<{ text?: string }> {
    if (!this.asr) await this.ensureLoaded();
    if (!this.asr) {
      throw new Error(
        this.loadError
          ? `ASR unavailable: ${this.loadError}`
          : 'ASR model not ready. Please try again shortly.',
      );
    }
    // If provided a file path or raw bytes for a WAV file, decode to Float32 PCM for Node.
    let input: unknown = audio as unknown;
    // Keep raw (untrimmed) Float32 + rate if we decode WAV so we can retry without trimming
    let rawFloat: Float32Array | null = null;
    let rawRate = 16000;
    try {
      if (typeof audio === 'string') {
        const filePath = audio;
        const ext = path.extname(filePath).toLowerCase();
        const buf = await fs.readFile(filePath);
        const bytes = new Uint8Array(buf);
        if (ext === '.wav' || this.isWavBytes(bytes)) {
          const ab = this.toArrayBuffer(bytes);
          const { array, sampling_rate } = this.decodeWavToFloat32(ab);
          rawFloat = array;
          rawRate = sampling_rate;
          // Debug stats
          try {
            const n = array.length;
            let p = 0;
            let s = 0;
            for (let i = 0; i < n; i++) {
              const v = Math.abs(array[i]);
              if (v > p) p = v;
              s += v * v;
            }
            const rms = Math.sqrt(s / Math.max(1, n));
            console.log(
              `[LocalHF] WAV decoded (path): rate=${sampling_rate}Hz samples=${n} dur=${(n / sampling_rate).toFixed(2)}s peak=${p.toFixed(3)} rms=${rms.toFixed(3)}`,
            );
          } catch {
            // ignore debug stats failure
          }
          const pre = this.preprocessAudio(array, sampling_rate);
          input = {
            array: pre.array,
            sampling_rate: pre.sampling_rate,
          } as const;
        } else {
          // For non-wav types in Node, we cannot rely on AudioContext. Suggest sending WAV.
          throw new Error(
            'Only WAV audio is supported for local transcription in Node.',
          );
        }
      } else if (audio instanceof Uint8Array || audio instanceof ArrayBuffer) {
        let ab: ArrayBuffer;
        if (audio instanceof Uint8Array) {
          const copy = audio.slice();
          ab = copy.buffer;
        } else if (this.isArrayBuffer(audio)) {
          ab = audio;
        } else {
          throw new Error('Unsupported audio buffer type');
        }
        if (this.isWavBytes(new Uint8Array(ab))) {
          const { array, sampling_rate } = this.decodeWavToFloat32(ab);
          rawFloat = array;
          rawRate = sampling_rate;
          // Debug stats
          try {
            const n = array.length;
            let p = 0;
            let s = 0;
            for (let i = 0; i < n; i++) {
              const v = Math.abs(array[i]);
              if (v > p) p = v;
              s += v * v;
            }
            const rms = Math.sqrt(s / Math.max(1, n));
            console.log(
              `[LocalHF] WAV decoded (bytes): rate=${sampling_rate}Hz samples=${n} dur=${(n / sampling_rate).toFixed(2)}s peak=${p.toFixed(3)} rms=${rms.toFixed(3)}`,
            );
          } catch {
            // ignore debug stats failure
          }
          const pre = this.preprocessAudio(array, sampling_rate);
          input = {
            array: pre.array,
            sampling_rate: pre.sampling_rate,
          } as const;
        }
      } else if (typeof Blob !== 'undefined' && audio instanceof Blob) {
        const ab = await audio.arrayBuffer();
        if (this.isWavBytes(new Uint8Array(ab))) {
          const { array, sampling_rate } = this.decodeWavToFloat32(ab);
          rawFloat = array;
          rawRate = sampling_rate;
          // Debug stats
          try {
            const n = array.length;
            let p = 0;
            let s = 0;
            for (let i = 0; i < n; i++) {
              const v = Math.abs(array[i]);
              if (v > p) p = v;
              s += v * v;
            }
            const rms = Math.sqrt(s / Math.max(1, n));
            console.log(
              `[LocalHF] WAV decoded (blob): rate=${sampling_rate}Hz samples=${n} dur=${(n / sampling_rate).toFixed(2)}s peak=${p.toFixed(3)} rms=${rms.toFixed(3)}`,
            );
          } catch {
            // ignore debug stats failure
          }
          const pre = this.preprocessAudio(array, sampling_rate);
          input = {
            array: pre.array,
            sampling_rate: pre.sampling_rate,
          } as const;
        }
      } else if (
        audio &&
        typeof audio === 'object' &&
        ('array' in audio || 'audio' in audio)
      ) {
        // Already in the desired format
        input = audio;
      }
    } catch (err) {
      // Re-throw with clearer message
      const msg = err instanceof Error ? err.message : 'WAV decode failed';
      throw new Error(`Audio decode error: ${msg}`);
    }
    const extractText = (out: unknown): string => {
      try {
        if (!out || typeof out !== 'object') return '';
        const o = out as Record<string, unknown>;
        const txt = o['text'];
        if (typeof txt === 'string' && txt.trim()) return txt.trim();
        // Try common segment containers
        const seq = Array.isArray(o['chunks'])
          ? (o['chunks'] as unknown[])
          : Array.isArray(o['segments'])
            ? (o['segments'] as unknown[])
            : null;
        if (seq && seq.length) {
          const parts: string[] = [];
          for (const el of seq) {
            if (el && typeof el === 'object') {
              const s = (el as Record<string, unknown>)['text'];
              if (typeof s === 'string' && s.trim()) parts.push(s.trim());
            }
          }
          if (parts.length) return parts.join(' ');
        }
      } catch {
        // ignore extract errors
      }
      return '';
    };

    // Try several option/input variants to maximize success
    const tryCalls: Array<{
      input: unknown;
      opts: Record<string, unknown>;
    }> = [];
    const baseOpts = {
      chunk_length_s: options?.chunk_length_s ?? 25,
      stride_length_s: options?.stride_length_s ?? 5,
      return_timestamps: options?.return_timestamps ?? true,
      task: 'transcribe',
    } as const;
    // Variant A: with language + object input
    tryCalls.push({
      input,
      opts: { ...baseOpts, language: 'en' },
    });
    // Variant B: without language (auto)
    tryCalls.push({
      input,
      opts: { ...baseOpts },
    });
    // Variant C: pass Float32Array directly (no wrapper)
    const maybeObj = (input ?? null) as { array?: unknown } | null;
    if (
      maybeObj &&
      typeof maybeObj === 'object' &&
      maybeObj.array instanceof Float32Array
    ) {
      const arr: Float32Array = maybeObj.array;
      tryCalls.push({
        input: arr,
        opts: { ...baseOpts, language: 'en' },
      });
      tryCalls.push({
        input: arr,
        opts: { ...baseOpts },
      });
    }

    for (const call of tryCalls) {
      const out = await this.asr(call.input, call.opts);
      const text = extractText(out);
      try {
        const keys =
          out && typeof out === 'object'
            ? Object.keys(out as Record<string, unknown>)
            : [];
        console.log('[LocalHF] ASR variant:', { keys, textLen: text.length });
      } catch {
        /* ignore logging errors */
      }
      if (text) return { text };
    }
    // Fallback: if we decoded WAV, try again without trimming, only DC remove + normalize and longer chunk
    if (rawFloat && rawFloat.length > 0) {
      const clean = this.normalizeToPeak(this.removeDC(rawFloat));
      const retryIn = {
        array: clean,
        sampling_rate: rawRate,
      } as const;
      const retryVariants: Array<{
        input: unknown;
        opts: Record<string, unknown>;
      }> = [];
      retryVariants.push({
        input: retryIn,
        opts: {
          chunk_length_s: Math.max(30, options?.chunk_length_s ?? 30),
          stride_length_s: options?.stride_length_s ?? 5,
          return_timestamps: true,
          task: 'transcribe',
          language: 'en',
        },
      });
      retryVariants.push({
        input: retryIn,
        opts: {
          chunk_length_s: Math.max(30, options?.chunk_length_s ?? 30),
          stride_length_s: options?.stride_length_s ?? 5,
          return_timestamps: true,
          task: 'transcribe',
        },
      });
      retryVariants.push({
        input: clean,
        opts: {
          chunk_length_s: Math.max(30, options?.chunk_length_s ?? 30),
          stride_length_s: options?.stride_length_s ?? 5,
          return_timestamps: true,
          task: 'transcribe',
          language: 'en',
        },
      });
      for (const call of retryVariants) {
        const out = await this.asr(call.input, call.opts);
        const t = extractText(out);
        try {
          const keys =
            out && typeof out === 'object'
              ? Object.keys(out as Record<string, unknown>)
              : [];
          console.log('[LocalHF] ASR retry variant:', {
            keys,
            textLen: t.length,
          });
        } catch {
          /* ignore logging errors */
        }
        if (t) return { text: t };
      }
      // Final fallback: resample to 16 kHz and retry with longer chunk length
      if (rawRate !== 16000) {
        const resampled = this.resampleLinear(clean, rawRate, 16000);
        const retry16Variants: Array<{
          input: unknown;
          opts: Record<string, unknown>;
        }> = [];
        const obj16 = { array: resampled, sampling_rate: 16000 } as const;
        retry16Variants.push({
          input: obj16,
          opts: {
            chunk_length_s: Math.max(30, options?.chunk_length_s ?? 30),
            stride_length_s: options?.stride_length_s ?? 5,
            return_timestamps: true,
            task: 'transcribe',
            language: 'en',
          },
        });
        retry16Variants.push({
          input: obj16,
          opts: {
            chunk_length_s: Math.max(30, options?.chunk_length_s ?? 30),
            stride_length_s: options?.stride_length_s ?? 5,
            return_timestamps: true,
            task: 'transcribe',
          },
        });
        retry16Variants.push({
          input: resampled,
          opts: {
            chunk_length_s: Math.max(30, options?.chunk_length_s ?? 30),
            stride_length_s: options?.stride_length_s ?? 5,
            return_timestamps: true,
            task: 'transcribe',
            language: 'en',
          },
        });
        for (const call of retry16Variants) {
          const out = await this.asr(call.input, call.opts);
          const t = extractText(out);
          try {
            const keys =
              out && typeof out === 'object'
                ? Object.keys(out as Record<string, unknown>)
                : [];
            console.log('[LocalHF] ASR retry16 variant:', {
              keys,
              textLen: t.length,
            });
          } catch {
            /* ignore logging errors */
          }
          if (t) return { text: t };
        }
      }
      return { text: '' };
    }
    return { text: '' };
  }

  // Back-compat: keep a generate() that proxies to transcribe().
  // Accepts a base64 audio string (with or without data: prefix) or a file path.
  async generate(input: string, options?: { return_timestamps?: boolean }) {
    if (!input) throw new Error('Missing audio input');
    // If it's likely base64, decode to bytes; otherwise treat as file path
    const isDataUrl = /^data:audio\//i.test(input);
    const maybeBase64 = isDataUrl
      ? input.split(',')[1] || ''
      : /^[A-Za-z0-9+/=]+$/.test(input) && input.length > 100
        ? input
        : '';
    if (isDataUrl || maybeBase64) {
      // Derive mime/ext and forward raw WAV bytes to transcribe() so it can run all fallbacks
      let mime = 'audio/webm';
      let b64 = input;
      if (isDataUrl) {
        const [header, data] = input.split(',', 2);
        b64 = data || '';
        const m = /^data:([^;]+);base64/i.exec(header || '');
        if (m && m[1]) mime = m[1];
      }
      const ext = this.extFromMime(mime);
      const buf = Buffer.from(b64, 'base64');
      const bytes = new Uint8Array(buf);
      if (ext === 'wav' || this.isWavBytes(bytes)) {
        return await this.transcribe(bytes, {
          return_timestamps: options?.return_timestamps,
        });
      }
      // For non-wav audio, Node lacks AudioContext; require WAV from client.
      throw new Error(
        'Unsupported audio type for local transcription. Please send 16-bit PCM WAV.',
      );
    }
    // Treat as file path string -> decode WAV and run
    const filePath = input;
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.wav') {
      throw new Error(
        'Only WAV file paths are supported for local transcription.',
      );
    }
    // Let transcribe() handle WAV decoding and fallbacks
    return this.transcribe(filePath, {
      return_timestamps: options?.return_timestamps,
    });
  }

  private extFromMime(mime: string): string {
    const m = mime.toLowerCase();
    if (m.includes('wav')) return 'wav';
    if (m.includes('webm')) return 'webm';
    if (m.includes('ogg') || m.includes('oga')) return 'ogg';
    if (m.includes('mp3')) return 'mp3';
    if (m.includes('m4a') || m.includes('mp4')) return 'm4a';
    return 'bin';
  }

  private isArrayBuffer(x: unknown): x is ArrayBuffer {
    return typeof ArrayBuffer !== 'undefined' && x instanceof ArrayBuffer;
  }

  // --- WAV decoding helpers (16-bit PCM, mono or multi-channel -> mono) ---
  private isWavBytes(bytes: Uint8Array): boolean {
    if (bytes.byteLength < 12) return false;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // 'RIFF' .... 'WAVE'
    return (
      dv.getUint32(0, false) === 0x52494646 && // 'RIFF'
      dv.getUint32(8, false) === 0x57415645 // 'WAVE'
    );
  }

  private decodeWavToFloat32(ab: ArrayBuffer): {
    array: Float32Array;
    sampling_rate: number;
  } {
    const dv = new DataView(ab);
    // Basic RIFF/WAVE validation
    const riff = dv.getUint32(0, false);
    const wave = dv.getUint32(8, false);
    if (riff !== 0x52494646 || wave !== 0x57415645) {
      throw new Error('Not a WAV file');
    }
    let offset = 12; // skip RIFF header
    let audioFormat = 1; // PCM by default
    let numChannels = 1;
    let sampleRate = 16000;
    let bitsPerSample = 16;
    let dataOffset = -1;
    let dataSize = 0;

    // Iterate chunks
    while (offset + 8 <= dv.byteLength) {
      const chunkId = dv.getUint32(offset, false);
      const chunkSize = dv.getUint32(offset + 4, true);
      offset += 8;
      if (chunkId === 0x666d7420) {
        // 'fmt '
        audioFormat = dv.getUint16(offset, true);
        numChannels = dv.getUint16(offset + 2, true);
        sampleRate = dv.getUint32(offset + 4, true);
        // const byteRate = dv.getUint32(offset + 8, true);
        // const blockAlign = dv.getUint16(offset + 12, true);
        bitsPerSample = dv.getUint16(offset + 14, true);
        // There may be extra params if audioFormat != 1
      } else if (chunkId === 0x64617461) {
        // 'data'
        dataOffset = offset;
        dataSize = chunkSize;
      }
      offset += chunkSize;
    }
    if (dataOffset < 0 || dataSize <= 0)
      throw new Error('WAV data chunk not found');
    if (audioFormat !== 1 && audioFormat !== 3) {
      // 1 = PCM, 3 = IEEE float
      throw new Error(
        `Unsupported WAV format (${audioFormat}). Use PCM/IEEE float.`,
      );
    }

    const bytes = new Uint8Array(
      ab,
      dataOffset,
      Math.min(dataSize, ab.byteLength - dataOffset),
    );
    let floatData: Float32Array;
    if (audioFormat === 1) {
      // PCM integer formats
      if (bitsPerSample === 16) {
        const samples = new Int16Array(
          bytes.buffer,
          bytes.byteOffset,
          Math.floor(bytes.byteLength / 2),
        );
        floatData = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          floatData[i] = Math.max(-1, Math.min(1, samples[i] / 0x8000));
        }
      } else if (bitsPerSample === 8) {
        const samples = new Uint8Array(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength,
        );
        floatData = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          floatData[i] = (samples[i] - 128) / 128;
        }
      } else if (bitsPerSample === 24) {
        const n = Math.floor(bytes.byteLength / 3);
        floatData = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const idx = i * 3;
          // 24-bit signed little-endian to 32-bit int
          let x = bytes[idx] | (bytes[idx + 1] << 8) | (bytes[idx + 2] << 16);
          if (x & 0x800000) x |= 0xff000000; // sign extend
          floatData[i] = Math.max(-1, Math.min(1, x / 0x800000));
        }
      } else if (bitsPerSample === 32) {
        // 32-bit PCM (rare); scale from int32
        const samples = new Int32Array(
          bytes.buffer,
          bytes.byteOffset,
          Math.floor(bytes.byteLength / 4),
        );
        floatData = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          floatData[i] = Math.max(-1, Math.min(1, samples[i] / 2147483648));
        }
      } else {
        throw new Error(`Unsupported PCM bit depth: ${bitsPerSample}`);
      }
    } else {
      // IEEE float (format 3)
      if (bitsPerSample !== 32)
        throw new Error(`Unsupported IEEE float bit depth: ${bitsPerSample}`);
      floatData = new Float32Array(
        bytes.buffer,
        bytes.byteOffset,
        Math.floor(bytes.byteLength / 4),
      );
    }

    // If multi-channel, downmix to mono by averaging
    if (numChannels > 1) {
      const frames = Math.floor(floatData.length / numChannels);
      const mono = new Float32Array(frames);
      for (let f = 0; f < frames; f++) {
        let acc = 0;
        for (let c = 0; c < numChannels; c++)
          acc += floatData[f * numChannels + c];
        mono[f] = acc / numChannels;
      }
      floatData = mono;
    }

    return { array: floatData, sampling_rate: sampleRate };
  }

  private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    // Return a standalone ArrayBuffer copy (avoids SharedArrayBuffer or offset issues)
    const copy = bytes.slice();
    return copy.buffer;
  }

  // --- Basic preprocessing helpers: DC removal and normalization ---
  private removeDC(array: Float32Array): Float32Array {
    let sum = 0;
    for (let i = 0; i < array.length; i++) sum += array[i];
    const mean = sum / array.length;
    if (Math.abs(mean) < 1e-4) return array;
    const out = new Float32Array(array.length);
    for (let i = 0; i < array.length; i++) out[i] = array[i] - mean;
    return out;
  }

  private normalizeToPeak(array: Float32Array, target = 0.97): Float32Array {
    let peak = 0;
    for (let i = 0; i < array.length; i++) {
      const v = Math.abs(array[i]);
      if (v > peak) peak = v;
    }
    if (peak <= 0 || peak >= target) return array;
    const gain = target / peak;
    const out = new Float32Array(array.length);
    for (let i = 0; i < array.length; i++) out[i] = array[i] * gain;
    return out;
  }

  // Simple linear resampler to target sample rate (default Whisper input is 16 kHz)
  private resampleLinear(
    input: Float32Array,
    fromRate = 16000,
    toRate = 16000,
  ): Float32Array {
    if (!input.length || fromRate === toRate) return input;
    const ratio = toRate / fromRate;
    const outLen = Math.max(1, Math.round(input.length * ratio));
    const out = new Float32Array(outLen);
    const scale = (input.length - 1) / (outLen - 1);
    for (let i = 0; i < outLen; i++) {
      const srcPos = i * scale;
      const i0 = Math.floor(srcPos);
      const i1 = Math.min(input.length - 1, i0 + 1);
      const t = srcPos - i0;
      out[i] = input[i0] * (1 - t) + input[i1] * t;
    }
    // Normalize lightly to avoid clipping due to interpolation rounding
    return this.normalizeToPeak(out, 0.97);
  }

  // --- Basic preprocessing: trim silence (adaptive) then normalize peak ---
  private preprocessAudio(
    array: Float32Array,
    sampling_rate: number,
  ): { array: Float32Array; sampling_rate: number } {
    const n = array.length;
    if (!n) return { array, sampling_rate };
    // For very short clips (< 1.0s), avoid trimming which can remove quiet speech
    const durSec = n / sampling_rate;
    if (durSec < 1.0) {
      const clean = this.normalizeToPeak(this.removeDC(array));
      return { array: clean, sampling_rate };
    }
    // Allow disabling trimming via env
    if (process.env.LOCALHF_TRIM_SILENCE === 'false') {
      const clean = this.normalizeToPeak(this.removeDC(array));
      return { array: clean, sampling_rate };
    }
    // DC-remove first to stabilize thresholding
    const dcFree = this.removeDC(array);
    // Find absolute peak to build adaptive threshold
    let peak = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.abs(dcFree[i]);
      if (v > peak) peak = v;
    }
    if (peak === 0) return { array: dcFree, sampling_rate };
    // Dynamic threshold: small fraction of peak but not below floor (configurable)
    const peakRatio = Number(process.env.LOCALHF_TRIM_PEAK_RATIO || '0.01');
    const floor = Number(process.env.LOCALHF_TRIM_FLOOR || '0.0005');
    const thresh = Math.max(
      floor,
      peak * (isFinite(peakRatio) && peakRatio > 0 ? peakRatio : 0.01),
    );
    // Minimum voiced duration to consider (in seconds)
    const minVoiceSec = 0.05;
    const minVoiceSamples = Math.floor(minVoiceSec * sampling_rate);
    // Find start/end of voiced region
    let start = 0;
    while (start < n && Math.abs(dcFree[start]) < thresh) start++;
    let end = n - 1;
    while (end > start && Math.abs(dcFree[end]) < thresh) end--;
    // Expand margins by 20ms on both sides
    const margin = Math.floor(0.02 * sampling_rate);
    start = Math.max(0, start - margin);
    end = Math.min(n - 1, end + margin);
    const length = end >= start ? end - start + 1 : 0;
    // If trimming would be too short OR trimmed length is a very small fraction, keep original
    let out =
      length >= minVoiceSamples && length > n * 0.15
        ? dcFree.subarray(start, end + 1)
        : dcFree;
    try {
      const trimmedSec = out.length / sampling_rate;
      console.log(
        `[LocalHF] trim stats dur=${durSec.toFixed(2)}s peak=${peak.toFixed(4)} thresh=${thresh.toFixed(5)} kept=${trimmedSec.toFixed(2)}s ratio=${(out.length / n).toFixed(2)}`,
      );
    } catch {
      /* ignore */
    }
    // Normalize peak
    out = this.normalizeToPeak(out, 0.97);
    return { array: out, sampling_rate };
  }
}
