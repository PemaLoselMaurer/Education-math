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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-12">
        {/* Hero / Intro */}
        <section className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-pink-500/10 blur-xl pointer-events-none" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-6 md:px-12 py-10 flex flex-col md:flex-row gap-10 overflow-hidden shadow-lg shadow-cyan-500/5">
            <div className="flex-1 min-w-[280px] space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 text-[11px] tracking-wide text-cyan-100/80 uppercase">
                <span className="animate-pulse">●</span> Interactive Learning
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-r from-cyan-200 via-indigo-200 to-pink-200 bg-clip-text text-transparent">
                Learn AI by touching the math.
              </h2>
              <p className="text-[13px] md:text-[14px] leading-relaxed text-indigo-100/80 max-w-xl">
                Draw digits, probe activations, watch weights fire, and see live
                inference from real exported models. These micro‑labs are built
                for intuition first—no setup, just experiment.
              </p>
              <ul className="flex flex-wrap gap-2 pt-1">
                <li className="px-3 py-1 rounded-full text-[10px] bg-cyan-500/15 border border-cyan-400/30 text-cyan-200/90">
                  Real Weights
                </li>
                <li className="px-3 py-1 rounded-full text-[10px] bg-pink-500/15 border border-pink-400/30 text-pink-200/90">
                  Live Activations
                </li>
                <li className="px-3 py-1 rounded-full text-[10px] bg-indigo-500/15 border border-indigo-400/30 text-indigo-200/90">
                  Visualization First
                </li>
              </ul>
            </div>
            {/* Decorative SVG */}
            <div className="flex items-center justify-center flex-1 md:max-w-md">
              <svg
                width="340"
                height="220"
                viewBox="0 0 340 220"
                className="text-cyan-300/40"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="1" y1="1" y2="0">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {/* layer nodes */}
                {[
                  [60, 5],
                  [170, 7],
                  [280, 3],
                ].map((layer, li) => {
                  const count = layer[1];
                  const x = layer[0];
                  return Array.from({ length: count }).map((_, i) => {
                    const y = 30 + i * (160 / Math.max(1, count - 1));
                    return (
                      <circle
                        key={`n-${li}-${i}`}
                        cx={x}
                        cy={y}
                        r={10}
                        fill={li === 1 ? "url(#g1)" : "url(#g2)"}
                        fillOpacity={li === 0 ? 0.5 : 0.85}
                        stroke="#ffffff30"
                        strokeWidth={1}
                      />
                    );
                  });
                })}
                {/* connections */}
                {(() => {
                  const layers = [
                    [60, 5],
                    [170, 7],
                    [280, 3],
                  ];
                  const lines = [] as React.ReactNode[];
                  for (let l = 0; l < layers.length - 1; l++) {
                    const [x1, c1] = layers[l];
                    const [x2, c2] = layers[l + 1];
                    for (let i = 0; i < c1; i++) {
                      for (let j = 0; j < c2; j++) {
                        const y1 = 30 + i * (160 / Math.max(1, c1 - 1));
                        const y2 = 30 + j * (160 / Math.max(1, c2 - 1));
                        lines.push(
                          <line
                            key={`l-${l}-${i}-${j}`}
                            x1={x1 + 10}
                            y1={y1}
                            x2={x2 - 10}
                            y2={y2}
                            stroke={l === 0 ? "url(#g1)" : "url(#g2)"}
                            strokeOpacity={0.4}
                            strokeWidth={1.2}
                          />
                        );
                      }
                    }
                  }
                  return lines;
                })()}
              </svg>
            </div>
          </div>
        </section>
        {/* Demo Cards */}
        <section className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/learn-ai/neural-network"
            className="group relative rounded-2xl p-5 border border-cyan-300/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/10 hover:from-cyan-500/15 hover:to-indigo-500/20 backdrop-blur-xl transition shadow-md hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Open Neural Network Demo"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.18),transparent_70%)]" />
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-cyan-200 font-semibold mb-2 text-sm tracking-wide flex items-center gap-2">
                <span className="text-base">🧠</span> Neural Network Demo
              </h2>
              <span className="text-[10px] px-2 py-[2px] rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-100/80 uppercase tracking-wide">
                Live
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Interactive free‑hand shape classifier with live weights, feature
              pooling, and on‑page training.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-cyan-300/70 group-hover:text-cyan-200">
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
          </Link>

          <Link
            href="/learn-ai/mnist"
            className="group relative rounded-2xl p-5 border border-emerald-300/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/20 backdrop-blur-xl transition shadow-md hover:shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Open MNIST Digits Demo"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_55%_45%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-emerald-200 font-semibold mb-2 text-sm tracking-wide flex items-center gap-2">
                <span className="text-base">✍️</span> MNIST Digits
              </h2>
              <span className="text-[10px] px-2 py-[2px] rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-100/80 uppercase tracking-wide">
                Vision
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Draw 0‑9 and watch real‑time predictions from your exported
              PyTorch MLP.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-300/70 group-hover:text-emerald-200">
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
          </Link>
          {/* Unit 1: Linear Models */}
          <Link
            href="/learn-ai/linear"
            className="group relative rounded-2xl p-5 border border-emerald-300/25 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 hover:from-emerald-500/15 hover:to-cyan-500/20 backdrop-blur-xl transition shadow-md hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Open Linear Models Lesson"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_55%_45%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-emerald-200 font-semibold mb-2 text-sm tracking-wide flex items-center gap-2">
                <span className="text-base">📈</span> Unit 1: Linear Models
              </h2>
              <span className="text-[10px] px-2 py-[2px] rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-100/80 uppercase tracking-wide">
                New
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Explore y = mx + b, gradients, MSE, and live gradient descent on
              synthetic data.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-300/70 group-hover:text-emerald-200">
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
          </Link>
          {/* Unit 2: Linear Equation & Neural Network */}
          <Link
            href="/learn-ai/linear-equation-neural-network"
            className="group relative rounded-2xl p-5 border border-cyan-300/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 hover:from-cyan-500/15 hover:to-emerald-500/20 backdrop-blur-xl transition shadow-md hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Open Linear Equation & Neural Network Lesson"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_55%_45%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-cyan-200 font-semibold mb-2 text-sm tracking-wide flex items-center gap-2">
                <span className="text-base">🔗</span> Unit 2: Linear Equation &
                Neural Network
              </h2>
              <span className="text-[10px] px-2 py-[2px] rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-100/80 uppercase tracking-wide">
                Core
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Connect y = mx + b to neurons, weights, bias, and activation.
              Build intuition for how networks stack linear parts.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-cyan-300/70 group-hover:text-cyan-200">
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
          </Link>
          {/* Unit 3: Forward Propagation */}
          <Link
            href="/learn-ai/forward-propagation"
            className="group relative rounded-2xl p-5 border border-indigo-300/25 bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10 hover:from-indigo-500/15 hover:to-pink-500/20 backdrop-blur-xl transition shadow-md hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Open Forward Propagation Lesson"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_55%_45%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-indigo-200 font-semibold mb-2 text-sm tracking-wide flex items-center gap-2">
                <span className="text-base">➡️</span> Unit 3: Forward
                Propagation
              </h2>
              <span className="text-[10px] px-2 py-[2px] rounded-full bg-indigo-400/15 border border-indigo-300/30 text-indigo-100/80 uppercase tracking-wide">
                Core
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed">
              Watch inputs flow layer by layer. Adjust weights, bias &
              activation and see outputs update instantly.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-indigo-300/70 group-hover:text-indigo-200">
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
          </Link>
          {/* Unit 4: Backpropagation */}
          <Link
            href="/learn-ai/backpropagation"
            className="group relative rounded-2xl p-5 border border-yellow-400/25 bg-gradient-to-br from-yellow-500/10 via-transparent to-pink-500/10 hover:from-yellow-500/15 hover:to-pink-500/20 backdrop-blur-xl transition shadow-md hover:shadow-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Open Backpropagation Lesson"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_55%_45%,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-yellow-200 font-semibold mb-2 text-sm tracking-wide flex items-center gap-2">
                <span className="text-base">🔄</span> Unit 4: Backpropagation
              </h2>
              <span className="text-[10px] px-2 py-[2px] rounded-full bg-yellow-400/15 border border-yellow-300/30 text-yellow-100/80 uppercase tracking-wide">
                Core
              </span>
            </div>
            <p className="text-[11px] text-yellow-100/70 leading-relaxed">
              How neural networks learn by updating weights using gradients.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-yellow-300/70 group-hover:text-yellow-200">
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
