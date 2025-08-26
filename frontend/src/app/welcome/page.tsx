"use client";
// Voice-only onboarding UI with animated circular "call" interface.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WELCOME_SYSTEM_PROMPT } from "@/lib/prompt";

interface ProfileDraft {
  firstName?: string;
  age?: number;
  favouriteSubjects?: string[];
  hobbies?: string[];
}

type ConversationTurn = { role: "user" | "assistant"; content: string };

export default function WelcomePage() {
  const router = useRouter();
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  // Provided fallback voice ID (will be used if env not set)
  const voiceId =
    process.env.NEXT_PUBLIC_ELEVEN_VOICE_ID || "g6xIsTj2HwM6VR4iXFCw";
  const enableStreaming =
    process.env.NEXT_PUBLIC_STREAM_TTS === "1" || true; // default on for now
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [busy, setBusy] = useState(false); // generic lock (transcribing / saving)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const pendingSpeechRef = useRef<string[]>([]);
  const [needsUserTap, setNeedsUserTap] = useState(false);
  const [usingBackendVoice, setUsingBackendVoice] = useState<boolean | null>(
    null
  ); // null unknown, true=ElevenLabs, false=fallback

  // TTS helper kept early for dependencies
  const speak = useCallback(
    async (text: string) => {
      if (!text) return;
      // If autoplay not unlocked yet, queue and return.
      if (!audioUnlockedRef.current) {
        pendingSpeechRef.current.push(text);
        return;
      }
      setIsSpeaking(true);
      let usedFallback = false;
      try {
        setError(null);
        const tryNonStreaming = async () => {
          const res = await fetch(`${base}/ai/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ text, voiceId, format: "mp3" }),
          });
            const data = (await res.json()) as {
              audio?: string;
              error?: string;
              voiceId?: string;
              cached?: boolean;
              contentType?: string;
            };
            if (!res.ok || !data.audio) {
              const msg = data?.error || `TTS HTTP ${res.status}`;
              throw new Error(msg);
            }
            setUsingBackendVoice(true);
            if (!audioRef.current) {
              const el: HTMLAudioElement & { playsInline?: boolean } = new Audio();
              el.preload = "auto";
              el.crossOrigin = "anonymous";
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              el.playsInline = true;
              audioRef.current = el;
            }
            audioRef.current.src = data.audio;
            await audioRef.current.play();
            await new Promise<void>((resolve) => {
              if (!audioRef.current) return resolve();
              audioRef.current.onended = () => resolve();
              audioRef.current.onerror = () => resolve();
            });
        };

        const tryStreaming = async () => {
          // Basic streaming using MediaSource for MP3.
          if (!enableStreaming) return false;
          if (typeof window === "undefined" || !("MediaSource" in window)) return false;
          const ms = new MediaSource();
          if (!audioRef.current) {
            const el: HTMLAudioElement & { playsInline?: boolean } = new Audio();
            el.preload = "auto";
            el.crossOrigin = "anonymous";
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            el.playsInline = true;
            audioRef.current = el;
          }
          const url = URL.createObjectURL(ms);
          audioRef.current.src = url;
          let sourceBuffer: SourceBuffer | null = null;
          const queue: Uint8Array[] = [];
          let ended = false;
          const appendNext = () => {
            if (!sourceBuffer || sourceBuffer.updating) return;
            const chunk = queue.shift();
            if (chunk) {
              try {
                const ab = chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength
                  ? chunk.buffer
                  : chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
                const view = new Uint8Array(ab as ArrayBuffer);
                sourceBuffer.appendBuffer(view);
              } catch { /* ignore */ }
            } else if (ended) {
              try { ms.endOfStream(); } catch { /* ignore */ }
            }
          };
          ms.addEventListener("sourceopen", () => {
            try {
              // Chrome supports audio/mpeg; Safari may not.
              sourceBuffer = ms.addSourceBuffer("audio/mpeg");
              sourceBuffer.addEventListener("updateend", appendNext);
              appendNext();
            } catch {
              // Fallback to non streaming
              tryNonStreaming().catch(() => {});
            }
          });
          const controller = new AbortController();
          const resp = await fetch(`${base}/ai/tts-stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ text, voiceId, format: "mp3" }),
            signal: controller.signal,
          });
          if (!resp.ok || !resp.body) return false;
          setUsingBackendVoice(true);
          // Start playback as soon as metadata appended (after first buffer)
          (async () => {
            try { await audioRef.current?.play(); } catch { /* autoplay handled elsewhere */ }
          })();
          const reader = resp.body.getReader();
          for (;;) {
            const { value, done } = await reader.read();
            if (done) { ended = true; appendNext(); break; }
            if (value && value.length) {
              queue.push(value);
              appendNext();
            }
          }
          await new Promise<void>((resolve) => {
            if (!audioRef.current) return resolve();
            audioRef.current.onended = () => resolve();
            audioRef.current.onerror = () => resolve();
          });
          return true;
        };

        const streamed = await tryStreaming();
        if (!streamed) {
          await tryNonStreaming();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("TTS error", msg);
        // If this is an HTTP/config error (not an autoplay block) expose it and do NOT fallback automatically
        const isBlock = /NotAllowedError|play\(\) failed/i.test(msg);
        const isConfig = /Missing ELEVENLABS_API_KEY|Missing voiceId|ElevenLabs error|TTS HTTP|network error|ElevenLabs network/i.test(msg);
        if (isConfig && !isBlock) {
          setError(
            `TTS config error: ${msg.replace(/ElevenLabs error [0-9]+: /,'').slice(0,160)}`
          );
        } else {
          // Fallback to Web Speech API only for playback block or generic transient error
          try {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              const synth = window.speechSynthesis;
              if (synth) {
                const utter = new SpeechSynthesisUtterance(text);
                utter.rate = 1.0;
                utter.pitch = 1.0;
                usedFallback = true;
                setUsingBackendVoice(false);
                await new Promise<void>((resolve2) => {
                  utter.onend = () => resolve2();
                  utter.onerror = () => resolve2();
                  synth.speak(utter);
                });
                if (!isBlock) setError(null);
              }
            }
          } catch (fe) {
            console.warn("SpeechSynthesis fallback failed", fe);
          }
        }
        if (!usedFallback && !isConfig) {
          setError((prev) => prev || "Audio playback blocked. Tap the orb once.");
        }
      } finally {
        setIsSpeaking(false);
      }
    },
    [base, voiceId, enableStreaming]
  );

  const saveProfile = useCallback(
    async (parsed?: ProfileDraft) => {
      if (saving || done) return;
      setSaving(true);
      setBusy(true);
      try {
        const payload: ProfileDraft = parsed || draft;
        const res = await fetch(`${base}/user/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("save failed");
        setDone(true);
        await speak("All set! Taking you to your dashboard.");
        setTimeout(() => router.push("/"), 1200);
      } catch {
        setError("Failed to save profile. We can try again.");
      } finally {
        setBusy(false);
        setSaving(false);
      }
    },
    [saving, done, draft, base, speak, router]
  );

  // Auth guard
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${base}/user/me`, { credentials: "include" });
        if (!res.ok) throw new Error("unauth");
      } catch {
        if (alive) {
          router.push("/auth?next=/welcome");
          return;
        }
      } finally {
        if (alive) setAuthChecked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [base, router]);

  const aiAsk = useCallback(
    async (userText?: string) => {
      const history = [...conversation];
      if (userText) history.push({ role: "user", content: userText });
      const transcript = history
        .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
        .join("\n");
      const prompt = `${transcript}\nAssistant:`;
      try {
        const res = await fetch(`${base}/ai/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ prompt, system: WELCOME_SYSTEM_PROMPT }),
        });
        const data = (await res.json()) as { reply?: string };
        const reply = (data.reply || "").trim();
        if (reply) {
          setConversation((c) => [...c, { role: "assistant", content: reply }]);
          await speak(reply.replace(/PROFILE_JSON=.*$/m, ""));
          const m = reply.match(/PROFILE_JSON=(\{.*\})/);
          if (m) {
            try {
              const parsed = JSON.parse(m[1]);
              if (parsed.firstName && typeof parsed.age === "number") {
                setDraft({
                  firstName: parsed.firstName,
                  age: parsed.age,
                  favouriteSubjects: Array.isArray(parsed.favouriteSubjects)
                    ? parsed.favouriteSubjects
                    : [],
                  hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies : [],
                });
                await saveProfile(parsed);
              }
            } catch (e) {
              console.warn("Failed to parse PROFILE_JSON", e);
            }
          }
        }
      } catch {
        setError("AI request failed");
      }
    },
    [base, conversation, speak, saveProfile]
  );

  const begin = useCallback(async () => {
    // Manual friendly introduction + first question, then wait for user speech.
    const intro =
      "Hi there! I'm your friendly space learning guide. We'll set up your profile together so I can tailor fun math adventures just for you. First, what's your first name?";
    setConversation([{ role: "assistant", content: intro }]);
    // Attempt auto unlock (may succeed on some browsers if muted autoplay allowed)
    if (!audioUnlockedRef.current) {
      try {
        const el: HTMLAudioElement & { playsInline?: boolean } = new Audio();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        el.playsInline = true;
        el.muted = true;
        el.preload = "auto";
        el.src =
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQcAAA=="; // tiny silent wav
        await el.play();
        el.pause();
        el.muted = false;
        audioRef.current = el;
        audioUnlockedRef.current = true;
      } catch {
        setNeedsUserTap(true);
      }
    }
    if (audioUnlockedRef.current) {
      await speak(intro);
    } else {
      // Queue intro until user taps
      pendingSpeechRef.current.push(intro);
    }
  }, [speak]);

  useEffect(() => {
    if (authChecked && conversation.length === 0 && !isSpeaking) {
      void begin();
    }
  }, [authChecked, conversation.length, isSpeaking, begin]);

  // (cap helper removed; no longer needed with AI-managed parsing)

  // Extract audio unlock so we can reuse for pointer + keyboard handlers
  const unlockAudioIfNeeded = useCallback(async () => {
    if (audioUnlockedRef.current) return;
    try {
      const win = window as unknown as { AudioContext?: typeof AudioContext };
      const ctx = win.AudioContext ? getSharedAudioContext() : null;
      if (ctx && ctx.state === "suspended") await ctx.resume();
      if (!audioRef.current) {
        const el: HTMLAudioElement & { playsInline?: boolean } = new Audio();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        el.playsInline = true;
        el.muted = true;
        el.src =
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQcAAA==";
        audioRef.current = el;
        await el.play().catch(() => {});
        el.pause();
        el.muted = false;
      } else {
        audioRef.current.muted = true;
        await audioRef.current.play().catch(() => {});
        audioRef.current.pause();
        audioRef.current.muted = false;
      }
      audioUnlockedRef.current = true;
      const queued = [...pendingSpeechRef.current];
      pendingSpeechRef.current = [];
      for (const q of queued) await speak(q);
      setNeedsUserTap(false);
    } catch (e) {
      console.warn("Audio unlock failed", e);
      setNeedsUserTap(true);
    }
  }, [speak]);

  // Deprecated click toggle: now used only to unlock audio for users who tap (short) without holding.
  const handleCentralClick = async () => {
  if (busy || isSpeaking || done || saving) return;
  await unlockAudioIfNeeded();
  if (!recording) await startRecording();
  else stopRecording();
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => processRecording();
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError("Microphone permission denied.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
  };

  const processRecording = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    try {
      const wavDataUrl = await webmBlobToWavDataUrl(blob, 16000);
      await transcribe(wavDataUrl);
    } catch (e) {
      console.warn("Falling back to raw webm send; wav conversion failed", e);
      // Fallback (will fail on backend, but user sees error message prompting retry)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        await transcribe(dataUrl);
      };
      reader.readAsDataURL(blob);
    }
  };

  const transcribe = async (audioDataUrl: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${base}/ai/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audio: audioDataUrl }),
      });
      const data = (await res.json()) as { text?: string };
      const text = (data.text || "").trim();
      if (!text) {
        setError("Didn't catch that. Please try again.");
        return;
      }
      setConversation((c) => [...c, { role: "user", content: text }]);
      await aiAsk(text);
    } catch {
      setError("Transcription failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!authChecked) return <div className="p-6 text-blue-500">Loading…</div>;

  const statusLabel = () => {
    if (saving) return "Saving…";
    if (done) return "Done";
    if (isSpeaking) return "AI speaking…";
  if (recording) return "Recording… tap the orb to stop";
    if (busy) return "Processing…";
    if (!audioUnlockedRef.current)
      return needsUserTap ? "Tap the orb to enable sound" : "Preparing audio…";
  return "Tap the orb to answer";
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row items-stretch relative overflow-hidden">
      {/* Left: Orb */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-8 md:py-0">
        <div
          role="button"
          aria-label="Voice interaction orb"
          tabIndex={0}
          onClick={handleCentralClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              void handleCentralClick();
            }
          }}
          className={`voice-circle ${isSpeaking ? "speaking" : ""} ${recording ? "recording" : ""} ${busy ? "busy" : ""}`}
        >
          {/* Layered decorative rings for richer appearance */}
          <span className="orb-layer orb-core" />
          <span className="orb-layer orb-halo" />
          <span className="orb-layer orb-ring orb-ring-a" />
          <span className="orb-layer orb-ring orb-ring-b" />
          <span className="orb-layer orb-noise" />
          {recording && (
            <div className="absolute inset-0 animate-pulse rounded-full border-4 border-red-400/60" />
          )}
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full speaking-glow" />
          )}
          {!recording && !isSpeaking && !busy && (
            <div className="absolute text-white/60 text-xs md:text-sm tracking-wide font-medium px-4 text-center max-w-[70%] leading-snug">
              {done
                ? "Done"
                : saving
                ? "Saving"
                : conversation.length === 0
                ? "Starting…"
                : statusLabel()}
            </div>
          )}
        </div>
      </div>
      {/* Right: Conversation Text */}
      <div className="relative w-full md:w-1/2 flex items-center justify-center px-6 md:px-12 py-10 md:py-0">
        <div className="w-full max-w-2xl space-y-6">
          {error && (
            <div className="text-red-400 font-semibold text-sm md:text-base animate-fade-in">
              {error}
            </div>
          )}
          {usingBackendVoice !== null && !error && (
            <div className="text-[10px] md:text-xs tracking-wider uppercase text-white/40 font-medium animate-fade-in flex gap-3">
              <span>
                Voice: {usingBackendVoice ? "ElevenLabs" : "Browser Fallback"}
              </span>
              {!audioUnlockedRef.current && needsUserTap && (
                <span className="text-amber-300/70">Tap orb to enable sound</span>
              )}
            </div>
          )}
          {(() => {
            const lastAssistantRaw = conversation
              .filter((t) => t.role === "assistant")
              .slice(-1)[0]?.content;
            const lastAssistant = lastAssistantRaw
              ? lastAssistantRaw.split(/PROFILE_JSON=/)[0]
              : undefined;
            const lastUser = conversation
              .filter((t) => t.role === "user")
              .slice(-1)[0]?.content;
            const mainDisplay = recording
              ? "Speak now…"
              : isSpeaking
              ? lastAssistant || "AI replying…"
              : lastAssistant || (conversation.length === 0 ? "" : statusLabel());
            return (
              <div className="space-y-6">
                <div
                  key={`${conversation.length}-assistant`}
                  className="assistant-line text-2xl sm:text-3xl md:text-5xl leading-tight font-light tracking-tight whitespace-pre-wrap animate-big-slide"
                >
                  {mainDisplay}
                </div>
                <div className="space-y-3">
                  {lastUser && (
                    <div
                      key={`${conversation.length}-user`}
                      className="user-line text-lg md:text-2xl text-emerald-300/80 italic font-normal animate-fade-slide"
                    >
                      You: {lastUser}
                    </div>
                  )}
                  {!recording && !isSpeaking && !done && !saving && (
                    <div className="text-xs md:text-sm text-white/40 tracking-wide animate-fade-in">
                      {statusLabel()}
                    </div>
                  )}
                  {done && (
                    <div className="text-xl md:text-2xl text-emerald-300 font-medium animate-fade-in">
                      Profile saved! Redirecting…
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      <style jsx>{`
        .voice-circle {
          position: relative;
          width: min(70vw, 460px);
          height: min(70vw, 460px);
          border-radius: 50%;
          background: radial-gradient(circle at 50% 55%, #05140c 0%, #020402 65%, #000 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: orbBreath 7.2s ease-in-out infinite;
          transition: transform 0.55s cubic-bezier(0.4, 0.14, 0.3, 1),
            box-shadow 0.9s ease, filter 0.9s ease;
        }
        .voice-circle.speaking {
          animation: orbBreathFast 3.6s ease-in-out infinite;
          transform: scale(1.03);
        }
        .voice-circle.speaking .orb-core {
          animation-duration: 2.2s;
          filter: brightness(1.35) saturate(1.25);
        }
        .voice-circle.speaking .orb-halo {
          opacity: 0.55;
        }
        .voice-circle.speaking .orb-ring {
          animation-play-state: running;
          opacity: 0.7;
        }
        .voice-circle.recording {
          transform: scale(1.06);
          box-shadow: 0 0 22px -4px rgba(255, 0, 90, 0.55),
            0 0 90px -20px rgba(255, 80, 160, 0.35);
        }
        .voice-circle.busy:not(.speaking):not(.recording) {
          filter: brightness(0.9) saturate(0.9);
        }
        .voice-circle.recording::before,
        .voice-circle.recording::after {
          filter: hue-rotate(90deg) saturate(150%);
        }
        .speaking-glow {
          background: radial-gradient(
            circle at 50% 50%,
            rgba(0, 255, 140, 0.25),
            transparent 70%
          );
          filter: blur(20px);
          animation: speakGlow 1.4s ease-in-out infinite;
        }
        /* Orb layered elements */
        .orb-layer { position:absolute; inset:0; pointer-events:none; }
        .orb-core {
          background:
            radial-gradient(circle at 50% 45%, rgba(60,255,170,0.25), transparent 60%),
            radial-gradient(circle at 55% 60%, rgba(0,180,100,0.18), transparent 70%),
            radial-gradient(circle at 40% 55%, rgba(0,255,150,0.22), transparent 62%);
          mix-blend-mode: screen;
          animation: coreShift 5.5s ease-in-out infinite;
          opacity: 0.9;
        }
        .orb-halo {
          background: radial-gradient(circle, rgba(0,255,140,0.28) 0%, rgba(0,250,150,0.18) 25%, rgba(0,120,80,0.05) 55%, transparent 70%);
          filter: blur(38px) saturate(120%);
          animation: haloPulse 6.8s ease-in-out infinite;
          opacity: 0.4;
        }
        .orb-ring {
          border-radius:50%;
          box-shadow:0 0 30px -6px rgba(0,255,140,0.4),0 0 60px -12px rgba(0,255,160,0.22);
          mix-blend-mode: screen;
          opacity:0.25;
          animation: ringOrbit linear infinite;
          animation-play-state: paused;
        }
        .orb-ring-a { inset:6%; border:1.5px solid rgba(0,255,150,0.25); animation-duration:11s; }
        .orb-ring-b { inset:14%; border:1px solid rgba(0,255,160,0.18); animation-duration:16s; animation-direction:reverse; }
        .orb-noise {
          background: repeating-radial-gradient(circle at 48% 52%, rgba(0,255,170,0.08), rgba(0,255,170,0.02) 3.5%, transparent 9%);
          mix-blend-mode: overlay;
          animation: grain 9s steps(60) infinite;
          opacity:0.25;
        }
        /* Assistant gradient text */
        .assistant-line {
          background: linear-gradient(90deg, #ffffff, #b5ffe1 45%, #72ffcf 80%);
          -webkit-background-clip: text;
          color: transparent;
        }
        @keyframes bigSlide {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); letter-spacing: 0.5px; }
          55% { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 0; }
        }
        .animate-big-slide { animation: bigSlide 820ms cubic-bezier(0.33,0.05,0.18,0.99); }
        @keyframes fadeSlideSoft {
          0% { opacity:0; transform: translateY(6px); }
          100% { opacity:1; transform: translateY(0); }
        }
        .animate-fade-slide { animation: fadeSlideSoft 500ms ease; }
        .animate-fade-in { animation: fadeIn 600ms ease; }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes orbBreath {
          0%,100% { transform:scale(1); box-shadow:0 0 42px -14px rgba(0,255,140,0.30),0 0 120px -50px rgba(0,180,120,0.18);} 
          50% { transform:scale(1.018); box-shadow:0 0 66px -12px rgba(0,255,160,0.55),0 0 180px -48px rgba(0,210,170,0.28);} 
        }
        @keyframes orbBreathFast {
          0%,100% { transform:scale(1.03); box-shadow:0 0 68px -14px rgba(0,255,160,0.55),0 0 190px -46px rgba(0,255,170,0.32);} 
          50% { transform:scale(1.045); box-shadow:0 0 96px -10px rgba(0,255,170,0.75),0 0 240px -36px rgba(0,255,180,0.4);} 
        }
        @keyframes coreShift {
          0%,100% { transform: translate(-2%, -1%) scale(1); }
          33% { transform: translate(3%, 2%) scale(1.015); }
          66% { transform: translate(-1%, 3%) scale(0.985); }
        }
        @keyframes haloPulse {
          0%,100% { opacity:0.35; }
          50% { opacity:0.55; }
        }
        @keyframes ringOrbit {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.015); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes grain { to { transform:translate3d(0,0,0);} }
        /* Text animations */
        .fade-slide {
          animation: fadeSlide 480ms cubic-bezier(0.33, 0.05, 0.18, 0.99);
        }
        .fade-in {
          animation: fadeIn 720ms ease;
        }
        .fade-in-fast {
          animation: fadeIn 360ms ease;
        }
        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        /* Smooth subtle wobble used while speaking (applied to inner layers via parent) */
        .voice-circle.speaking .orb-core,
        .voice-circle.speaking .orb-halo,
        .voice-circle.speaking .orb-ring-a,
        .voice-circle.speaking .orb-ring-b {
          animation-name: coreShift, ringOrbit;
        }
        @keyframes speakGlow {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

// --- Audio conversion helpers (client-side) ---
async function webmBlobToWavDataUrl(
  blob: Blob,
  targetRate = 16000
): Promise<string> {
  const arrayBuf = await blob.arrayBuffer();
  // Decode via AudioContext
  const audioCtx = getSharedAudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
  // Downmix to mono
  const length = decoded.length;
  const tmp = new Float32Array(length);
  const channels = decoded.numberOfChannels;
  for (let ch = 0; ch < channels; ch++) {
    const data = decoded.getChannelData(ch);
    for (let i = 0; i < length; i++) tmp[i] += data[i] / channels;
  }
  // Resample if needed
  const pcm =
    decoded.sampleRate === targetRate
      ? tmp
      : resampleLinearFloat32(tmp, decoded.sampleRate, targetRate);
  // Convert float -1..1 to 16-bit PCM
  const pcm16 = floatTo16BitPCM(pcm);
  const wavBuffer = encodeWavPCM16(pcm16, targetRate, 1);
  const uint8 = new Uint8Array(wavBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++)
    binary += String.fromCharCode(uint8[i]);
  const b64 =
    typeof window !== "undefined"
      ? btoa(binary)
      : Buffer.from(uint8).toString("base64");
  return `data:audio/wav;base64,${b64}`;
}

let _audioCtx: AudioContext | null = null;
function getSharedAudioContext(): AudioContext {
  if (typeof window === "undefined") throw new Error("No window");
  if (_audioCtx) return _audioCtx;
  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = win.AudioContext || win.webkitAudioContext;
  if (!Ctx) throw new Error("AudioContext not supported");
  _audioCtx = new Ctx();
  if (_audioCtx.state === "suspended") void _audioCtx.resume().catch(() => {});
  return _audioCtx;
}

function resampleLinearFloat32(
  input: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = toRate / fromRate;
  const outLen = Math.round(input.length * ratio);
  const out = new Float32Array(outLen);
  const scale = (input.length - 1) / (outLen - 1);
  for (let i = 0; i < outLen; i++) {
    const pos = i * scale;
    const i0 = Math.floor(pos);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = pos - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    out[i] = s;
  }
  return out;
}

function encodeWavPCM16(
  samples: Int16Array,
  sampleRate: number,
  channels: number
): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }
  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++)
    view.setUint8(offset + i, str.charCodeAt(i));
}
