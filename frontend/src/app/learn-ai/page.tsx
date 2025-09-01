"use client";
import React from "react";
import Link from "next/link";

/* Learn AI Page now dedicated to an interactive neural network visualization with real weight math. */

// Placeholder types removed (no chat in this version)

export default function LearnAIPage() {
  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(59,7,100,0.45),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-transparent/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <Link href="/" className="text-sm text-cyan-200 hover:underline">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
          Learn AI
        </h1>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-10">
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/learn-ai/neural-network"
            className="group rounded-2xl p-5 border border-cyan-300/20 bg-cyan-500/5 hover:bg-cyan-500/10 backdrop-blur-md transition shadow hover:shadow-cyan-500/20"
          >
            <h2 className="text-cyan-200 font-semibold mb-2 text-sm tracking-wide">
              Neural Network Demo
            </h2>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Interactive free‑hand shape classifier with live weights, feature
              pooling, and on‑page training.
            </p>
            <div className="mt-3 text-[10px] text-cyan-300/70 group-hover:text-cyan-200">
              Open →
            </div>
          </Link>
          <Link
            href="/learn-ai/mnist"
            className="group rounded-2xl p-5 border border-emerald-300/25 bg-emerald-500/5 hover:bg-emerald-500/10 backdrop-blur-md transition shadow hover:shadow-emerald-500/25"
          >
            <h2 className="text-emerald-200 font-semibold mb-2 text-sm tracking-wide">
              MNIST Digits
            </h2>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Draw 0‑9 and watch real‑time predictions from your exported
              PyTorch MLP.
            </p>
            <div className="mt-3 text-[10px] text-emerald-300/70 group-hover:text-emerald-200">
              Open →
            </div>
          </Link>
          <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-indigo-200 font-semibold mb-2 text-sm tracking-wide">
                Your Next Subtopic
              </h2>
              <p className="text-[11px] text-indigo-100/60 leading-relaxed">
                Placeholder for another AI lesson or experiment you will build.
                Create a new folder under{" "}
                <code className="px-1 bg-white/10 rounded">
                  /learn-ai/&lt;slug&gt;
                </code>{" "}
                with a{" "}
                <code className="px-1 bg-white/10 rounded">page.tsx</code>.
              </p>
            </div>
            <div className="mt-4 text-[10px] text-indigo-300/60">
              (Nothing rendered yet)
            </div>
          </div>
        </section>
        <section className="text-xs md:text-sm leading-relaxed text-indigo-100/80 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow">
          <h2 className="text-cyan-200 font-semibold mb-2 text-sm">
            How to add more
          </h2>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] md:text-xs">
            <li>
              Create a directory like{" "}
              <code className="px-1 bg-white/10 rounded">
                frontend/src/app/learn-ai/your-topic
              </code>
              .
            </li>
            <li>
              Add a <code className="px-1 bg-white/10 rounded">page.tsx</code>{" "}
              exporting a React component.
            </li>
            <li>
              Link it here or navigate directly to{" "}
              <code className="px-1 bg-white/10 rounded">
                /learn-ai/your-topic
              </code>
              .
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
