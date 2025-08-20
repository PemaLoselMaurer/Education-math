"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [me, setMe] = useState<{ userId: number; username: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const playClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      void clickAudioRef.current.play();
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
          }/user/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          userId: number;
          username: string;
        } | null;
        if (alive) setMe(data);
      } catch {
        if (alive) setError("Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onLogout = async () => {
    setError(null);
    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        }/user/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      window.location.href = "/auth";
    } catch {
      setError("Logout failed");
    }
  };

  if (loading) return <div className="p-6 text-blue-100">Loading…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <>
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

        {/* Navbar (same visual style as homepage) */}
        <nav
          className="w-full flex items-center justify-between px-6 py-2 rounded-b-[2.5rem] bg-white/60 dark:bg-gray-900/60 shadow-xl border-b-4 border-blue-200 z-20 relative backdrop-blur-md"
          style={{
            background:
              "linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(59,130,246,0.18) 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">🦉</span>
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-200 drop-shadow font-[Comic Sans MS,Comic Sans,cursive]"
            >
              Math Quest
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/ai-math">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-2 border-blue-300"
                onClick={playClick}
              >
                AI Math
              </Button>
            </Link>
            <Button
              size="sm"
              className="ml-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-[Comic Sans MS,Comic Sans,cursive] border-2 border-pink-300"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 relative">
          <section className="w-full max-w-2xl flex flex-col items-center justify-center gap-1">
            <div
              className="z-10 flex flex-col items-center justify-center gap-6"
              style={{
                background: "rgba(20, 24, 56, 0.85)",
                borderRadius: "1.5rem",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                padding: "2.5rem 2rem",
                maxWidth: 520,
              }}
            >
              <h1
                className="text-4xl font-bold text-white drop-shadow-lg text-center"
                style={{ textShadow: "0 0 16px #fff, 0 0 32px #1a237e" }}
              >
                Your Profile
              </h1>
              {me ? (
                <div className="w-full space-y-3 text-white/90">
                  <div>
                    <span className="font-semibold">User ID:</span> {me.userId}
                  </div>
                  <div>
                    <span className="font-semibold">Username:</span>{" "}
                    {me.username}
                  </div>
                </div>
              ) : (
                <div className="text-white/80">No user</div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
