"use client";

import React, { useState, useRef } from "react";

// Phaser Game React Component using TypeScript
import dynamic from "next/dynamic";
const PhaserBubbleGame = dynamic(() => import("./PhaserBubbleGame"), {
  ssr: false,
});
import Link from "next/link";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// Types for branching logic
type LessonEventPayload = {
  answer?: number;
  [key: string]: unknown;
};
type BranchFn = (payload: LessonEventPayload, prevStep: number) => string;
type Step = {
  icon: string;
  title: string;
  lesson: React.ReactNode;
  aiExamples: { q: string; a: string }[];
  trigger: string;
  next: string | null | BranchFn;
};

// Advanced branching lesson/game script
const lessonScript: Step[] = [
  {
    icon: "🎮",
    title: "How to Play",
    lesson: (
      <div
        className="text-blue-100 text-lg"
        style={{ textShadow: "0 0 10px #93c5fd" }}
      >
        <b>Hi, Space Kid! 🚀</b>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            Tap <b>Blue gun</b> to make <b>1 dot</b>. ➕
          </li>
          <li>
            Tap <b>Pink gun</b> to take <b>1 away</b>. ➖
          </li>
          <li>
            Tap on the big space to <b>place dots</b>. ✨
          </li>
          <li>
            <b>Double‑tap the Blue Gun</b> to shoot <b>two</b>. 🎯
          </li>
          <li>
            Use the <b>color</b> button: <b>blue → green → red</b> (new dots
            only). 🎨
          </li>
          <li>
            Press <b>Clear Button</b> to erase all. 🧹
          </li>
        </ul>
        <div className="mt-3 flex items-center justify-center">
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-2 text-base font-quicksand shadow-lg border-2 border-blue-300"
            style={{ boxShadow: "0 0 10px #60a5fa" }}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("tutorial-understood"));
              }
            }}
          >
            Understood
          </Button>
        </div>
      </div>
    ),
    aiExamples: [
      {
        q: "How do I add dots?",
        a: "Tap + then tap the space to place a dot.",
      },
      {
        q: "How do I change color?",
        a: "Tap the color button to go blue → green → red. New dots use the new color.",
      },
    ],
    trigger: "tutorial",
    next: "start",
  },
  {
    icon: "🚀",
    title: "Start of Game",
    lesson: (
      <div className="text-blue-200">
        <b>
          Captain! 🪐 We’re in space and we need to launch 3 laser blasts! to
          save the Galaxy! <br />
          Ready to fire? 3… 2… 1… GO!
        </b>
      </div>
    ),
    aiExamples: [
      {
        q: "What do I do first?",
        a: "Get ready to launch three laser blasts! Countdown: 3… 2… 1… GO!",
      },
    ],
    trigger: "start",
    next: "shooting",
  },
  {
    icon: "🔫",
    title: "While Shooting",
    lesson: (
      <div className="text-blue-200">
        <b>
          Laser one — zzzap!
          <br />
          Laser two — boom!
          <br />
          Laser three — ka-pow!
        </b>
      </div>
    ),
    aiExamples: [],
    trigger: "shooting",
    // Branch: after shooting, next puzzle depends on round
    next: (_payload, prevStep) => {
      // Example: after first round, go to puzzle, after second round, go to harder puzzle
      if (prevStep === 1) return "puzzle";
      if (prevStep === 6) return "puzzle2";
      return "puzzle";
    },
  },
  {
    icon: "🧩",
    title: "After Shooting",
    lesson: (
      <div className="text-blue-200">
        Mission complete! You fired 3 lasers.
        <br />
        Now fire <b>1 more laser</b>!<br />
        How many are there now?
      </div>
    ),
    aiExamples: [
      {
        q: "What happens after shooting?",
        a: "You completed your mission and now must fire one more laser, then count them all!",
      },
    ],
    trigger: "puzzle",
    next: (payload) => (payload && payload.answer === 4 ? "correct" : "wrong"),
  },
  {
    icon: "🌟",
    title: "If Correct",
    lesson: (
      <div className="text-blue-200">
        Stellar job, Captain! 🌟 You saved the galaxy!
      </div>
    ),
    aiExamples: [
      {
        q: "What if I get the answer right?",
        a: "Stellar job, Captain! You saved the galaxy!",
      },
    ],
    trigger: "correct",
    next: "add-test-start",
  },
  {
    icon: "❌",
    title: "If Wrong",
    lesson: (
      <div className="text-blue-200">
        Almost! The answer is 4. Let’s try again on the next planet.
      </div>
    ),
    aiExamples: [
      {
        q: "What if I get it wrong?",
        a: "Almost! The answer is four. Let’s try again on the next planet.",
      },
    ],
    trigger: "wrong",
    next: "sub-start",
  },
  // Mini test after Addition
  {
    icon: "🧪",
    title: "Addition Checkpoint",
    lesson: (
      <div className="text-blue-200">
        <b>Quick Check:</b> Answer one question to proceed.
      </div>
    ),
    aiExamples: [],
    trigger: "add-test-start",
    next: "add-test-q1",
  },
  {
    icon: "➕",
    title: "Add Test Q1",
    lesson: (
      <div className="text-blue-200">
        What is <b>1 + 3</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "add-test-q1",
    next: (p) => (p && p.answer === 4 ? "sub-start" : "add-test-q1"),
  },
  // Subtraction lesson sequence
  {
    icon: "🛰️",
    title: "Subtraction Mission",
    lesson: (
      <div className="text-blue-200">
        <b>New mission!</b> We have <b>4 lasers</b> ready. Switch to the{" "}
        <b>subtraction blaster</b> and zap <b>1</b> away.
      </div>
    ),
    aiExamples: [
      {
        q: "What is subtraction?",
        a: "Subtraction means taking away. If you have four and zap one, you have three left.",
      },
    ],
    trigger: "sub-start",
    next: "shooting-sub",
  },
  {
    icon: "🔻",
    title: "Subtract One",
    lesson: (
      <div className="text-blue-200">
        Zap one laser so that only <b>three</b> remain.
      </div>
    ),
    aiExamples: [],
    trigger: "shooting-sub",
    next: "sub-puzzle",
  },
  {
    icon: "🧩",
    title: "Subtraction Check",
    lesson: (
      <div className="text-blue-200">
        We had 4 lasers and we zapped 1 away. <b>How many are left?</b>
      </div>
    ),
    aiExamples: [],
    trigger: "sub-puzzle",
    next: (payload) =>
      payload && payload.answer === 3 ? "sub-correct" : "sub-wrong",
  },
  {
    icon: "🌟",
    title: "If Correct (Subtraction)",
    lesson: (
      <div className="text-blue-200">
        Brilliant! 4 minus 1 equals 3. 🚀 Ready for the next mission?
      </div>
    ),
    aiExamples: [],
    trigger: "sub-correct",
    next: "sub-test-start",
  },
  {
    icon: "❌",
    title: "If Wrong (Subtraction)",
    lesson: (
      <div className="text-blue-200">
        Almost! 4 minus 1 is <b>3</b>. You can try again!
      </div>
    ),
    aiExamples: [],
    trigger: "sub-wrong",
    next: "sub-start",
  },
  // Mini test after Subtraction
  {
    icon: "🧪",
    title: "Subtraction Checkpoint",
    lesson: (
      <div className="text-blue-200">
        <b>Quick Check:</b> One subtraction question.
      </div>
    ),
    aiExamples: [],
    trigger: "sub-test-start",
    next: "sub-test-q1",
  },
  {
    icon: "➖",
    title: "Sub Test Q1",
    lesson: (
      <div className="text-blue-200">
        What is <b>5 − 2</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "sub-test-q1",
    next: (p) => (p && p.answer === 3 ? "mul-start" : "sub-test-q1"),
  },
  // Multiplication lesson sequence (2 x 2)
  {
    icon: "✖️",
    title: "Multiplication Mission",
    lesson: (
      <div className="text-blue-200">
        <b>Multiplication time!</b> We’ll make <b>2 groups</b> of{" "}
        <b>2 lasers</b>. Tap to place a small cluster.
      </div>
    ),
    aiExamples: [
      {
        q: "What is multiplication?",
        a: "Multiplication is repeated addition. 2 groups of 2 equals 4.",
      },
    ],
    trigger: "mul-start",
    next: "mul-shoot",
  },
  {
    icon: "🔆",
    title: "Place Two Groups",
    lesson: (
      <div className="text-blue-200">
        Place <b>two clusters</b>, each of <b>2 lasers</b>. That makes 2 x 2.
      </div>
    ),
    aiExamples: [],
    trigger: "mul-shoot",
    next: "mul-puzzle",
  },
  {
    icon: "🧩",
    title: "Multiplication Check",
    lesson: (
      <div className="text-blue-200">
        We made <b>2 groups of 2</b>. <b>How many lasers in total?</b>
      </div>
    ),
    aiExamples: [],
    trigger: "mul-puzzle",
    next: (p) => (p && p.answer === 4 ? "mul-correct" : "mul-wrong"),
  },
  {
    icon: "🌟",
    title: "If Correct (Multiplication)",
    lesson: <div className="text-blue-200">Awesome! 2 × 2 = 4. 🚀</div>,
    aiExamples: [],
    trigger: "mul-correct",
    next: "mul-test-start",
  },
  {
    icon: "❌",
    title: "If Wrong (Multiplication)",
    lesson: (
      <div className="text-blue-200">
        Close! 2 × 2 is <b>4</b>. Try again!
      </div>
    ),
    aiExamples: [],
    trigger: "mul-wrong",
    next: "mul-start",
  },
  // Mini test after Multiplication
  {
    icon: "🧪",
    title: "Multiplication Checkpoint",
    lesson: (
      <div className="text-blue-200">
        <b>Quick Check:</b> One multiplication question.
      </div>
    ),
    aiExamples: [],
    trigger: "mul-test-start",
    next: "mul-test-q1",
  },
  {
    icon: "✖️",
    title: "Mul Test Q1",
    lesson: (
      <div className="text-blue-200">
        What is <b>3 × 2</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "mul-test-q1",
    next: (p) => (p && p.answer === 6 ? "div-start" : "mul-test-q1"),
  },
  // Division lesson sequence (4 ÷ 2)
  {
    icon: "➗",
    title: "Division Mission",
    lesson: (
      <div className="text-blue-200">
        <b>Division time!</b> Use the blaster to make <b>4 lasers</b>, then
        we’ll split them into <b>2 equal groups</b>.
      </div>
    ),
    aiExamples: [
      {
        q: "What is division?",
        a: "Division means fair sharing into equal groups. 4 split into 2 groups gives 2 each.",
      },
    ],
    trigger: "div-start",
    next: "div-shoot",
  },
  {
    icon: "🟣",
    title: "Split Into Two",
    lesson: (
      <div className="text-blue-200">
        Make <b>4 lasers</b> using the blaster. Now imagine splitting them into{" "}
        <b>two equal groups</b>. How many in each?
      </div>
    ),
    aiExamples: [],
    trigger: "div-shoot",
    next: "div-puzzle",
  },
  {
    icon: "🧩",
    title: "Division Check",
    lesson: (
      <div className="text-blue-200">
        4 lasers split into 2 equal groups. <b>How many in each group?</b>
      </div>
    ),
    aiExamples: [],
    trigger: "div-puzzle",
    next: (p) => (p && p.answer === 2 ? "div-correct" : "div-wrong"),
  },
  {
    icon: "🌟",
    title: "If Correct (Division)",
    lesson: <div className="text-blue-200">Great! 4 ÷ 2 = 2. ⭐</div>,
    aiExamples: [],
    trigger: "div-correct",
    next: "final-start",
  },
  {
    icon: "❌",
    title: "If Wrong (Division)",
    lesson: (
      <div className="text-blue-200">
        Not quite. 4 ÷ 2 is <b>2</b>. Try again!
      </div>
    ),
    aiExamples: [],
    trigger: "div-wrong",
    next: "div-start",
  },
  // Final mixed-operations test
  {
    icon: "🏁",
    title: "Final Test",
    lesson: (
      <div className="text-blue-200">
        <b>Final Mission!</b> Four quick questions. Answer to complete your
        training.
      </div>
    ),
    aiExamples: [
      {
        q: "What is this?",
        a: "A quick mixed-operations test: addition, subtraction, multiplication, division.",
      },
    ],
    trigger: "final-start",
    next: "final-q1",
  },
  {
    icon: "1️⃣",
    title: "Final Q1: Addition",
    lesson: (
      <div className="text-blue-200">
        What is <b>2 + 3</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "final-q1",
    next: (p) => (p && p.answer === 5 ? "final-q2" : "final-q1"),
  },
  {
    icon: "2️⃣",
    title: "Final Q2: Subtraction",
    lesson: (
      <div className="text-blue-200">
        What is <b>5 − 2</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "final-q2",
    next: (p) => (p && p.answer === 3 ? "final-q3" : "final-q2"),
  },
  {
    icon: "3️⃣",
    title: "Final Q3: Multiplication",
    lesson: (
      <div className="text-blue-200">
        What is <b>2 × 3</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "final-q3",
    next: (p) => (p && p.answer === 6 ? "final-q4" : "final-q3"),
  },
  {
    icon: "4️⃣",
    title: "Final Q4: Division",
    lesson: (
      <div className="text-blue-200">
        What is <b>8 ÷ 2</b>?
      </div>
    ),
    aiExamples: [],
    trigger: "final-q4",
    next: (p) => (p && p.answer === 4 ? "final-complete" : "final-q4"),
  },
  {
    icon: "🎉",
    title: "Final Complete",
    lesson: (
      <div className="text-blue-200">
        Outstanding! 🏆 You finished the final test. You’re a Space Math Ace!
      </div>
    ),
    aiExamples: [],
    trigger: "final-complete",
    next: "start",
  },
];

import {
  Send,
  Mic,
  MicOff,
  Brain,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Divide,
  HelpCircle,
  Info,
  Star,
} from "lucide-react";

function AiMathPage() {
  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  // All hooks must be called unconditionally at the top
  const lasersFiredRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [chat, setChat] = useState<{ id: string; q: string; a: string }[]>([]);
  const MAX_CHAT_ITEMS = 3;
  // Track DOM nodes for each chat item so we can remove ones that scroll below the viewport
  const chatItemRefs = useRef(new Map<string, HTMLElement>());
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const makeId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [input, setInput] = useState("");
  const [dotCount, setDotCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  // WAV recorder (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | AudioWorkletNode | null>(
    null
  );
  const streamRef = useRef<MediaStream | null>(null);
  // Live frequency indicator
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const freqCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // WhatsApp-like timer while recording
  const recordStartRef = useRef<number | null>(null);
  const [elapsedStr, setElapsedStr] = useState<string>("00:00");
  const lastTimeUpdateRef = useRef<number>(0);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(16000);
  const ttsVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [voicesReady, setVoicesReady] = useState(false);
  const isSpeakingRef = useRef(false);
  // Fallback timer + token to ensure we always emit tts-ended even if onend never fires
  const ttsTimerRef = useRef<number | null>(null);
  const ttsTokenRef = useRef(0);
  // TTS user-activation gate (Chrome deprecation: speak() without user gesture)
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const pendingTtsRef = useRef<string | null>(null);
  const userActedRef = useRef(false);
  // Removed unused answer and audioRef
  const [lessonStep, setLessonStep] = useState(0);
  const lessonStepRef = useRef(0);
  const [phaserReady, setPhaserReady] = useState(false);
  // Removed unused lasersFired state
  const current = lessonScript[lessonStep];

  // --- TTS (Text-to-Speech) ---
  // Helper to extract plain text from ReactNode
  function extractText(node: React.ReactNode): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return node.toString();
    if (!node) return "";
    if (Array.isArray(node)) return node.map(extractText).join(" ");
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      if (element.props && element.props.children) {
        return extractText(element.props.children);
      }
    }
    return "";
  }

  // Remove emojis from text for TTS
  function removeEmojis(text: string): string {
    // Regex matches most common emojis
    return text
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d]+/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // TTS voice selection and speaking
  function pickVoice(
    voices: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice | undefined {
    const en = voices.filter(
      (v) => v.lang && v.lang.toLowerCase().startsWith("en")
    );
    const by = (pred: (v: SpeechSynthesisVoice) => boolean) => en.find(pred);
    // Priority: Google female -> Google English -> female-named English -> known female MS voices -> any Google English -> any English
    return (
      by((v) => /google/i.test(v.name) && /female/i.test(v.name)) ||
      by((v) => /google/i.test(v.name)) ||
      by((v) => /female|woman/i.test(v.name)) ||
      by((v) => /zira|jenny|aria|sara/i.test(v.name)) ||
      by((v) => /google/i.test(v.name)) ||
      en[0]
    );
  }

  function speakLesson(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // If not yet unlocked by a user gesture, defer speaking until activation
    if (!ttsEnabled) {
      pendingTtsRef.current = text;
      return;
    }
    const synth = window.speechSynthesis;
    // Clear any previous fallback timer
    if (ttsTimerRef.current) {
      clearTimeout(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }
    const speakNow = () => {
      try {
        synth.cancel();
      } catch {}
      // Bump token to invalidate previous utterances/timers
      const myToken = ++ttsTokenRef.current;
      // Estimate duration as a fallback if onend never fires (autoplay blocked or no voice)
      const words = text.split(/\s+/).filter(Boolean).length;
      // ~3.3 words/sec at rate ~1.0; clamp between 1.2s and 12s
      const estMs = Math.min(
        12000,
        Math.max(1200, Math.round((words / 3.3) * 1000) + 300)
      );
      // Mark as speaking immediately so auto-advance waits
      isSpeakingRef.current = true;
      // Fallback: if no onend within estMs, emit tts-ended
      ttsTimerRef.current = setTimeout(() => {
        if (ttsTokenRef.current === myToken) {
          isSpeakingRef.current = false;
          try {
            window.dispatchEvent(new Event("tts-ended"));
          } catch {}
        }
      }, estMs) as unknown as number;
      const utter = new window.SpeechSynthesisUtterance(text);
      if (ttsVoiceRef.current) utter.voice = ttsVoiceRef.current;
      utter.rate = 1.01;
      utter.pitch = 1.1;
      utter.onstart = () => {
        /* already marked speaking */
      };
      const endIt = () => {
        // Only end if this is the latest utterance
        if (ttsTokenRef.current === myToken) {
          isSpeakingRef.current = false;
          if (ttsTimerRef.current) {
            clearTimeout(ttsTimerRef.current);
            ttsTimerRef.current = null;
          }
          try {
            window.dispatchEvent(new Event("tts-ended"));
          } catch {}
        }
      };
      utter.onend = endIt;
      utter.onerror = endIt;
      // Small timeout helps after cancel() to avoid race in some browsers
      setTimeout(() => synth.speak(utter), 0);
    };
    if (!voicesReady) {
      // Try to load voices and then speak
      const vs = synth.getVoices();
      if (vs && vs.length) {
        ttsVoiceRef.current = pickVoice(vs) || null;
        setVoicesReady(true);
        speakNow();
      } else {
        // Defer until voiceschanged fires
        const onVoices = () => {
          const vlist = synth.getVoices();
          ttsVoiceRef.current = pickVoice(vlist) || null;
          setVoicesReady(true);
          speakNow();
          synth.onvoiceschanged = null;
        };
        synth.onvoiceschanged = onVoices;
      }
    } else {
      speakNow();
    }
  }

  // Speak immediately (no setTimeout) within a user activation context.
  function speakLessonImmediate(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    try {
      synth.cancel();
    } catch {}
    const myToken = ++ttsTokenRef.current;
    const words = text.split(/\s+/).filter(Boolean).length;
    const estMs = Math.min(
      12000,
      Math.max(1200, Math.round((words / 3.3) * 1000) + 300)
    );
    isSpeakingRef.current = true;
    ttsTimerRef.current = setTimeout(() => {
      if (ttsTokenRef.current === myToken) {
        isSpeakingRef.current = false;
        try {
          window.dispatchEvent(new Event("tts-ended"));
        } catch {}
      }
    }, estMs) as unknown as number;
    const utter = new window.SpeechSynthesisUtterance(text);
    if (ttsVoiceRef.current) utter.voice = ttsVoiceRef.current;
    utter.rate = 1.01;
    utter.pitch = 1.1;
    const endIt = () => {
      if (ttsTokenRef.current === myToken) {
        isSpeakingRef.current = false;
        if (ttsTimerRef.current) {
          clearTimeout(ttsTimerRef.current);
          ttsTimerRef.current = null;
        }
        try {
          window.dispatchEvent(new Event("tts-ended"));
        } catch {}
      }
    };
    utter.onend = endIt;
    utter.onerror = endIt;
    // Important: call speak synchronously within the user activation
    synth.speak(utter);
  }

  // Unlock TTS on first user interaction and flush any pending speech immediately
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const unlock = () => {
      if (!ttsEnabled) {
        setTtsEnabled(true);
        const pending = pendingTtsRef.current;
        pendingTtsRef.current = null;
        if (pending) {
          // Speak right away inside the activation
          speakLessonImmediate(pending);
        }
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ttsEnabled]);

  // Initialize voices once mounted
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const vs = synth.getVoices();
      if (vs && vs.length) {
        ttsVoiceRef.current = pickVoice(vs) || null;
        setVoicesReady(true);
      }
    };
    load();
    const prev = synth.onvoiceschanged;
    synth.onvoiceschanged = () => {
      load();
    };
    return () => {
      if (synth.onvoiceschanged) synth.onvoiceschanged = prev || null;
    };
  }, []);

  // Speak lesson on lessonStep change
  React.useEffect(() => {
    const text = extractText(current.lesson);
    const cleanText = removeEmojis(text);
    if (cleanText) speakLesson(cleanText);
    // Cancel speech on unmount
    return () => {
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      isSpeakingRef.current = false;
      // Clear any pending TTS fallback timer
      if (ttsTimerRef.current) {
        clearTimeout(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [lessonStep]);

  // Removed lasersFired reset effect

  // --- Game/Lesson Progression Handlers ---
  // Called by PhaserBubbleGame via props
  // Advanced branching: event can be string or { type, ...payload }
  const handleGameEvent = (
    event: string | { type: string; [key: string]: unknown }
  ) => {
    // Listen for dot count updates from PhaserBubbleGame
    if (typeof event === "object" && event.type === "dot-count") {
      const count =
        typeof event.count === "number" && !isNaN(event.count)
          ? event.count
          : undefined;
      if (typeof count === "number") {
        // Defer to next microtask to avoid updating parent during child render
        Promise.resolve().then(() => {
          setDotCount(count);
          if (current.trigger === "shooting") {
            const required = lessonStep === 1 ? 3 : lessonStep === 6 ? 2 : 3;
            if (count === required && userActedRef.current) {
              let nextTrigger = null as string | null;
              if (typeof current.next === "function") {
                nextTrigger = current.next({}, lessonStep);
              } else if (typeof current.next === "string") {
                nextTrigger = current.next;
              }
              if (nextTrigger) {
                const nextIdx = lessonScript.findIndex(
                  (step) => step.trigger === nextTrigger
                );
                if (nextIdx !== -1) setLessonStep(nextIdx);
              }
            }
          } else if (current.trigger === "shooting-sub") {
            if (count === 3 && userActedRef.current) {
              const nextIdx = lessonScript.findIndex(
                (step) => step.trigger === "sub-puzzle"
              );
              if (nextIdx !== -1) setLessonStep(nextIdx);
            }
          } else if (current.trigger === "mul-shoot") {
            // For 2 groups of 2, total target is 4
            if (count >= 4 && userActedRef.current) {
              const nextIdx = lessonScript.findIndex(
                (step) => step.trigger === "mul-puzzle"
              );
              if (nextIdx !== -1) setLessonStep(nextIdx);
            }
          } else if (current.trigger === "div-shoot") {
            // Division requires the player to create at least 4 dots themselves
            if (count >= 4 && userActedRef.current) {
              const nextIdx = lessonScript.findIndex(
                (step) => step.trigger === "div-puzzle"
              );
              if (nextIdx !== -1) setLessonStep(nextIdx);
            }
          }
        });
      }
      return;
    }
    let type: string;
    let payload: LessonEventPayload = {};
    if (typeof event === "string") {
      type = event;
    } else {
      type = event.type;
      payload = event;
    }

    // If the user selects the gun, advance to the next 'shooting' step after the current one
    if (type === "gun-selected") {
      // Don’t skip the tutorial via gun selection
      if (lessonScript[lessonStep]?.trigger === "tutorial") {
        return;
      }
      // Advance to the appropriate shooting step for the current lesson cluster
      const map: Record<string, string> = {
        start: "shooting",
        "sub-start": "shooting-sub",
        "mul-start": "mul-shoot",
        "div-start": "div-shoot",
      };
      const nextTrig = map[current.trigger];
      if (nextTrig) {
        const idxNext = lessonScript.findIndex((s) => s.trigger === nextTrig);
        if (idxNext !== -1) {
          lasersFiredRef.current = 0;
          userActedRef.current = false;
          setLessonStep(idxNext);
          return;
        }
      }
      // Otherwise do nothing on gun select
      return;
    }
    // If the user shoots and lesson is stuck on 'start', advance to 'shooting' and immediately count this shot
    if (type === "phaser-dot-created" && current.trigger === "start") {
      const shootingIdx = lessonScript.findIndex(
        (step) => step.trigger === "shooting"
      );
      if (shootingIdx !== -1) {
        lasersFiredRef.current = 1;
        setLessonStep(shootingIdx);
        // Force re-render to update lesson text
        setTimeout(() => setLessonStep(shootingIdx), 0);
        return;
      }
    }

    // Phaser game event for dot/laser fired
    if (type === "phaser-dot-created") {
      // Handle only when in addition shooting; other modes use dot-count gating
      if (current.trigger === "shooting") {
        const required = lessonStep === 1 ? 3 : lessonStep === 6 ? 2 : 3;
        lasersFiredRef.current += 1;
        if (lasersFiredRef.current === required) {
          let nextTrigger: string | null = null;
          if (typeof current.next === "function") {
            nextTrigger = current.next(payload, lessonStep);
          } else if (typeof current.next === "string") {
            nextTrigger = current.next;
          }
          if (nextTrigger) {
            const nextIdx = lessonScript.findIndex(
              (step) => step.trigger === nextTrigger
            );
            if (nextIdx !== -1) setLessonStep(nextIdx);
          }
        }
      }
      return;
    }

    // Find current step
    const currentStep = lessonScript[lessonStep];
    // If the event is an answer submission (type === currentStep.trigger), use next to determine next step
    if (
      type === currentStep.trigger &&
      (currentStep.trigger === "puzzle" ||
        currentStep.trigger === "puzzle2" ||
        currentStep.trigger === "sub-puzzle" ||
        currentStep.trigger === "mul-puzzle" ||
        currentStep.trigger === "div-puzzle" ||
        currentStep.trigger.startsWith("final-q") ||
        currentStep.trigger.endsWith("-test-q1"))
    ) {
      let nextTrigger: string | null = null;
      if (typeof currentStep.next === "function") {
        nextTrigger = currentStep.next(payload, lessonStep);
      } else if (typeof currentStep.next === "string") {
        nextTrigger = currentStep.next;
      }
      // For tests (final-q* and *-test-q1), require dots equal to the numeric answer to proceed
      const isTestQ =
        currentStep.trigger.startsWith("final-q") ||
        currentStep.trigger.endsWith("-test-q1");
      if (isTestQ) {
        const ansNum =
          typeof payload.answer === "number" ? payload.answer : NaN;
        if (!isNaN(ansNum) && dotCount !== ansNum) {
          // Stay on the same question until dot count matches the answer
          nextTrigger = currentStep.trigger;
        }
      }
      if (nextTrigger) {
        const nextIdx = lessonScript.findIndex(
          (step) => step.trigger === nextTrigger
        );
        if (nextIdx !== -1) setLessonStep(nextIdx);
      }
      return;
    }
    // Lesson toggle controls from overlay arrows
    if (type === "lesson-next" || type === "lesson-prev") {
      const clusters = [
        ["start", "shooting", "puzzle", "puzzle2", "correct", "wrong"],
        ["sub-start", "shooting-sub", "sub-puzzle", "sub-correct", "sub-wrong"],
        ["mul-start", "mul-shoot", "mul-puzzle", "mul-correct", "mul-wrong"],
        ["div-start", "div-shoot", "div-puzzle", "div-correct", "div-wrong"],
      ];
      const idxCluster = clusters.findIndex((set) =>
        set.includes(current.trigger)
      );
      if (idxCluster !== -1) {
        const delta = type === "lesson-next" ? 1 : -1;
        const nextCluster =
          (idxCluster + delta + clusters.length) % clusters.length;
        const goto = clusters[nextCluster][0];
        const goIdx = lessonScript.findIndex((s) => s.trigger === goto);
        if (goIdx !== -1) {
          // Clear the board before switching cluster to avoid dot bleed-over
          if (phaserReady) window.dispatchEvent(new Event("phaser-clear-dots"));
          setLessonStep(goIdx);
        }
      }
      return;
    }
    // Find next step based on trigger and branching logic (for other events)
    let nextTrigger: string | null = null;
    if (currentStep && typeof currentStep.next === "function") {
      nextTrigger = currentStep.next(payload, lessonStep);
    } else if (currentStep && typeof currentStep.next === "string") {
      nextTrigger = currentStep.next;
    } else if (currentStep && currentStep.next === null) {
      // Wait for answer or external event
      nextTrigger = null;
    }
    // If the event matches a trigger for a new step, jump to that step
    const idx = lessonScript.findIndex((step) => step.trigger === type);
    if (idx !== -1) {
      setLessonStep(idx);
      return;
    }
    // If nextTrigger is set, jump to that step
    if (nextTrigger && type !== "gun-selected") {
      const nextIdx = lessonScript.findIndex(
        (step) => step.trigger === nextTrigger
      );
      if (nextIdx !== -1) setLessonStep(nextIdx);
    }
    // Allow direct step jump for overlay arrows (legacy)
    if (typeof event === "string" && event.startsWith("step-")) {
      const n = parseInt(event.replace("step-", ""), 10);
      if (!isNaN(n) && n >= 0 && n < lessonScript.length) {
        lasersFiredRef.current = 0;
        setLessonStep(n);
      }
    }
  };

  // Reset lasers fired and notify Phaser game when lesson step changes
  React.useEffect(() => {
    if (!phaserReady) return; // wait until Phaser scene is ready to accept events
    lasersFiredRef.current = 0;
    userActedRef.current = false;
    // Ensure board is clear at the start of any lesson cluster
    if (
      current.trigger === "start" ||
      current.trigger === "sub-start" ||
      current.trigger === "mul-start" ||
      current.trigger === "div-start"
    ) {
      window.dispatchEvent(new Event("phaser-clear-dots"));
    }
    // Notify Phaser game to enable/disable and set mode
    if (
      current.trigger === "shooting" ||
      current.trigger === "shooting-sub" ||
      current.trigger === "mul-shoot" ||
      current.trigger === "div-shoot"
    ) {
      window.dispatchEvent(
        new CustomEvent("phaser-gun-toggle", { detail: { selected: true } })
      );
      if (current.trigger === "shooting") {
        window.dispatchEvent(
          new CustomEvent("phaser-set-mode", { detail: { mode: "add" } })
        );
      } else if (current.trigger === "shooting-sub") {
        window.dispatchEvent(
          new CustomEvent("phaser-set-mode", { detail: { mode: "remove" } })
        );
        window.dispatchEvent(
          new CustomEvent("phaser-seed-dots", { detail: { count: 4 } })
        );
      } else if (current.trigger === "mul-shoot") {
        window.dispatchEvent(
          new CustomEvent("phaser-set-mode", {
            detail: { mode: "addGroup", groupSize: 2 },
          })
        );
        // Clear any previous dots when starting multiplication shoot
        window.dispatchEvent(new Event("phaser-clear-dots"));
      } else if (current.trigger === "div-shoot") {
        // For division, let user create up to 20 dots; progression triggers at 4+
        window.dispatchEvent(
          new CustomEvent("phaser-set-mode", { detail: { mode: "add" } })
        );
        window.dispatchEvent(new Event("phaser-clear-dots"));
        window.dispatchEvent(
          new CustomEvent("phaser-set-max-shots", { detail: { max: 20 } })
        );
        // Ensure input is enabled (some browsers disable input after scene resume) and UI reflects selection
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("phaser-gun-toggle", { detail: { selected: true } })
          );
        }, 0);
      }
    } else if (current.trigger.endsWith("-test-start")) {
      // Test intro: clear and disable gun
      window.dispatchEvent(new Event("phaser-clear-dots"));
      window.dispatchEvent(
        new CustomEvent("phaser-gun-toggle", { detail: { selected: false } })
      );
    } else if (
      current.trigger.startsWith("final-q") ||
      current.trigger.endsWith("-test-q1")
    ) {
      // Test questions: clear, enable gun in add mode, allow up to 20 dots
      window.dispatchEvent(new Event("phaser-clear-dots"));
      window.dispatchEvent(
        new CustomEvent("phaser-gun-toggle", { detail: { selected: true } })
      );
      window.dispatchEvent(
        new CustomEvent("phaser-set-mode", { detail: { mode: "add" } })
      );
      window.dispatchEvent(
        new CustomEvent("phaser-set-max-shots", { detail: { max: 20 } })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("phaser-gun-toggle", { detail: { selected: false } })
      );
    }

    // Auto-advance from message steps to their next step (e.g., correct/wrong -> test-start, test-start -> test-q1, final-start -> final-q1)
    const autoAdvance = new Set([
      // Auto-advance from message/intro screens, but only after TTS finishes and a short dwell
      "correct",
      "wrong",
      "sub-correct",
      "sub-wrong",
      "mul-correct",
      "mul-wrong",
      "div-correct",
      "div-wrong",
      "add-test-start",
      "sub-test-start",
      "mul-test-start",
      "final-start",
    ]);
    let autoTimer: number | null = null;
    let ttsHandler: EventListener | null = null;
    if (autoAdvance.has(current.trigger)) {
      const nextTrigger =
        typeof current.next === "string" ? current.next : null;
      if (nextTrigger) {
        const goIdx = lessonScript.findIndex((s) => s.trigger === nextTrigger);
        if (goIdx !== -1) {
          const dwellFor = (trig: string) => {
            if (trig.endsWith("-test-start") || trig === "final-start")
              return 700;
            if (trig.endsWith("-correct") || trig === "correct") return 1200;
            if (trig.endsWith("-wrong") || trig === "wrong") return 1200;
            return 600;
          };
          const scheduleGo = () => {
            autoTimer = setTimeout(
              () => setLessonStep(goIdx),
              dwellFor(current.trigger)
            ) as unknown as number;
          };
          if (isSpeakingRef.current) {
            ttsHandler = () => {
              window.removeEventListener("tts-ended", ttsHandler!);
              scheduleGo();
            };
            window.addEventListener("tts-ended", ttsHandler);
          } else {
            scheduleGo();
          }
        }
      }
    }

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      if (ttsHandler) window.removeEventListener("tts-ended", ttsHandler);
    };
  }, [lessonStep, current.trigger, current.next, phaserReady]);
  React.useEffect(() => setMounted(true), []);
  // Suppress noisy Chrome extension error: "A listener indicated an asynchronous response..."
  React.useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      try {
        const msg =
          typeof e.reason === "string" ? e.reason : e.reason?.message || "";
        if (
          typeof msg === "string" &&
          /listener indicated an asynchronous response|message channel closed before a response was received/i.test(
            msg
          )
        ) {
          e.preventDefault();
        }
      } catch {}
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);
  // Listen once for Phaser scene readiness
  React.useEffect(() => {
    const onReady = () => setPhaserReady(true);
    window.addEventListener("phaser-ready", onReady);
    return () => window.removeEventListener("phaser-ready", onReady);
  }, []);
  // Listen for user actions and seeding, to gate auto-advances
  React.useEffect(() => {
    const markActed = () => {
      userActedRef.current = true;
    };
    const resetOnSeed = () => {
      userActedRef.current = false;
    };
    window.addEventListener("phaser-user-dot", markActed);
    window.addEventListener("phaser-seeded", resetOnSeed);
    const onUnderstood = () => {
      const step = lessonStepRef.current;
      if (lessonScript[step]?.trigger === "tutorial") {
        const idx = lessonScript.findIndex((s) => s.trigger === "start");
        if (idx !== -1) setLessonStep(idx);
      }
    };
    window.addEventListener(
      "tutorial-understood",
      onUnderstood as EventListener
    );
    return () => {
      window.removeEventListener("phaser-user-dot", markActed);
      window.removeEventListener("phaser-seeded", resetOnSeed);
      window.removeEventListener(
        "tutorial-understood",
        onUnderstood as EventListener
      );
    };
  }, []);

  // Keep lessonStepRef in sync
  React.useEffect(() => {
    lessonStepRef.current = lessonStep;
  }, [lessonStep]);

  // --- Chat rendering helpers: simple bold + icon shortcodes ---
  const iconMap: Record<string, React.ReactNode> = {
    check: (
      <CheckCircle className="inline h-4 w-4 text-emerald-400 align-[-2px]" />
    ),
    x: <XCircle className="inline h-4 w-4 text-rose-400 align-[-2px]" />,
    plus: <Plus className="inline h-4 w-4 text-blue-300 align-[-2px]" />,
    minus: <Minus className="inline h-4 w-4 text-blue-300 align-[-2px]" />,
    divide: <Divide className="inline h-4 w-4 text-blue-300 align-[-2px]" />,
    mic: <Mic className="inline h-4 w-4 text-cyan-300 align-[-2px]" />,
    send: <Send className="inline h-4 w-4 text-cyan-300 align-[-2px]" />,
    help: (
      <HelpCircle className="inline h-4 w-4 text-yellow-300 align-[-2px]" />
    ),
    info: <Info className="inline h-4 w-4 text-sky-300 align-[-2px]" />,
    star: <Star className="inline h-4 w-4 text-amber-300 align-[-2px]" />,
  };

  function renderRich(text: string): React.ReactNode {
    if (!text) return "";
    const nodes: React.ReactNode[] = [];
    // Normalize by trimming leading/trailing blank lines to avoid starting on a new line
    const raw = String(text);
    const lines = raw
      .split(/\r?\n/)
      // trim leading/trailing blank lines without mutating
      .filter((l, idx, arr) => {
        if (l.trim() !== "") return true;
        // keep if it is an interior blank line (surrounded by non-blank)
        const isFirst = idx === 0;
        const isLast = idx === arr.length - 1;
        if (isFirst || isLast) return false;
        return !(arr[idx - 1].trim() === "" || arr[idx + 1].trim() === "");
      });
    if (!lines.length) return "";
    lines.forEach((line, li) => {
      let i = 0;
      while (i < line.length) {
        const iconMatch = /:([a-z-]+):/i.exec(line.slice(i));
        const boldMatch = /\*\*(.+?)\*\*/.exec(line.slice(i));
        const next = [
          iconMatch
            ? { type: "icon" as const, idx: i + iconMatch.index, m: iconMatch }
            : null,
          boldMatch
            ? { type: "bold" as const, idx: i + boldMatch.index, m: boldMatch }
            : null,
        ].filter(Boolean) as Array<{
          type: "icon" | "bold";
          idx: number;
          m: RegExpExecArray;
        }>;
        if (!next.length) {
          nodes.push(line.slice(i));
          i = line.length;
          break;
        }
        next.sort((a, b) => a.idx - b.idx);
        const first = next[0];
        if (first.idx > i) nodes.push(line.slice(i, first.idx));
        if (first.type === "icon") {
          const key = first.m[1].toLowerCase();
          nodes.push(iconMap[key] || `:${first.m[1]}:`);
          i = first.idx + first.m[0].length;
        } else {
          const boldText = first.m[1];
          nodes.push(
            <strong key={`b-${li}-${i}`} className="text-blue-100">
              {boldText}
            </strong>
          );
          i = first.idx + first.m[0].length;
        }
      }
      if (li < lines.length - 1) nodes.push(<br key={`br-${li}`} />);
    });
    return <>{nodes}</>;
  }

  // Prune chat items that have scrolled below the viewport (so older answers disappear)
  const pruneOffscreen = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const toRemove: string[] = [];
    chatItemRefs.current.forEach((el, id) => {
      if (!el || !document.body.contains(el)) {
        toRemove.push(id);
        return;
      }
      const rect = el.getBoundingClientRect();
      // If the top of the element is below the viewport bottom, it's fully "below the page"
      if (rect.top >= window.innerHeight) {
        toRemove.push(id);
      }
    });
    if (toRemove.length) {
      setChat((prev) => prev.filter((c) => !toRemove.includes(c.id)));
      toRemove.forEach((id) => chatItemRefs.current.delete(id));
    }
  }, []);

  // Run prune on scroll/resize and whenever chat changes
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => pruneOffscreen();
    const onResize = () => pruneOffscreen();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Also prune shortly after mutations to catch newly pushed items moving older ones below
    const t = setTimeout(() => pruneOffscreen(), 0);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [chat, pruneOffscreen]);

  if (!mounted) return null;

  // extractText removed

  // TTS logic removed

  // TTS pause/resume logic removed

  async function askStream(question: string) {
    // Optimistically show the question
    setChat((prev) => {
      const next = [...prev, { id: makeId(), q: question, a: "" }];
      if (next.length > MAX_CHAT_ITEMS)
        next.splice(0, next.length - MAX_CHAT_ITEMS);
      return next;
    });
    try {
      const res = await fetch(`${BACKEND_BASE}/ai/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({ prompt: question, model: "qwen3:32b" }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const reader = (
        res.body as unknown as {
          getReader: () => ReadableStreamDefaultReader<Uint8Array>;
        }
      ).getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\n\n/);
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;
          const idx = line.indexOf("data:");
          if (idx === -1) continue;
          const jsonStr = line.slice(idx + 5).trim();
          try {
            const obj = JSON.parse(jsonStr) as {
              delta?: string;
              done?: boolean;
              error?: string;
            };
            if (obj.error) {
              throw new Error(obj.error);
            }
            if (typeof obj.delta === "string") {
              setChat((prev) => {
                if (!prev.length) return prev;
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  a: (last.a || "") + obj.delta,
                };
                return next;
              });
            }
            if (obj.done) {
              return;
            }
          } catch {
            // Partial frame; ignore
          }
        }
      }
    } catch (err: unknown) {
      const msg =
        err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to reach the math model.";
      setChat((prev) => {
        if (!prev.length) return prev;
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, a: msg };
        return next;
      });
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const question = input;
    setInput("");
    await askStream(question);
  }

  function readBlobAsDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(fr.error || new Error("FileReader error"));
      fr.onload = () => resolve(String(fr.result || ""));
      fr.readAsDataURL(blob);
    });
  }

  function mergeFloat32Arrays(chunks: Float32Array[]) {
    const total = chunks.reduce((n, a) => n + a.length, 0);
    const out = new Float32Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }

  function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    // 16-bit PCM WAV
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(offset: number, str: string) {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
    }
    // RIFF header
    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);
    // PCM data
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([view], { type: "audio/wav" });
  }

  async function handleRecordClick() {
    if (isRecording) {
      // Stop and process
      try {
        setIsRecording(false);
        const ctx = audioCtxRef.current;
        const node = scriptNodeRef.current as
          | ScriptProcessorNode
          | AudioWorkletNode
          | null;
        const stream = streamRef.current;
        // Stop the mic tracks first so no new audio arrives
        stream?.getTracks().forEach((t) => t.stop());
        // Allow a brief flush window for any pending worklet frames to be delivered
        await new Promise((r) => setTimeout(r, 150));
        try {
          node?.disconnect();
        } catch {}
        // Stop frequency analysis
        try {
          analyserRef.current?.disconnect();
        } catch {}
        analyserRef.current = null;
        if (rafIdRef.current != null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        recordStartRef.current = null;
        setElapsedStr("00:00");
        if (ctx) await ctx.close().catch(() => undefined);
        scriptNodeRef.current = null;
        audioCtxRef.current = null;
        streamRef.current = null;
        const samples = mergeFloat32Arrays(pcmChunksRef.current);
        pcmChunksRef.current = [];
        const wav = encodeWAV(samples, sampleRateRef.current);
        const dataUrl = await readBlobAsDataURL(wav);
        // Send to local ASR
        const res = await fetch(`${BACKEND_BASE}/ai/local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: dataUrl, return_timestamps: false }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `ASR failed: ${res.status}`);
        }
        const asr = (await res.json()) as { text?: string };
        const question = (asr?.text || "").trim();
        if (!question) {
          setChat((prev) => {
            const next = [
              ...prev,
              { id: makeId(), q: "[voice]", a: "Could not understand audio." },
            ];
            if (next.length > MAX_CHAT_ITEMS)
              next.splice(0, next.length - MAX_CHAT_ITEMS);
            return next;
          });
          return;
        }
        await askStream(question);
      } catch (err: unknown) {
        const msg =
          err && typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Transcription failed.";
        setChat((prev) => {
          const next = [...prev, { id: makeId(), q: "[voice]", a: msg }];
          if (next.length > MAX_CHAT_ITEMS)
            next.splice(0, next.length - MAX_CHAT_ITEMS);
          return next;
        });
      }
      return;
    }
    // Start recording
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Microphone not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const W = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = W.AudioContext || W.webkitAudioContext || AudioContext;
      const ctx = new Ctor({ sampleRate: sampleRateRef.current });
      sampleRateRef.current = ctx.sampleRate || sampleRateRef.current;
      const source = ctx.createMediaStreamSource(stream);
      pcmChunksRef.current = [];
      recordStartRef.current = performance.now();
      setElapsedStr("00:00");
      // Set up frequency analyser (dominant FFT peak)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // frequencyBinCount = 1024
      source.connect(analyser);
      analyserRef.current = analyser;
      // Start RAF loop to update frequency while recording
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      // Prepare canvas for spectrum drawing
      const canvas = freqCanvasRef.current;
      let c2d: CanvasRenderingContext2D | null = null;
      let dpr = 1;
      if (canvas) {
        const cssWidth = canvas.clientWidth || 96;
        const cssHeight = canvas.clientHeight || 22;
        dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        c2d = canvas.getContext("2d");
        if (c2d) c2d.scale(dpr, dpr);
      }
      const updateFreq = () => {
        try {
          analyser.getByteFrequencyData(freqData);
          // Find peak bin
          let maxVal = 0;
          let maxIdx = 0;
          for (let i = 0; i < freqData.length; i++) {
            const v = freqData[i];
            if (v > maxVal) {
              maxVal = v;
              maxIdx = i;
            }
          }
          // Keep peak index for drawing only
          // Draw simple spectrum bars
          if (c2d && canvas) {
            const W = canvas.clientWidth || 96;
            const H = canvas.clientHeight || 22;
            c2d.clearRect(0, 0, W, H);
            // Gradient fill
            const grad = c2d.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "rgba(125, 211, 252, 0.95)"); // sky-300
            grad.addColorStop(1, "rgba(59, 130, 246, 0.5)"); // blue-500
            // Render N bars across the width
            const bars = 24;
            const step = Math.floor(freqData.length / bars);
            const barW = Math.max(2, Math.floor((W - bars) / bars));
            for (let b = 0; b < bars; b++) {
              const idx = b * step;
              // take the max in the window for a punchier look
              let m = 0;
              for (let k = 0; k < step; k++)
                m = Math.max(m, freqData[idx + k] || 0);
              const mag = m / 255; // 0..1
              const barH = Math.max(1, Math.round(mag * H));
              const x = b * (barW + 1);
              const y = H - barH;
              c2d.fillStyle = grad;
              c2d.fillRect(x, y, barW, barH);
            }
            // Highlight peak position as a thin line
            const peakX = Math.floor((maxIdx / freqData.length) * W);
            c2d.fillStyle = "rgba(56, 189, 248, 0.9)"; // cyan-400
            c2d.fillRect(peakX, 0, 1, H);
          }
          // Update timer (throttled to ~5fps)
          const now = performance.now();
          if (
            recordStartRef.current != null &&
            now - lastTimeUpdateRef.current > 180
          ) {
            const ms = Math.max(0, Math.round(now - recordStartRef.current));
            const totalSec = Math.floor(ms / 1000);
            const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
            const ss = String(totalSec % 60).padStart(2, "0");
            setElapsedStr(`${mm}:${ss}`);
            lastTimeUpdateRef.current = now;
          }
        } catch {
          // ignore one-off errors during teardown
        }
        rafIdRef.current = requestAnimationFrame(updateFreq);
      };
      rafIdRef.current = requestAnimationFrame(updateFreq);
      // Try AudioWorklet first
      try {
        if (!("audioWorklet" in ctx)) throw new Error("No audioWorklet");
        // recorder-worklet.js is served from /audio/recorder-worklet.js
        await ctx.audioWorklet.addModule("/audio/recorder-worklet.js");
        const worklet: AudioWorkletNode = new AudioWorkletNode(
          ctx,
          "recorder-processor"
        );
        worklet.port.onmessage = (ev: MessageEvent) => {
          const ab = ev.data as ArrayBuffer;
          if (ab && ab.byteLength) {
            pcmChunksRef.current.push(new Float32Array(ab));
          }
        };
        source.connect(worklet);
        // Connect to destination to keep the graph active, but keep volume silent
        worklet.connect(ctx.destination);
        scriptNodeRef.current = worklet;
      } catch {
        // Fallback: ScriptProcessorNode (deprecated)
        const node = ctx.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (e: AudioProcessingEvent) => {
          const input = e.inputBuffer.getChannelData(0);
          pcmChunksRef.current.push(new Float32Array(input));
        };
        source.connect(node);
        node.connect(ctx.destination);
        scriptNodeRef.current = node;
      }
      audioCtxRef.current = ctx;
      streamRef.current = stream;
      setIsRecording(true);
    } catch (err: unknown) {
      const msg =
        err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Mic permission denied or unavailable.";
      setChat((prev) => {
        const next = [...prev, { id: makeId(), q: "[voice]", a: msg }];
        if (next.length > MAX_CHAT_ITEMS)
          next.splice(0, next.length - MAX_CHAT_ITEMS);
        return next;
      });
    }
  }

  // Cancel (discard) current recording without sending
  async function handleCancelRecording() {
    if (!isRecording) return;
    try {
      setIsRecording(false);
      const ctx = audioCtxRef.current;
      const node = scriptNodeRef.current as
        | ScriptProcessorNode
        | AudioWorkletNode
        | null;
      const stream = streamRef.current;
      stream?.getTracks().forEach((t) => t.stop());
      await new Promise((r) => setTimeout(r, 120));
      try {
        node?.disconnect();
      } catch {}
      try {
        analyserRef.current?.disconnect();
      } catch {}
      analyserRef.current = null;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      recordStartRef.current = null;
      setElapsedStr("00:00");
      if (ctx) await ctx.close().catch(() => undefined);
      scriptNodeRef.current = null;
      audioCtxRef.current = null;
      streamRef.current = null;
      // Discard any captured PCM
      pcmChunksRef.current = [];
    } catch {}
  }

  return (
    <div
      className="font-quicksand min-h-screen flex flex-col transition-colors duration-500"
      style={{
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ...existing code... */}
      {/* Navbar */}
      <nav
        className="w-full flex items-center justify-between px-6 py-2 rounded-b-[2.5rem] bg-white/50 dark:bg-gray-900/60 shadow-2xl border-b-4 border-blue-200 z-20 relative backdrop-blur-md"
        style={{
          background:
            "linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(59,130,246,0.18) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none">🤖</span>
          <span
            className="text-2xl font-extrabold tracking-tight text-blue-100 drop-shadow font-[Comic Sans MS,Comic Sans,cursive]"
            style={{ textShadow: "0 0 10px #93c5fd, 0 0 2px #fff" }}
          >
            AI Math
          </span>
        </div>
        <Link href="/">
          <Button
            size="sm"
            className="ml-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-[Comic Sans MS,Comic Sans,cursive] border-2 border-pink-300 shadow-lg"
          >
            Home
          </Button>
        </Link>
      </nav>
      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-0 z-10 relative w-full">
        {/* Nebula/star field overlay */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "radial-gradient(ellipse at 60% 20%, rgba(59,7,100,0.58) 0%, rgba(24,26,42,0) 80%)",
          }}
        />
        <Card
          className="w-full min-h-[70vh] flex flex-col md:flex-row items-stretch justify-center shadow-2xl rounded-3xl border-2 border-blue-200/80 mx-2 md:mx-8 mt-0 backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,36,66,0.82) 0%, rgba(18,26,46,0.86) 100%)",
            boxShadow: "0 0 38px 0 #7dd3fc88, 0 6px 28px 0 #0008",
            border: "2.5px solid #93c5fd",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Left: Lesson and Listen Button */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/3 md:min-w-[220px] px-4 md:px-6 py-6 md:py-8">
            <div className="relative w-full flex flex-col items-center">
              <div
                className="w-full border-2 rounded-3xl shadow-2xl backdrop-blur-2xl p-6 text-lg font-quicksand text-blue-50 animate-pulse mb-4 scrollbar-hide"
                style={{
                  borderColor: "#93c5fd",
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(59,130,246,0.25) 100%)",
                  boxShadow: "0 0 26px 0 #93c5fd99, 0 4px 14px 0 #0008",
                  maxHeight: "420px",
                  minHeight: "180px",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {/* Title moved to center section */}
                {current.lesson}
              </div>
              <Button
                type="button"
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-1 text-base font-quicksand shadow-lg border-2 border-blue-300"
                style={{ boxShadow: "0 0 8px #60a5fa" }}
                onClick={() =>
                  speakLesson(removeEmojis(extractText(current.lesson)))
                }
                aria-label="Listen to lesson"
              >
                🔊 Listen
              </Button>
            </div>
          </div>
          {/* Dividers: horizontal on mobile, vertical on desktop */}
          <div className="md:hidden w-full px-6">
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-400/60 via-purple-400/40 to-blue-900/30 my-2" />
          </div>
          <div className="hidden md:flex flex-col justify-center items-center my-8 mx-2">
            <div className="w-0.5 h-64 bg-gradient-to-b from-blue-400/60 via-purple-400/40 to-blue-900/30 mb-1" />
            <div className="w-0.5 h-64 bg-gradient-to-b from-blue-400/60 via-purple-400/40 to-blue-900/30" />
          </div>
          {/* Center: PhaserJS Game Section */}
          <div className="flex flex-col items-center justify-center w-full md:w-2/4 px-2 md:px-6 py-0">
            <PhaserBubbleGame
              onGameEvent={handleGameEvent}
              lessonStep={lessonStep}
              showAnswerBox={
                (current.trigger === "puzzle" && dotCount === 4) ||
                current.trigger === "puzzle2" ||
                current.trigger === "sub-puzzle" ||
                current.trigger === "mul-puzzle" ||
                current.trigger === "div-puzzle" ||
                current.trigger === "add-test-q1" ||
                current.trigger === "sub-test-q1" ||
                current.trigger === "mul-test-q1" ||
                current.trigger === "final-q1" ||
                current.trigger === "final-q2" ||
                current.trigger === "final-q3" ||
                current.trigger === "final-q4"
              }
              shootMode={
                current.trigger === "shooting-sub"
                  ? "remove"
                  : current.trigger === "mul-shoot"
                  ? "addGroup"
                  : "add"
              }
              onAnswer={(ans) => {
                // Always check against 4 for the puzzle step
                if (current.trigger === "puzzle" && ans === 4) {
                  handleGameEvent({ type: "puzzle", answer: 4 });
                } else if (current.trigger === "puzzle2" && ans === 4) {
                  handleGameEvent({ type: "puzzle2", answer: 4 });
                } else if (current.trigger === "sub-puzzle" && ans === 3) {
                  handleGameEvent({ type: "sub-puzzle", answer: 3 });
                } else if (current.trigger === "mul-puzzle" && ans === 4) {
                  handleGameEvent({ type: "mul-puzzle", answer: 4 });
                } else if (current.trigger === "div-puzzle" && ans === 2) {
                  handleGameEvent({ type: "div-puzzle", answer: 2 });
                } else if (current.trigger === "add-test-q1") {
                  handleGameEvent({ type: "add-test-q1", answer: ans });
                } else if (current.trigger === "sub-test-q1") {
                  handleGameEvent({ type: "sub-test-q1", answer: ans });
                } else if (current.trigger === "mul-test-q1") {
                  handleGameEvent({ type: "mul-test-q1", answer: ans });
                } else if (current.trigger === "final-q1") {
                  handleGameEvent({ type: "final-q1", answer: ans });
                } else if (current.trigger === "final-q2") {
                  handleGameEvent({ type: "final-q2", answer: ans });
                } else if (current.trigger === "final-q3") {
                  handleGameEvent({ type: "final-q3", answer: ans });
                } else if (current.trigger === "final-q4") {
                  handleGameEvent({ type: "final-q4", answer: ans });
                } else {
                  handleGameEvent({ type: current.trigger, answer: -1 });
                }
              }}
              extraDotMode={
                (current.trigger === "puzzle" && dotCount < 4) ||
                (current.trigger === "div-puzzle" && dotCount < 4)
              }
              maxExtraDots={4}
            />
          </div>
          <div className="hidden md:flex flex-col justify-center items-center my-8 mx-2">
            <div className="w-0.5 h-64 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 mb-1" />
            <div className="w-0.5 h-64 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200" />
          </div>
          <div className="md:hidden w-full px-6">
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 my-2" />
          </div>
          {/* Right: AI Chat Box */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/4 md:min-w-[300px] px-2 md:px-4 py-6 md:py-8">
            <h2
              className="text-xl md:text-2xl font-bold text-blue-100 mb-3 md:mb-4 drop-shadow-lg tracking-wide"
              style={{ textShadow: "0 0 12px #93c5fd, 0 0 3px #fff" }}
            >
              Space Math AI
            </h2>
            <form
              onSubmit={handleAsk}
              className="flex flex-col gap-2 items-center w-full"
            >
              <div className="relative w-full">
                <Input
                  type="text"
                  className="w-full rounded-full border-2 border-blue-400/60 pl-4 pr-52 py-2 text-base font-quicksand focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-900/40 text-blue-100 shadow-lg placeholder:text-blue-100/80"
                  placeholder={""}
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInput(e.target.value)
                  }
                  required
                  style={{ boxShadow: "0 0 8px #6366f1cc" }}
                />
                {isRecording && (
                  <div
                    className="absolute inset-0 flex items-center gap-3 pl-3 pr-24 rounded-full bg-blue-900/30 border border-blue-300/30"
                    style={{ boxShadow: "inset 0 0 8px rgba(99,102,241,0.5)" }}
                  >
                    <span
                      className="text-blue-100/90 text-sm tabular-nums drop-shadow-sm"
                      aria-live="polite"
                    >
                      {elapsedStr}
                    </span>
                    <canvas
                      ref={freqCanvasRef}
                      className="h-[24px] w-full rounded bg-blue-900/20"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      aria-label="Cancel recording"
                      className="shrink-0 h-7 w-7 rounded-full bg-rose-700/80 hover:bg-rose-600 text-white border border-rose-300/60 shadow flex items-center justify-center"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRecordClick}
                  aria-label={
                    isRecording ? "Stop recording" : "Start recording"
                  }
                  className={`absolute right-12 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-white border border-blue-300/60 shadow flex items-center justify-center ${
                    isRecording
                      ? "bg-rose-600/90 hover:bg-rose-500"
                      : "bg-emerald-700/80 hover:bg-emerald-600/90"
                  }`}
                  style={{ boxShadow: "0 0 8px #22d3eecc" }}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="submit"
                  aria-label="Ask AI"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-blue-700/80 hover:bg-blue-600 text-white border border-blue-300/60 shadow flex items-center justify-center"
                  style={{ boxShadow: "0 0 8px #38bdf8cc" }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {/* Removed separate record button; mic icon is inside the input */}
            </form>
            <div
              ref={chatListRef}
              className="mt-2 flex flex-col-reverse gap-2 w-full overflow-visible"
            >
              {chat.map((c) => (
                <div
                  key={c.id}
                  ref={(el) => {
                    if (el) chatItemRefs.current.set(c.id, el);
                    else chatItemRefs.current.delete(c.id);
                  }}
                  className="bg-blue-900/40 rounded-xl px-3 py-2 text-left text-sm shadow-md border border-blue-400/40 text-blue-100"
                  style={{ boxShadow: "0 0 8px #6366f1cc" }}
                >
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 text-blue-300 font-semibold shrink-0">
                      <UserIcon className="h-4 w-4" /> You:
                    </span>
                    <span className="flex-1 min-w-0 whitespace-pre-wrap break-words leading-relaxed">
                      {renderRich(c.q)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-pink-400 font-semibold shrink-0">
                      <Brain className="h-4 w-4" /> AI:
                    </span>
                    <span className="flex-1 min-w-0 whitespace-pre-wrap break-words leading-relaxed">
                      {renderRich(c.a)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default AiMathPage;
