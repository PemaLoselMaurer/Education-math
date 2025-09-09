"use client";
import React from "react";
import Link from "next/link";

export default function LinearEquationNeuralNetworkPage() {
  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_20%,rgba(14,165,233,0.18),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <Link
          href="/learn-ai/linear"
          className="text-sm text-cyan-200 hover:underline"
        >
          ← Back to Linear AI
        </Link>
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-emerald-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
          Linear Equation & Neural Network
        </h1>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-10">
        <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/20 via-indigo-900/20 to-pink-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-200 via-pink-200 to-emerald-200 bg-clip-text text-transparent">
            What is a Linear Equation?
          </h2>
          <p className="text-indigo-100/80 text-base max-w-2xl">
            A linear equation is a math rule that makes a straight line when you
            draw it. It looks like{" "}
            <span className="text-cyan-200 font-bold">y = mx + b</span>, where{" "}
            <span className="text-cyan-200">m</span> is the slope (how steep)
            and <span className="text-cyan-200">b</span> is where the line
            starts.
          </p>
          <div className="mt-4 text-[15px] text-cyan-100/90">
            Try changing <span className="font-bold">m</span> and{" "}
            <span className="font-bold">b</span> to see how the line moves!
          </div>
          {/* Simple interactive demo for line equation */}
          <div className="mt-4 p-4 rounded-xl bg-cyan-900/10 border border-cyan-400/30">
            <LinearEquationDemo />
          </div>
        </section>
        <section className="rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-900/20 via-cyan-900/20 to-indigo-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent">
            How Do Neural Networks Use Linear Equations?
          </h2>
          <p className="text-indigo-100/80 text-base max-w-2xl">
            Neural networks are smart computer programs that learn by stacking
            lots of linear equations and adding a twist called activation. Each
            part (called a neuron) uses a rule like{" "}
            <span className="text-cyan-200 font-bold">y = w·x + b</span> to make
            decisions.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-indigo-100/85 text-[15px]">
            <li>
              Each neuron is like a mini calculator using a linear equation.
            </li>
            <li>Neural networks connect many neurons to solve big problems.</li>
            <li>
              They learn by changing the numbers (weights and bias) to get
              better answers.
            </li>
          </ul>
          <div className="mt-4 p-4 rounded-xl bg-emerald-900/10 border border-emerald-400/30">
            <NeuralNetworkVisual />
          </div>
        </section>
      </main>
    </div>
  );
}

// Simple interactive demo for linear equation
function LinearEquationDemo() {
  const [m, setM] = React.useState(1);
  const [b, setB] = React.useState(0);
  const toX = (x: number) => 40 + ((x + 1) / 2) * 320;
  const toY = (y: number) => 200 - ((y + 1) / 2) * 160;
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      <svg viewBox="0 0 400 230" className="w-full h-[230px] select-none">
        {/* Axes */}
        <line
          x1={40}
          y1={200}
          x2={360}
          y2={200}
          stroke="#fff2"
          strokeWidth={1}
        />
        <line x1={40} y1={40} x2={40} y2={200} stroke="#fff2" strokeWidth={1} />
        {/* Line */}
        {(() => {
          const x1 = -1,
            x2 = 1;
          const y1 = m * x1 + b;
          const y2 = m * x2 + b;
          return (
            <line
              x1={toX(x1)}
              y1={toY(y1)}
              x2={toX(x2)}
              y2={toY(y2)}
              stroke="#38bdf8"
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })()}
      </svg>
      <div className="flex flex-col gap-4 items-center">
        <label className="flex flex-col gap-1 text-[14px] text-cyan-200">
          Slope (m):
          <input
            type="range"
            min={-2}
            max={2}
            step={0.01}
            value={m}
            onChange={(e) => setM(parseFloat(e.target.value))}
            className="w-40"
          />
          <span className="text-cyan-100">{m.toFixed(2)}</span>
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-cyan-200">
          Intercept (b):
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={b}
            onChange={(e) => setB(parseFloat(e.target.value))}
            className="w-40"
          />
          <span className="text-cyan-100">{b.toFixed(2)}</span>
        </label>
        <div className="mt-2 text-[15px] text-cyan-300 font-bold">
          Equation:{" "}
          <span className="text-cyan-100">
            y = {m.toFixed(2)}x + {b.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Simple neural network visual (no interaction, just a diagram)
function NeuralNetworkVisual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 400 120" className="w-full h-[120px]">
        {/* Input layer */}
        <circle
          cx={60}
          cy={60}
          r={18}
          fill="#38bdf8"
          stroke="#fff"
          strokeWidth={2}
        />
        <text x={60} y={65} textAnchor="middle" fontSize={16} fill="#fff">
          x
        </text>
        {/* Hidden layer */}
        <circle
          cx={200}
          cy={40}
          r={18}
          fill="#a7f3d0"
          stroke="#fff"
          strokeWidth={2}
        />
        <text x={200} y={45} textAnchor="middle" fontSize={16} fill="#222">
          Neuron
        </text>
        {/* Output layer */}
        <circle
          cx={340}
          cy={60}
          r={18}
          fill="#fbbf24"
          stroke="#fff"
          strokeWidth={2}
        />
        <text x={340} y={65} textAnchor="middle" fontSize={16} fill="#222">
          y
        </text>
        {/* Arrows */}
        <line
          x1={78}
          y1={60}
          x2={182}
          y2={40}
          stroke="#fff"
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
        <line
          x1={218}
          y1={40}
          x2={322}
          y2={60}
          stroke="#fff"
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#fff" />
          </marker>
        </defs>
      </svg>
      <div className="text-[13px] text-emerald-200/90 text-center max-w-md">
        Each neuron uses a linear equation to turn input (
        <span className="font-bold text-cyan-200">x</span>) into output (
        <span className="font-bold text-yellow-300">y</span>). Neural networks
        connect many neurons to solve big problems!
      </div>
    </div>
  );
}
