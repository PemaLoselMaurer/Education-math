"use client";

import React, { useState, useMemo } from "react";
// Inline SVG diagram replaces external /forward-propa.png image to avoid missing resource errors
import Link from "next/link";

/* Unit 3: Forward Propagation Interactive Lesson */

interface LayerConfig {
  neurons: number;
  activation: ActivationType;
}

type ActivationType = "linear" | "relu" | "sigmoid";

function activate(type: ActivationType, x: number): number {
  switch (type) {
    case "relu":
      return Math.max(0, x);
    case "sigmoid":
      return 1 / (1 + Math.exp(-x));
    default:
      return x; // linear
  }
}

// Static forward propagation diagram (Input -> Hidden -> Output with biases)
function ForwardDiagram() {
  return (
    <div className="flex justify-center my-6">
      <svg
        role="img"
        aria-label="Forward propagation diagram showing input layer, hidden layer with two neurons, output neuron, weights and biases"
        width={640}
        height={360}
        viewBox="0 0 640 360"
        className="max-w-full h-auto rounded-2xl shadow-[0_2px_16px_rgba(59,7,100,0.15)] bg-transparent"
      >
        <defs>
          <marker
            id="arrow-tip"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#222" />
          </marker>
          <linearGradient id="gInput" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="gHidden" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="gOutput" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="gBias" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
          <style>{`
            text { font-family: 'Quicksand', system-ui, sans-serif; }
            .small { font-size: 11px; }
            .label { font-size: 13px; font-weight:600; }
          `}</style>
        </defs>
        {/* Labels */}
        <text x="80" y="90" className="label" textAnchor="middle" fill="#fff">
          Input layer
        </text>
        <text x="320" y="40" className="label" textAnchor="middle" fill="#fff">
          Hidden layer
        </text>
        <text x="520" y="90" className="label" textAnchor="middle" fill="#fff">
          Output layer
        </text>
        <text x="560" y="180" className="label" textAnchor="start" fill="#fff">
          Bias
        </text>
        {/* Input neurons */}
        <circle
          cx="120"
          cy="150"
          r="32"
          fill="url(#gInput)"
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx="120"
          cy="250"
          r="32"
          fill="url(#gInput)"
          stroke="#fff"
          strokeWidth="2"
        />
        <text
          x="120"
          y="155"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          x1
        </text>
        <text
          x="120"
          y="255"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          x2
        </text>
        {/* Hidden neurons */}
        <circle
          cx="320"
          cy="150"
          r="36"
          fill="url(#gHidden)"
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx="320"
          cy="250"
          r="36"
          fill="url(#gHidden)"
          stroke="#fff"
          strokeWidth="2"
        />
        <text
          x="320"
          y="145"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          h1
        </text>
        <text
          x="320"
          y="165"
          textAnchor="middle"
          fill="#0a0a0a"
          className="small"
        >
          a1
        </text>
        <text
          x="320"
          y="245"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          h2
        </text>
        <text
          x="320"
          y="265"
          textAnchor="middle"
          fill="#0a0a0a"
          className="small"
        >
          a2
        </text>
        {/* Output neuron */}
        <circle
          cx="520"
          cy="200"
          r="40"
          fill="url(#gOutput)"
          stroke="#fff"
          strokeWidth="2"
        />
        <text
          x="520"
          y="195"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          h3
        </text>
        <text
          x="520"
          y="215"
          textAnchor="middle"
          fill="#0a0a0a"
          className="small"
        >
          a3
        </text>
        <text
          x="520"
          y="115"
          textAnchor="middle"
          fill="#fff"
          fontSize="14"
          fontWeight="600"
        >
          ŷ
        </text>
        {/* Bias nodes */}
        <circle
          cx="440"
          cy="140"
          r="20"
          fill="url(#gBias)"
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx="440"
          cy="260"
          r="20"
          fill="url(#gBias)"
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx="600"
          cy="200"
          r="20"
          fill="url(#gBias)"
          stroke="#fff"
          strokeWidth="2"
        />
        <text x="440" y="145" textAnchor="middle" fontSize="12" fill="#594500">
          b1
        </text>
        <text x="440" y="265" textAnchor="middle" fontSize="12" fill="#594500">
          b2
        </text>
        <text x="600" y="205" textAnchor="middle" fontSize="12" fill="#594500">
          b3
        </text>
        {/* Weight connections */}
        <g strokeWidth="3" stroke="#111">
          <line
            x1="152"
            y1="150"
            x2="288"
            y2="150"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="152"
            y1="150"
            x2="288"
            y2="250"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="152"
            y1="250"
            x2="288"
            y2="150"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="152"
            y1="250"
            x2="288"
            y2="250"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="356"
            y1="150"
            x2="480"
            y2="200"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="356"
            y1="250"
            x2="480"
            y2="200"
            markerEnd="url(#arrow-tip)"
          />
        </g>
        {/* Bias arrows */}
        <g strokeWidth="2.5" stroke="#6b7280">
          <line
            x1="460"
            y1="140"
            x2="500"
            y2="188"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="460"
            y1="260"
            x2="500"
            y2="212"
            markerEnd="url(#arrow-tip)"
          />
          <line
            x1="580"
            y1="200"
            x2="560"
            y2="200"
            markerEnd="url(#arrow-tip)"
          />
        </g>
        {/* Weight labels */}
        <text x="220" y="138" className="small" textAnchor="middle" fill="#fff">
          w1
        </text>
        <text x="220" y="170" className="small" textAnchor="middle" fill="#fff">
          w2
        </text>
        <text x="220" y="230" className="small" textAnchor="middle" fill="#fff">
          w3
        </text>
        <text x="220" y="262" className="small" textAnchor="middle" fill="#fff">
          w4
        </text>
        <text x="420" y="160" className="small" textAnchor="middle" fill="#fff">
          w5
        </text>
        <text x="420" y="240" className="small" textAnchor="middle" fill="#fff">
          w6
        </text>
      </svg>
    </div>
  );
}

export default function ForwardPropagationPage() {
  const [inputs, setInputs] = useState<number[]>([0.5, -0.2, 0.9]);
  const [layers, setLayers] = useState<LayerConfig[]>([
    { neurons: 4, activation: "relu" },
    { neurons: 3, activation: "sigmoid" },
  ]);
  // Use deterministic initial weights/biases for SSR
  const [weights, setWeights] = useState<number[][][]>(() => {
    return layers.map((layer, li) => {
      const prevSize = li === 0 ? inputs.length : layers[li - 1].neurons;
      return Array.from({ length: prevSize }, () =>
        Array.from({ length: layer.neurons }, () => 0.1)
      );
    });
  });
  const [biases, setBiases] = useState<number[][]>(
    layers.map((layer) => Array.from({ length: layer.neurons }, () => 0))
  );

  React.useEffect(() => {
    setWeights(
      layers.map((layer, li) => {
        const prevSize = li === 0 ? inputs.length : layers[li - 1].neurons;
        return Array.from({ length: prevSize }, () =>
          Array.from({ length: layer.neurons }, () => 0.1)
        );
      })
    );
    setBiases(
      layers.map((layer) => Array.from({ length: layer.neurons }, () => 0))
    );
  }, [layers, inputs.length]);

  const forward = useMemo(() => {
    const activations: number[][] = [inputs];
    layers.forEach((layer, li) => {
      const prev = activations[li];
      const w = weights[li] || [];
      const b = biases[li] || [];
      const z: number[] = [];
      for (let j = 0; j < layer.neurons; j++) {
        let sum = 0;
        for (let i = 0; i < prev.length; i++) {
          sum += prev[i] * (w[i]?.[j] ?? 0);
        }
        sum += b[j] ?? 0;
        z.push(activate(layer.activation, sum));
      }
      activations.push(z);
    });
    return activations;
  }, [inputs, layers, weights, biases]);

  function randomizeParams() {
    setWeights(
      layers.map((layer, li) => {
        const prevSize = li === 0 ? inputs.length : layers[li - 1].neurons;
        return Array.from({ length: prevSize }, () =>
          Array.from(
            { length: layer.neurons },
            () => +(Math.random() * 1 - 0.5).toFixed(2)
          )
        );
      })
    );
    setBiases(
      layers.map((layer) =>
        Array.from(
          { length: layer.neurons },
          () => +(Math.random() * 0.4 - 0.2).toFixed(2)
        )
      )
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(59,7,100,0.45),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-transparent/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-indigo-300 via-pink-200 to-cyan-300 bg-clip-text text-transparent">
          Unit 3: Forward Propagation
        </h1>
        <Link
          href="/learn-ai"
          className="text-sm text-cyan-200 hover:underline ml-auto"
        >
          ← Learn AI
        </Link>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-12">
        {/* Intro Section */}
        <section className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-pink-500/10 blur-xl pointer-events-none" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-6 md:px-12 py-10 flex flex-col gap-8 overflow-hidden shadow-lg shadow-indigo-500/10">
            {/* Animated Forward Propagation Visual */}
            {/* Animated visual removed as requested */}
            <h2 className="text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-r from-indigo-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
              How does information move through a network?
            </h2>
            <p className="text-indigo-100/80 text-base max-w-2xl">
              <b>Forward propagation</b> is the fundamental process in a neural
              network where input data passes through multiple layers to
              generate an output. Each neuron computes a weighted sum of its
              inputs, adds a bias, and applies an activation function to
              introduce non-linearity. This process is repeated for each layer,
              and the final output is produced by the output layer.
            </p>
            {/* Forward propagation diagram (inline SVG) */}
            <ForwardDiagram />
            <div className="mt-2">
              <b>Key steps:</b>
              <ul className="list-disc pl-5 mt-2">
                <li>
                  <b>Input Layer:</b> Input data is fed into the network, each
                  feature is a neuron. Inputs are often normalized.
                </li>
                <li>
                  <b>Hidden Layers:</b> Each neuron computes Z = WX + b, applies
                  activation (e.g., ReLU, sigmoid).
                </li>
                <li>
                  <b>Output Layer:</b> Generates the final prediction.
                  Activation depends on the task (softmax, sigmoid, linear).
                </li>
                <li>
                  <b>Prediction:</b> Output is compared to actual values using a
                  loss function.
                </li>
              </ul>
            </div>
            <div className="mt-4">
              <b>Mathematical Form:</b>
              <br />
              <span className="font-mono text-indigo-200">
                A[1] = σ(W[1]X + b[1])
              </span>
              <br />
              <span className="font-mono text-indigo-200">
                A[2] = σ(W[2]A[1] + b[2])
              </span>
              <br />
              <span className="font-mono text-indigo-200">
                Y = σ(W[3]A[2] + b[3])
              </span>
              <br />
            </div>
            <div className="mt-4">
              <b>Why is it important?</b> Forward propagation determines the
              output of the neural network for a given input and set of
              weights/biases. It is the basis for making predictions before
              weights are updated during backpropagation.
            </div>
            <div className="mt-4">
              <span className="text-[13px] text-indigo-300/80">
                Source:{" "}
                <a
                  href="https://www.geeksforgeeks.org/deep-learning/what-is-forward-propagation-in-neural-networks/"
                  target="_blank"
                  rel="noopener"
                  className="underline text-indigo-200"
                >
                  GeeksforGeeks Forward Propagation Guide
                </a>
              </span>
            </div>
            <div className="grid gap-5 md:grid-cols-3 text-[13px] text-indigo-100/80">
              <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-400/20">
                <p className="font-semibold text-indigo-200 mb-1">
                  1. Weighted Sum
                </p>
                <p>Each neuron computes Σ (input * weight) + bias.</p>
              </div>
              <div className="p-4 rounded-xl bg-pink-900/20 border border-pink-400/20">
                <p className="font-semibold text-pink-200 mb-1">
                  2. Activation
                </p>
                <p>
                  Transforms the sum into something more useful (non-linear).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cyan-900/20 border border-cyan-400/20">
                <p className="font-semibold text-cyan-200 mb-1">
                  3. Pass Forward
                </p>
                <p>The result becomes input for the next layer.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Forward Prop Section */}
        <section className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-900/10 via-pink-900/10 to-cyan-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-200 to-cyan-200 bg-clip-text text-transparent">
            Interactive Forward Propagation
          </h2>
          <div className="flex flex-col gap-10">
            <InputsPanel inputs={inputs} setInputs={setInputs} />
            <NetworkViz inputs={inputs} layers={layers} forward={forward} />
            <Controls
              layers={layers}
              setLayers={setLayers}
              regenerate={randomizeParams}
              setWeights={setWeights}
              setBiases={setBiases}
              inputs={inputs}
            />
          </div>
        </section>

        {/* Explanation Section */}
        <section className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-900/10 via-fuchsia-900/10 to-cyan-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
            Why activations matter
          </h2>
          <p className="text-indigo-100/80 text-[15px] max-w-3xl">
            Without activation functions, stacking layers would still act like a
            single linear transformation. Non-linear activations like ReLU or
            sigmoid let networks model complex patterns. Try switching
            activation types below to see how outputs change.
          </p>
          <ActivationLegend />
        </section>

        {/* Key Terms / Glossary Section */}
        <section className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-900/10 via-cyan-900/10 to-pink-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-200 via-cyan-200 to-pink-200 bg-clip-text text-transparent">
            Key Terms Explained Simply
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-indigo-100/85 text-[15px]">
            <li>
              <b>Weights:</b> Numbers that tell the network how important each
              input is. Bigger weights mean the input matters more for the
              answer.
            </li>
            <li>
              <b>Bias:</b> A number added to the result to help the network make
              better decisions. It lets the network shift answers up or down.
            </li>
            <li>
              <b>Activation Function:</b> A rule that changes the output of a
              neuron. It helps the network learn tricky patterns, not just
              straight lines.
            </li>
            <li>
              <b>ReLU (Rectified Linear Unit):</b> A simple activation function.
              If the number is negative, it becomes zero. If it’s positive, it
              stays the same. Helps networks learn fast and ignore bad signals.
            </li>
            <li>
              <b>Sigmoid:</b> An activation function that squashes numbers
              between 0 and 1. Useful for making decisions like yes/no or
              true/false.
            </li>
            <li>
              <b>Neuron:</b> A tiny calculator in the network. It takes inputs,
              multiplies by weights, adds bias, and applies an activation
              function.
            </li>
            <li>
              <b>Layer:</b> A group of neurons working together. Networks have
              input, hidden, and output layers.
            </li>
            <li>
              <b>Forward Propagation:</b> The process of sending inputs through
              the network to get an answer.
            </li>
            <li>
              <b>Loss Function:</b> A way to measure how wrong the network’s
              answer is. Used to help the network get better during training.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

/* Components */

function InputsPanel({
  inputs,
  setInputs,
}: {
  inputs: number[];
  setInputs: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-indigo-900/20 border border-indigo-300/20">
      <h3 className="text-sm font-semibold text-indigo-200 tracking-wide">
        Inputs
      </h3>
      <div className="flex flex-wrap gap-4">
        {inputs.map((v, i) => (
          <label
            key={i}
            className="flex flex-col text-[11px] text-indigo-100/80 items-center gap-1"
          >
            <span>x{i + 1}</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={v}
              onChange={(e) =>
                setInputs((prev) =>
                  prev.map((p, pi) =>
                    pi === i ? parseFloat(e.target.value) : p
                  )
                )
              }
              className="w-28"
            />
            <span className="text-indigo-200 font-mono text-[10px]">
              {v.toFixed(2)}
            </span>
          </label>
        ))}
        <button
          onClick={() => setInputs((prev) => [...prev, 0])}
          className="px-3 py-1 text-[11px] rounded-md bg-indigo-500/20 border border-indigo-400/30 hover:bg-indigo-500/30 transition"
        >
          + Input
        </button>
        {inputs.length > 1 && (
          <button
            onClick={() => setInputs((prev) => prev.slice(0, -1))}
            className="px-3 py-1 text-[11px] rounded-md bg-pink-500/20 border border-pink-400/30 hover:bg-pink-500/30 transition"
          >
            – Remove
          </button>
        )}
      </div>
    </div>
  );
}

function Controls({
  layers,
  setLayers,
  regenerate,
  setWeights,
  setBiases,
  inputs,
}: {
  layers: LayerConfig[];
  setLayers: React.Dispatch<React.SetStateAction<LayerConfig[]>>;
  regenerate: () => void;
  setWeights: React.Dispatch<React.SetStateAction<number[][][]>>;
  setBiases: React.Dispatch<React.SetStateAction<number[][]>>;
  inputs: number[];
}) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-indigo-900/20 border border-indigo-300/20">
      <h3 className="text-sm font-semibold text-indigo-200 tracking-wide">
        Layers
      </h3>
      <div className="flex flex-wrap gap-4 items-start">
        {layers.map((layer, li) => (
          <div
            key={li}
            className="p-3 rounded-lg bg-indigo-800/40 border border-indigo-500/30 flex flex-col gap-2 min-w-[150px]"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wide text-indigo-200">
                L{li + 1}
              </span>
              <button
                onClick={() => {
                  setLayers((prev) => prev.filter((_, i) => i !== li));
                }}
                className="text-[10px] px-2 py-[2px] rounded bg-pink-500/30 hover:bg-pink-500/40 transition"
                aria-label="Remove layer"
              >
                ✕
              </button>
            </div>
            <label className="text-[10px] flex flex-col gap-1 text-indigo-100/80">
              Neurons
              <input
                type="range"
                min={1}
                max={8}
                value={layer.neurons}
                onChange={(e) =>
                  setLayers((prev) =>
                    prev.map((l, i) =>
                      i === li ? { ...l, neurons: parseInt(e.target.value) } : l
                    )
                  )
                }
              />
              <span className="text-indigo-200 font-mono">{layer.neurons}</span>
            </label>
            <label className="text-[10px] flex flex-col gap-1 text-indigo-100/80">
              Activation
              <select
                value={layer.activation}
                onChange={(e) =>
                  setLayers((prev) =>
                    prev.map((l, i) =>
                      i === li
                        ? { ...l, activation: e.target.value as ActivationType }
                        : l
                    )
                  )
                }
                className="bg-indigo-900/60 border border-indigo-500/30 rounded px-2 py-1 text-[11px]"
              >
                <option value="linear">Linear</option>
                <option value="relu">ReLU</option>
                <option value="sigmoid">Sigmoid</option>
              </select>
            </label>
          </div>
        ))}
        <button
          onClick={() =>
            setLayers((prev) => [...prev, { neurons: 3, activation: "relu" }])
          }
          className="h-[110px] px-4 rounded-lg border border-dashed border-indigo-400/40 text-indigo-300/70 hover:text-indigo-200 hover:border-indigo-300/70 flex items-center justify-center text-[11px]"
        >
          + Layer
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={regenerate}
          className="px-4 py-1.5 rounded-md text-[11px] bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/40"
        >
          Randomize Weights
        </button>
        <button
          onClick={() => {
            // Reset weights & biases with current structure
            setWeights(
              layers.map((layer, li) => {
                const prevSize =
                  li === 0 ? inputs.length : layers[li - 1].neurons;
                return Array.from({ length: prevSize }, () =>
                  Array.from({ length: layer.neurons }, () => 0.1)
                );
              })
            );
            setBiases(
              layers.map((layer) =>
                Array.from({ length: layer.neurons }, () => 0)
              )
            );
          }}
          className="px-4 py-1.5 rounded-md text-[11px] bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/40"
        >
          Zero Init
        </button>
      </div>
    </div>
  );
}

function NetworkViz({
  inputs,
  layers,
  forward,
}: {
  inputs: number[];
  layers: LayerConfig[];
  forward: number[][];
}) {
  const totalLayers = [inputs.length, ...layers.map((l) => l.neurons)];
  return (
    <div className="w-full overflow-x-auto p-4 rounded-xl bg-indigo-900/20 border border-indigo-300/20">
      <div className="min-w-[680px] flex gap-8">
        {totalLayers.map((count, layerIndex) => (
          <div key={layerIndex} className="flex flex-col items-center gap-4">
            <span className="text-[10px] uppercase tracking-wide text-indigo-300/70">
              {layerIndex === 0
                ? "Input"
                : layerIndex === totalLayers.length - 1
                ? "Output"
                : `L${layerIndex}`}
            </span>
            {Array.from({ length: count }).map((_, i) => {
              const value = forward[layerIndex]?.[i];
              const bg =
                layerIndex === 0
                  ? "bg-cyan-500/30"
                  : layerIndex === totalLayers.length - 1
                  ? "bg-pink-500/30"
                  : "bg-indigo-500/30";
              return (
                <div
                  key={i}
                  className={`w-16 h-10 ${bg} rounded-md border border-white/20 flex items-center justify-center text-[11px] font-mono`}
                >
                  {value !== undefined ? value.toFixed(2) : "--"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Connections */}
      <svg className="pointer-events-none absolute" />
    </div>
  );
}

function ActivationLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-[11px] text-indigo-100/70">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded bg-indigo-500/60 border border-indigo-300/40" />{" "}
        Hidden Layer Activation Region
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded bg-cyan-500/60 border border-cyan-300/40" />{" "}
        Input Values
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded bg-pink-500/60 border border-pink-300/40" />{" "}
        Output Layer
      </div>
    </div>
  );
}
