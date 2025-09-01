"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Logo } from "../components/logo";

export default function Home() {
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const lastScrollRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3001/user/me", {
          credentials: "include",
        });
        setIsAuthed(res.ok);
      } catch {
        setIsAuthed(false);
      }
    };
    checkAuth();
  }, []);

  // Hide-on-scroll-down nav behavior
  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const last = lastScrollRef.current;
        // Only trigger after small threshold to avoid jitter
        if (Math.abs(current - last) > 8) {
          if (current > last && current > 64) {
            setHideNav(true);
          } else {
            setHideNav(false);
          }
          lastScrollRef.current = current;
        }
        tickingRef.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const playClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play();
    }
  };
  return (
    <>
      {/* Font link moved to _document.tsx */}
      <audio
        ref={clickAudioRef}
        src="/button-click.mp3"
        preload="auto"
        style={{ display: "none" }}
      />
      <div
        className="font-quicksand min-h-screen flex flex-col transition-colors duration-500"
        style={{
          background: "transparent",
          position: "relative",
          overflow: "hidden",
        }}
      >
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
        {/* Invisible style navbar (transparent, minimal) */}
        <nav
          className={`fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30 select-none transition-transform duration-300 ease-out ${
            hideNav ? "-translate-y-full" : "translate-y-0"
          }`}
          style={{ background: "transparent" }}
        >
          <Logo />
          {isAuthed ? (
            <Link href="/profile">
              <Button
                size="sm"
                className="relative ml-4 rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-white overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={playClick}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600/70 via-cyan-500/70 to-fuchsia-500/70 backdrop-blur-md" />
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
                <span className="relative flex items-center gap-1">
                  <span className="text-xs opacity-70">🚀</span> Profile
                </span>
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button
                size="sm"
                className="relative ml-4 rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-white overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={playClick}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/70 via-pink-500/70 to-indigo-500/70 backdrop-blur-md" />
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.35),transparent_60%)]" />
                <span className="relative flex items-center gap-1">
                  <span className="text-xs opacity-70">✨</span> Sign In
                </span>
              </Button>
            </Link>
          )}
        </nav>
        <main className="flex-1 w-full px-4 z-10 relative py-10 md:py-14">
          {/* Hero Banner (separate container) */}
          <section className="max-w-5xl mx-auto mb-10 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1
                className="text-5xl font-bold leading-tight text-white drop-shadow-lg"
                style={{ textShadow: "0 0 16px #fff, 0 0 32px #1a237e" }}
              >
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-pink-300">
                  Space Math
                </span>
              </h1>
              <p
                className="text-lg text-white/90 max-w-xl"
                style={{ textShadow: "0 0 8px #000" }}
              >
                Embark on a cosmic journey to master math skills through playful
                exploration, adaptive feedback, and AI powered guidance.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href={isAuthed ? "/ai-math" : "/auth?next=/ai-math"}>
                  <button
                    className="px-7 py-3 rounded-full font-semibold shadow-lg text-white text-lg transition hover:scale-[1.03]"
                    style={{
                      background:
                        "linear-gradient(90deg,#536dfe 0%,#00e5ff 100%)",
                      boxShadow: "0 0 16px #00e5ff,0 0 32px #536dfe",
                    }}
                    onClick={playClick}
                  >
                    Start Playing
                  </button>
                </Link>
                {!isAuthed && (
                  <Link href="/auth">
                    <button
                      className="px-7 py-3 rounded-full font-semibold shadow-lg text-white text-lg transition hover:scale-[1.03]"
                      style={{
                        background:
                          "linear-gradient(90deg,#ec4899 0%,#8b5cf6 100%)",
                        boxShadow: "0 0 16px #ec4899,0 0 32px #8b5cf6",
                      }}
                      onClick={playClick}
                    >
                      Sign In
                    </button>
                  </Link>
                )}
              </div>
            </div>
            <div
              className="rounded-2xl p-8 backdrop-blur-md border border-white/15 shadow-2xl relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg,rgba(30,41,79,0.65) 0%,rgba(10,12,28,0.65) 100%)",
              }}
            >
              <div className="absolute -top-20 -right-32 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
              <h2 className="text-xl font-semibold text-cyan-200 mb-4 tracking-wide">
                Why Space Math?
              </h2>
              <ul className="space-y-3 text-sm text-indigo-50/90">
                <li>
                  • Engaging space-themed interactions reinforce concepts.
                </li>
                <li>• AI adapts to the learner&apos;s pace and style.</li>
                <li>• Track progress with performance insights.</li>
                <li>• Voice + AI help for early learners.</li>
              </ul>
            </div>
          </section>

          {/* Feature Cards Grid (separate container) */}
          <section className="max-w-6xl mx-auto mb-14">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-pink-300">Explore Modes</span>
              <span className="h-px flex-1 bg-gradient-to-r from-pink-300/50 to-transparent" />
            </h3>
            <div className="grid gap-8 md:grid-cols-4">
              <Link href="/ai-math" className="group" onClick={playClick}>
                <div className="relative h-full rounded-2xl p-6 flex flex-col gap-4 border border-white/15 bg-white/5 backdrop-blur-md shadow-xl transition group-hover:border-cyan-300/60 group-hover:shadow-cyan-400/30">
                  <div className="text-4xl">🧠</div>
                  <h4 className="text-xl font-semibold text-cyan-200">
                    AI Math Game
                  </h4>
                  <p className="text-sm text-indigo-50/80 flex-1">
                    Interactive, adaptive space gameplay that turns operations
                    into missions.
                  </p>
                  <span className="text-cyan-300 text-sm font-medium group-hover:underline">
                    Play →
                  </span>
                </div>
              </Link>
              <Link href="/math" className="group" onClick={playClick}>
                <div className="relative h-full rounded-2xl p-6 flex flex-col gap-4 border border-white/15 bg-white/5 backdrop-blur-md shadow-xl transition group-hover:border-pink-300/60 group-hover:shadow-pink-400/30">
                  <div className="text-4xl">✏️</div>
                  <h4 className="text-xl font-semibold text-pink-200">
                    Math Quiz
                  </h4>
                  <p className="text-sm text-indigo-50/80 flex-1">
                    Quick practice quizzes to sharpen accuracy and speed on core
                    skills.
                  </p>
                  <span className="text-pink-300 text-sm font-medium group-hover:underline">
                    Start →
                  </span>
                </div>
              </Link>
              <Link href="/learning-path" className="group" onClick={playClick}>
                <div className="relative h-full rounded-2xl p-6 flex flex-col gap-4 border border-white/15 bg-white/5 backdrop-blur-md shadow-xl transition group-hover:border-lime-300/60 group-hover:shadow-lime-400/30">
                  <div className="text-4xl">🛰️</div>
                  <h4 className="text-xl font-semibold text-lime-200">
                    Learning Path
                  </h4>
                  <p className="text-sm text-indigo-50/80 flex-1">
                    Structured progression through topics with gradual
                    difficulty ramp.
                  </p>
                  <span className="text-lime-300 text-sm font-medium group-hover:underline">
                    Go →
                  </span>
                </div>
              </Link>
              <Link href="/learn-ai" className="group" onClick={playClick}>
                <div className="relative h-full rounded-2xl p-6 flex flex-col gap-4 border border-white/15 bg-white/5 backdrop-blur-md shadow-xl transition group-hover:border-violet-300/60 group-hover:shadow-violet-400/30">
                  <div className="text-4xl">🤖</div>
                  <h4 className="text-xl font-semibold text-violet-200">
                    Learn AI
                  </h4>
                  <p className="text-sm text-indigo-50/80 flex-1">
                    Streaming AI tutor explaining core math concepts with gentle
                    guidance.
                  </p>
                  <span className="text-violet-300 text-sm font-medium group-hover:underline">
                    Explore →
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* Call To Action / Profile Section (separate container) */}
          <section className="max-w-5xl mx-auto mb-8">
            <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-indigo-600/30 to-cyan-500/30 backdrop-blur-md p-6 flex flex-col md:flex-row items-center gap-6 justify-between shadow-2xl">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-xl font-semibold text-white">
                  {isAuthed ? "Jump back in" : "Ready to launch?"}
                </h4>
                <p className="text-sm text-indigo-50/80">
                  {isAuthed
                    ? "Choose a mode and keep exploring the galaxy of numbers."
                    : "Create your profile to track progress and unlock adaptive help."}
                </p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                {isAuthed ? (
                  <Link href="/profile">
                    <button
                      className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg hover:scale-[1.04] transition"
                      onClick={playClick}
                    >
                      Profile
                    </button>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <button
                      className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-pink-500 to-violet-600 shadow-lg hover:scale-[1.04] transition"
                      onClick={playClick}
                    >
                      Sign Up
                    </button>
                  </Link>
                )}
                <Link href="/ai-math">
                  <button
                    className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-indigo-400 to-cyan-500 shadow-lg hover:scale-[1.04] transition"
                    onClick={playClick}
                  >
                    Play Now
                  </button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
