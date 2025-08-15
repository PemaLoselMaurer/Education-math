
"use client";



import React, { useRef } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Home() {
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const playClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play();
    }
  };
  return (
    <>
      {/* Font link moved to _document.tsx */}
      <audio ref={clickAudioRef} src="/button-click.mp3" preload="auto" style={{display:'none'}} />
      <div className="font-quicksand min-h-screen flex flex-col transition-colors duration-500" style={{
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Nebula/star field overlay */}
        <div style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(ellipse at 60% 20%, rgba(59,7,100,0.58) 0%, rgba(24,26,42,0) 80%)',
        }} />
        {/* Navbar */}
        <nav className="w-full flex items-center justify-between px-6 py-2 rounded-b-[2.5rem] bg-white/60 dark:bg-gray-900/60 shadow-xl border-b-4 border-blue-200 z-20 relative backdrop-blur-md" style={{background: 'linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(59,130,246,0.18) 100%)'}}>
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">🦉</span>
            <span className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-200 drop-shadow font-[Comic Sans MS,Comic Sans,cursive]">
              Math Quest
            </span>
          </div>
          <Link href="/signin">
            <Button size="sm" className="ml-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-[Comic Sans MS,Comic Sans,cursive] border-2 border-pink-300" onClick={playClick}>Sign In</Button>
          </Link>
        </nav>
        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 relative">
          <section className="w-full max-w-2xl flex flex-col items-center justify-center gap-1">
            <div
              className="z-10 flex flex-col items-center justify-center gap-8"
              style={{
                background: "rgba(20, 24, 56, 0.85)",
                borderRadius: "1.5rem",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                padding: "3rem 2.5rem",
                maxWidth: 520,
              }}
            >
              <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4 text-center" style={{textShadow: "0 0 16px #fff, 0 0 32px #1a237e"}}>Welcome to Space Math!</h1>
              <p className="text-lg text-white/90 mb-8 max-w-xl text-center" style={{textShadow: "0 0 8px #000"}}>
                Embark on a cosmic journey to master math skills. Choose your path and start learning with fun, interactive games!
              </p>
              <div className="flex gap-6 flex-wrap justify-center">
                <Link href="/ai-math">
                  <button
                    className="px-8 py-3 rounded-lg text-xl font-semibold shadow-lg transition"
                    style={{
                      background: "linear-gradient(90deg, #536dfe 0%, #00e5ff 100%)",
                      color: "#fff",
                      boxShadow: "0 0 16px #00e5ff, 0 0 32px #536dfe",
                      border: "none",
                      outline: "none",
                      textShadow: "0 0 8px #000",
                    }}
                  >
                    AI Math Game
                  </button>
                </Link>
                <Link href="/math">
                  <button
                    className="px-8 py-3 rounded-lg text-xl font-semibold shadow-lg transition"
                    style={{
                      background: "linear-gradient(90deg, #a259ff 0%, #f500c7 100%)",
                      color: "#fff",
                      boxShadow: "0 0 16px #a259ff, 0 0 32px #f500c7",
                      border: "none",
                      outline: "none",
                      textShadow: "0 0 8px #000",
                    }}
                  >
                    Math Quiz
                  </button>
                </Link>
                <Link href="/learning-path">
                  <button
                    className="px-8 py-3 rounded-lg text-xl font-semibold shadow-lg transition"
                    style={{
                      background: "linear-gradient(90deg, #00c853 0%, #b2ff59 100%)",
                      color: "#fff",
                      boxShadow: "0 0 16px #b2ff59, 0 0 32px #00c853",
                      border: "none",
                      outline: "none",
                      textShadow: "0 0 8px #000",
                    }}
                  >
                    Learning Path
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
