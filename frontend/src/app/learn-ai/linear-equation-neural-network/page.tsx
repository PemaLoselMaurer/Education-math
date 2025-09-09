"use client";
import React from "react";
import Link from "next/link";

export default function LinearEquationNeuralNetworkPage() {
  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(59,7,100,0.45),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-transparent/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
          Unit 2: Linear Equation & Neural Network
        </h1>
        <Link
          href="/learn-ai"
          className="text-sm text-cyan-200 hover:underline ml-auto"
        >
          ← Learn AI
        </Link>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-12">
        <section className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-pink-500/10 blur-xl pointer-events-none" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-6 md:px-12 py-10 flex flex-col gap-10 overflow-hidden shadow-lg shadow-cyan-500/5">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-r from-cyan-200 via-indigo-200 to-pink-200 bg-clip-text text-transparent">
              What is a Linear Equation?
            </h2>
            <p className="text-indigo-100/80 text-base max-w-2xl">
              A linear equation is a math rule that makes a straight line when
              you draw it. It looks like{" "}
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
            <div className="mt-4 p-4 rounded-xl bg-cyan-900/10 border border-cyan-400/30 shadow">
              <LinearEquationDemo />
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-900/10 via-cyan-900/10 to-indigo-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-6">
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
          <div className="mt-4 p-4 rounded-xl bg-emerald-900/10 border border-emerald-400/30 shadow">
            <NeuralNetworkVisual />
          </div>
        </section>
        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-900/10 via-indigo-900/10 to-emerald-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-200 to-emerald-200 bg-clip-text text-transparent">
            Neural Networks
          </h2>
          <div className="space-y-4 text-cyan-100/85 text-[15px]">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <p>
                  <b>What is a Neural Network?</b>
                  <br />
                  Neural networks are computer models inspired by the human
                  brain. They use lots of tiny units called <b>neurons</b> that
                  work together to learn patterns and make decisions. Each
                  neuron receives information, does some math, and passes the
                  result to other neurons.
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                {/* Brain-inspired neuron visual */}
                <svg width="120" height="90" viewBox="0 0 120 90">
                  <ellipse
                    cx="60"
                    cy="45"
                    rx="40"
                    ry="30"
                    fill="#a7f3d0"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />
                  <circle
                    cx="60"
                    cy="45"
                    r="12"
                    fill="#38bdf8"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x="60"
                    y="50"
                    textAnchor="middle"
                    fontSize="13"
                    fill="#222"
                  >
                    Neuron
                  </text>
                  <text
                    x="60"
                    y="20"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#38bdf8"
                  >
                    Brain
                  </text>
                  <line
                    x1="60"
                    y1="45"
                    x2="90"
                    y2="20"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <circle cx="90" cy="20" r="5" fill="#fbbf24" />
                  <line
                    x1="60"
                    y1="45"
                    x2="30"
                    y2="20"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <circle cx="30" cy="20" r="5" fill="#fbbf24" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <p>
                  <b>Layers in a Neural Network</b>
                  <br />
                  Neural networks are made of layers:
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <b>Input Layer:</b> Where data enters the network. Each
                    input is a feature, like a number or word.
                  </li>
                  <li>
                    <b>Hidden Layers:</b> These layers do most of the work.
                    Neurons in hidden layers transform the input using math and
                    special rules called activation functions.
                  </li>
                  <li>
                    <b>Output Layer:</b> Gives the final answer, like a
                    prediction or a label.
                  </li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                {/* Layered architecture visual */}
                <svg width="140" height="90" viewBox="0 0 140 90">
                  {/* Input layer */}
                  <circle cx="30" cy="30" r="10" fill="#38bdf8" />
                  <circle cx="30" cy="60" r="10" fill="#38bdf8" />
                  {/* Hidden layer */}
                  <circle cx="70" cy="20" r="10" fill="#a7f3d0" />
                  <circle cx="70" cy="45" r="10" fill="#a7f3d0" />
                  <circle cx="70" cy="70" r="10" fill="#a7f3d0" />
                  {/* Output layer */}
                  <circle cx="110" cy="45" r="10" fill="#fbbf24" />
                  {/* Connections */}
                  <line
                    x1="30"
                    y1="30"
                    x2="70"
                    y2="20"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="30"
                    x2="70"
                    y2="45"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="30"
                    x2="70"
                    y2="70"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="60"
                    x2="70"
                    y2="20"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="60"
                    x2="70"
                    y2="45"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="60"
                    x2="70"
                    y2="70"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Hidden to output */}
                  <line
                    x1="70"
                    y1="20"
                    x2="110"
                    y2="45"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="70"
                    y1="45"
                    x2="110"
                    y2="45"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <line
                    x1="70"
                    y1="70"
                    x2="110"
                    y2="45"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Labels */}
                  <text x="10" y="30" fontSize="11" fill="#38bdf8">
                    Input
                  </text>
                  <text x="50" y="10" fontSize="11" fill="#a7f3d0">
                    Hidden
                  </text>
                  <text x="120" y="45" fontSize="11" fill="#fbbf24">
                    Output
                  </text>
                </svg>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <p>
                  <b>How Do Neural Networks Work?</b>
                  <br />
                  When you give data to a neural network, it passes through all
                  the layers. Each neuron multiplies the input by a{" "}
                  <b>weight</b>, adds a <b>bias</b>, and then uses an{" "}
                  <b>activation function</b> to decide what to send to the next
                  layer. This process is called <b>forward propagation</b>.
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                {/* Forward propagation visual */}
                <svg width="120" height="60" viewBox="0 0 120 60">
                  <circle cx="20" cy="30" r="10" fill="#38bdf8" />
                  <circle cx="60" cy="30" r="10" fill="#a7f3d0" />
                  <circle cx="100" cy="30" r="10" fill="#fbbf24" />
                  <text x="20" y="55" fontSize="11" fill="#38bdf8">
                    Input
                  </text>
                  <text x="60" y="55" fontSize="11" fill="#a7f3d0">
                    Hidden
                  </text>
                  <text x="100" y="55" fontSize="11" fill="#fbbf24">
                    Output
                  </text>
                  <line
                    x1="30"
                    y1="30"
                    x2="50"
                    y2="30"
                    stroke="#fff"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                  />
                  <line
                    x1="70"
                    y1="30"
                    x2="90"
                    y2="30"
                    stroke="#fff"
                    strokeWidth="2"
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
              </div>
            </div>

            <p>
              <b>Learning Process</b>
              <br />
              Neural networks learn by practicing! They make a guess, check if
              it’s right, and if it’s wrong, they change their weights and
              biases to get better next time. This is done using{" "}
              <b>backpropagation</b> and <b>gradient descent</b>—fancy words for
              adjusting the math to improve answers. The network repeats this
              process many times, getting smarter with each try.
            </p>

            <p>
              <b>Types of Neural Networks</b>
              <br />
              There are different types of neural networks for different jobs:
            </p>
            <ul className="list-disc pl-5">
              <li>
                <b>Feedforward Networks:</b> Data moves in one direction, from
                input to output.
              </li>
              <li>
                <b>Convolutional Neural Networks (CNN):</b> Great for pictures
                and images.
              </li>
              <li>
                <b>Recurrent Neural Networks (RNN):</b> Good for sequences, like
                sentences or music.
              </li>
              <li>
                <b>Multilayer Perceptron (MLP):</b> Has more than one hidden
                layer, can solve harder problems.
              </li>
            </ul>

            <p>
              <b>Advantages of Neural Networks</b>
              <br />
            </p>
            <ul className="list-disc pl-5">
              <li>
                Can learn very complex patterns and relationships in data.
              </li>
              <li>Work well with images, sounds, and text.</li>
              <li>Can adapt to new problems and situations.</li>
              <li>Can process lots of data at once (parallel processing).</li>
            </ul>

            <p>
              <b>Challenges of Neural Networks</b>
              <br />
            </p>
            <ul className="list-disc pl-5">
              <li>Need lots of data and computer power to train well.</li>
              <li>
                Can be hard to understand how they make decisions (black box).
              </li>
              <li>Can make mistakes if not trained well (overfitting).</li>
              <li>Need big, labeled datasets for best results.</li>
            </ul>

            <p>
              <b>Applications of Neural Networks</b>
              <br />
              Neural networks are used in many cool things:
            </p>
            <ul className="list-disc pl-5">
              <li>
                <b>Image and Video Recognition:</b> Like facial recognition and
                self-driving cars.
              </li>
              <li>
                <b>Language Understanding:</b> Chatbots, translation, and voice
                assistants.
              </li>
              <li>
                <b>Finance:</b> Predicting stock prices and spotting fraud.
              </li>
              <li>
                <b>Healthcare:</b> Diagnosing diseases and analyzing medical
                images.
              </li>
              <li>
                <b>Gaming:</b> Making smart decisions in video games.
              </li>
            </ul>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <p>
                  <b>Fun Example: Email Spam Sorting</b>
                  <br />
                  Imagine a neural network that sorts emails into “spam” or “not
                  spam.” It looks for words like “free” or “win,” learns which
                  words mean spam by practicing on lots of emails, and gets
                  better at sorting over time!
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                {/* Spam sorting visual */}
                <svg width="120" height="70" viewBox="0 0 120 70">
                  <rect
                    x="10"
                    y="20"
                    width="40"
                    height="30"
                    rx="6"
                    fill="#fbbf24"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x="30"
                    y="40"
                    textAnchor="middle"
                    fontSize="13"
                    fill="#222"
                  >
                    Email
                  </text>
                  <text
                    x="30"
                    y="60"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#fbbf24"
                  >
                    &quot;Free! Win!&quot;
                  </text>
                  <line
                    x1="50"
                    y1="35"
                    x2="90"
                    y2="35"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                  />
                  <rect
                    x="90"
                    y="25"
                    width="20"
                    height="20"
                    rx="5"
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x="100"
                    y="38"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#fff"
                  >
                    Spam
                  </text>
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
                      <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#38bdf8" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            <p className="mt-4 text-[13px] text-cyan-300/90">
              Source:{" "}
              <a
                href="https://www.geeksforgeeks.org/machine-learning/neural-networks-a-beginners-guide/"
                target="_blank"
                rel="noopener"
                className="underline text-cyan-200"
              >
                GeeksforGeeks Neural Networks Guide
              </a>
            </p>
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
  const [points, setPoints] = React.useState([
    { x: -0.8, y: -0.5 },
    { x: -0.4, y: 0.2 },
    { x: 0.2, y: -0.2 },
    { x: 0.7, y: 0.6 },
  ]);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  // For a full 360 graph, use a square area and center axes at (0,0)
  const size = 320;
  const margin = 40;
  const toX = (x: number) => margin + ((x + 1) / 2) * (size - 2 * margin);
  const toY = (y: number) =>
    size - margin - ((y + 1) / 2) * (size - 2 * margin);

  // Drag logic
  function handlePointerDown(idx: number) {
    setDragIdx(idx);
  }
  function handlePointerUp() {
    setDragIdx(null);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (dragIdx === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((e.clientY - rect.top) / rect.height) * 2;
    setPoints((pts) => pts.map((p, i) => (i === dragIdx ? { x, y } : p)));
  }

  // Error calculation
  const errors = points.map((p) => p.y - (m * p.x + b));
  const mse = errors.reduce((sum, e) => sum + e * e, 0) / points.length;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[340px] h-[340px] select-none cursor-pointer bg-black/10 rounded-xl border border-cyan-400/10"
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        {/* Axes: X and Y crossing at center */}
        <line
          x1={margin}
          y1={size / 2}
          x2={size - margin}
          y2={size / 2}
          stroke="#fff6"
          strokeWidth={2}
        />
        <line
          x1={size / 2}
          y1={margin}
          x2={size / 2}
          y2={size - margin}
          stroke="#fff6"
          strokeWidth={2}
        />
        {/* X axis ticks and labels */}
        {[...Array(5)].map((_, i) => {
          const x = -1 + i * 0.5;
          const px = toX(x);
          return (
            <g key={i}>
              <line
                x1={px}
                y1={size / 2 - 6}
                x2={px}
                y2={size / 2 + 6}
                stroke="#fff8"
                strokeWidth={2}
              />
              <text
                x={px}
                y={size / 2 + 22}
                textAnchor="middle"
                fontSize={13}
                fill="#fff8"
              >
                {x}
              </text>
            </g>
          );
        })}
        {/* Y axis ticks and labels */}
        {[...Array(5)].map((_, i) => {
          const y = -1 + i * 0.5;
          const py = toY(y);
          return (
            <g key={i}>
              <line
                x1={size / 2 - 6}
                y1={py}
                x2={size / 2 + 6}
                y2={py}
                stroke="#fff8"
                strokeWidth={2}
              />
              <text
                x={size / 2 - 14}
                y={py + 5}
                textAnchor="end"
                fontSize={13}
                fill="#fff8"
              >
                {y}
              </text>
            </g>
          );
        })}
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
        {/* Points and error lines */}
        {points.map((p, i) => {
          const yOnLine = m * p.x + b;
          return (
            <g key={i}>
              {/* Error line */}
              <line
                x1={toX(p.x)}
                y1={toY(p.y)}
                x2={toX(p.x)}
                y2={toY(yOnLine)}
                stroke="#f87171"
                strokeDasharray="3 2"
                strokeWidth={2}
              />
              {/* Draggable point */}
              <circle
                cx={toX(p.x)}
                cy={toY(p.y)}
                r={10}
                fill="#fbbf24"
                stroke="#fff"
                strokeWidth={2}
                onPointerDown={() => handlePointerDown(i)}
                style={{ cursor: "grab" }}
              />
            </g>
          );
        })}
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
        <div className="text-[14px] text-pink-200 mt-1">
          Mean Squared Error:{" "}
          <span className="text-pink-100">{mse.toFixed(3)}</span>
        </div>
        <div className="text-xs text-cyan-100/80 mt-2 max-w-xs text-center">
          Drag the yellow points to see how the line changes!
          <br />
          Adjust the sliders to change the line. The red dashed lines show the
          error for each point.
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
