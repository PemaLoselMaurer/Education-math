"use client";
import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Lazy load the moved demo component (now colocated in this folder)
const NeuralNetworkDemo = dynamic(() => import("./NeuralNetworkDemo"), {
  ssr: false,
});

export default function NeuralNetworkSubtopicPage() {
  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_20%,rgba(59,7,100,0.5),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-transparent/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
          Neural Network Demo
        </h1>
        <Link
          href="/learn-ai"
          className="text-sm text-indigo-200 hover:underline ml-auto"
        >
          Learn AI
        </Link>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        <NeuralNetworkDemo />
      </main>
    </div>
  );
}
