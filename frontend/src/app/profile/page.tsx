"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const [me, setMe] = useState<{ userId: number; username: string } | null>(
    null
  );
  const [profile, setProfile] = useState<{
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    favouriteSubjects?: string[] | null;
    hobbies?: string[] | null;
    email?: string;
    avatarUrl?: string | null;
    username?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perf] = useState<{
    quizzesTaken: number;
    correctRate: number;
    streak: number;
  }>({ quizzesTaken: 12, correctRate: 86, streak: 5 });
  const [uploading, setUploading] = useState(false);
  // Mock performance history for the chart (percent correct over recent sessions)
  const perfHistory = [72, 78, 81, 79, 85, 90, 86];
  // Fixed 0–100 scale with 10% vertical padding (map 0..100 -> 90..10)
  const toY = (val: number) => 90 - Math.max(0, Math.min(100, val)) * 0.8;
  const chartPoints = perfHistory
    .map((v, i) => {
      const x = (i / (perfHistory.length - 1)) * 100;
      const y = toY(v);
      return `${x},${y}`;
    })
    .join(" ");
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
        const base =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const res = await fetch(`${base}/user/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          userId: number;
          username: string;
        } | null;
        if (alive) setMe(data);
        if (data) {
          const pRes = await fetch(`${base}/user/profile`, {
            credentials: "include",
          });
          if (pRes.ok) {
            const p = await pRes.json();
            if (alive) setProfile(p);
          }
        }
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
        { method: "POST", credentials: "include" }
      );
      window.location.href = "/auth";
    } catch {
      setError("Logout failed");
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      setUploading(true);
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
          }/user/avatar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ imageData }),
          }
        );
        if (res.ok) {
          const { avatarUrl } = await res.json();
          setProfile((p) => ({ ...(p || {}), avatarUrl }));
        }
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
        <main className="flex-1 px-4 py-8 z-10 relative">
          <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column: Avatar + details + Recent activity */}
            <div className="md:col-span-1 space-y-6">
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16">
                      <AvatarImage
                        src={
                          profile?.avatarUrl
                            ? `${
                                process.env.NEXT_PUBLIC_BACKEND_URL ||
                                "http://localhost:3001"
                              }${profile?.avatarUrl}`
                            : undefined
                        }
                        alt={me?.username || "avatar"}
                      />
                      <AvatarFallback>
                        {me?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xl font-semibold">
                        {profile?.firstName || me?.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {profile?.email || ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium">Change avatar</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={onAvatarChange}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="text-xs text-gray-500 mt-1">
                        Uploading…
                      </div>
                    )}
                  </div>
                  {/* Profile details below the choose pic button */}
                  <div className="mt-6 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Username</span>
                      <span className="font-medium">{me?.username}</span>
                    </div>
                    {(profile?.firstName || profile?.lastName) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name</span>
                        <span className="font-medium">
                          {[profile?.firstName, profile?.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      </div>
                    )}
                    {typeof profile?.age === "number" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Age</span>
                        <span className="font-medium">{profile?.age}</span>
                      </div>
                    )}
                    {profile?.favouriteSubjects &&
                      profile.favouriteSubjects.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subjects</span>
                          <span className="font-medium text-right">
                            {profile.favouriteSubjects.join(", ")}
                          </span>
                        </div>
                      )}
                    {profile?.hobbies && profile.hobbies.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hobbies</span>
                        <span className="font-medium text-right">
                          {profile.hobbies.join(", ")}
                        </span>
                      </div>
                    )}
                    {profile?.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium">{profile.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity moved to left column */}
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-2">
                    Recent activity
                  </h2>
                  <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                    <li>Completed Algebra Quiz #3</li>
                    <li>New high score in AI Bubble Game</li>
                    <li>Practiced Multiplication for 10 minutes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Performance (with graph) */}
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-white/70 dark:bg-gray-900/60 backdrop-blur">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Simple line chart using SVG */}
                  <div className="w-full h-40 md:h-48 lg:h-56">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full"
                      preserveAspectRatio="none"
                      shapeRendering="geometricPrecision"
                    >
                      <defs>
                        <linearGradient
                          id="perfGradient"
                          x1="0"
                          x2="1"
                          y1="0"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                      {/* grid lines */}
                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="100"
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="0.3"
                        />
                      ))}
                      {/* polyline */}
                      <polyline
                        fill="none"
                        stroke="url(#perfGradient)"
                        strokeWidth="2.2"
                        points={chartPoints}
                      />
                      {/* points */}
                      {perfHistory.map((v, i) => {
                        const x = (i / (perfHistory.length - 1)) * 100;
                        const y = toY(v);
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1.8"
                            fill="#f472b6"
                            stroke="#fff"
                            strokeWidth="0.5"
                          />
                        );
                      })}
                    </svg>
                    <div className="mt-1 text-xs text-gray-500">
                      Accuracy over last {perfHistory.length} sessions
                    </div>
                  </div>
                  {/* KPI tiles */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {perf.quizzesTaken}
                      </div>
                      <div className="text-xs text-gray-500">Quizzes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {perf.correctRate}%
                      </div>
                      <div className="text-xs text-gray-500">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{perf.streak}</div>
                      <div className="text-xs text-gray-500">Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
