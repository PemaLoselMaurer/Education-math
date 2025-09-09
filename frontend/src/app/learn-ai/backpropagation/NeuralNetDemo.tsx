import React from "react";

// Helper for animated neuron box
function NeuronBox({
  label,
  value,
  min,
  max,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
}) {
  // Normalize value to 0-1
  const percent = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <div className="flex flex-col items-center mx-2">
      <div className="relative w-14 h-20 bg-yellow-950/40 border-2 border-yellow-400 rounded-lg overflow-hidden flex items-end">
        <div
          className="absolute left-0 bottom-0 w-full transition-all duration-500"
          style={{
            height: `${percent * 100}%`,
            background: color,
            opacity: 0.8,
          }}
        />
        <div className="absolute w-full h-full flex items-center justify-center text-yellow-100 font-bold text-lg select-none">
          {value.toFixed(2)}
        </div>
      </div>
      <span className="text-xs text-yellow-200 mt-1">{label}</span>
    </div>
  );
}

// Simple neural network: x -> h -> y (1 hidden neuron)
export default function NeuralNetDemo() {
  // State for input, target, weights, and bias
  const initialState = {
    x: 1,
    target: 1,
    w: 0.5,
    b: 0.0,
    v: 1.0,
    by: 0.0,
    learningRate: 0.1,
  };
  const [x, setX] = React.useState(initialState.x);
  const [target, setTarget] = React.useState(initialState.target);
  const [w, setW] = React.useState(initialState.w);
  const [b, setB] = React.useState(initialState.b);
  const [v, setV] = React.useState(initialState.v);
  const [by, setBy] = React.useState(initialState.by);
  const [learningRate, setLearningRate] = React.useState(
    initialState.learningRate
  );

  function resetAll() {
    setX(initialState.x);
    setTarget(initialState.target);
    setW(initialState.w);
    setB(initialState.b);
    setV(initialState.v);
    setBy(initialState.by);
    setLearningRate(initialState.learningRate);
  }

  // Forward pass
  const h = w * x + b;
  const y = v * h + by;
  const error = target - y;

  // Error terms (δ) for each unit (linear activation)
  // Output unit: δ_output = dL/dy = -2 * error
  const delta_output = -2 * error;
  // Hidden unit: δ_hidden = dL/dh = dL/dy * v (chain rule)
  const delta_hidden = delta_output * v;

  // Backpropagation (manual, linear activations)
  function stepBackprop() {
    // dL/dy = -2 * error
    const dL_dy = -2 * error;
    // Output layer gradients
    const dL_dv = dL_dy * h;
    const dL_dby = dL_dy * 1;
    // Hidden layer gradients
    const dL_dh = dL_dy * v;
    const dL_dw = dL_dh * x;
    const dL_db = dL_dh * 1;
    // Update weights
    setV(v - learningRate * dL_dv);
    setBy(by - learningRate * dL_dby);
    setW(w - learningRate * dL_dw);
    setB(b - learningRate * dL_db);
  }

  return (
    <>
      <div className="flex flex-col gap-4 bg-yellow-900/10 p-4 rounded-xl border border-yellow-400/20 max-w-xl mx-auto">
        <div className="text-lg font-bold text-yellow-200 mb-1">
          Animated Neural Network!
        </div>
        <div className="text-yellow-100 text-sm mb-2">
          See how the robot&apos;s brain works. The boxes fill up as the numbers
          change!
        </div>
        {/* Neuron diagram */}
        <div className="flex flex-row items-center justify-center gap-8 my-4">
          <NeuronBox label="Input" value={x} min={-2} max={2} color="#fde047" />
          <svg width="60" height="40" className="mx-1">
            <line
              x1="0"
              y1="20"
              x2="60"
              y2="20"
              stroke="#fde047"
              strokeWidth="3"
              markerEnd="url(#arrow)"
            />
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#fde047" />
              </marker>
            </defs>
          </svg>
          <div className="flex flex-col items-center">
            <NeuronBox
              label="Hidden"
              value={h}
              min={-4}
              max={4}
              color="#facc15"
            />
            <span className="text-xs text-yellow-300 mt-1">
              δ<sub>hidden</sub> = {delta_hidden.toFixed(2)}
            </span>
          </div>
          <svg width="60" height="40" className="mx-1">
            <line
              x1="0"
              y1="20"
              x2="60"
              y2="20"
              stroke="#fde047"
              strokeWidth="3"
              markerEnd="url(#arrow2)"
            />
            <defs>
              <marker
                id="arrow2"
                markerWidth="8"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#fde047" />
              </marker>
            </defs>
          </svg>
          <div className="flex flex-col items-center">
            <NeuronBox
              label="Output"
              value={y}
              min={-4}
              max={4}
              color="#fbbf24"
            />
            <span className="text-xs text-yellow-300 mt-1">
              δ<sub>output</sub> = {delta_output.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <label className="flex flex-col text-xs text-yellow-100/80 items-center gap-1">
            <span>Input (x)</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={x}
              onChange={(e) => setX(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-yellow-200 font-mono text-xs">
              {x.toFixed(2)}
            </span>
          </label>
          <label className="flex flex-col text-xs text-yellow-100/80 items-center gap-1">
            <span>Target (goal)</span>
            <input
              type="range"
              min={-4}
              max={4}
              step={0.01}
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-yellow-200 font-mono text-xs">
              {target.toFixed(2)}
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <label className="flex flex-col text-xs text-yellow-100/80 items-center gap-1">
            <span>Wire 1 (x→h)</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={w}
              onChange={(e) => setW(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-yellow-200 font-mono text-xs">
              {w.toFixed(2)}
            </span>
          </label>
          <label className="flex flex-col text-xs text-yellow-100/80 items-center gap-1">
            <span>Hidden bias</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={b}
              onChange={(e) => setB(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-yellow-200 font-mono text-xs">
              {b.toFixed(2)}
            </span>
          </label>
          <label className="flex flex-col text-xs text-yellow-100/80 items-center gap-1">
            <span>Wire 2 (h→y)</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={v}
              onChange={(e) => setV(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-yellow-200 font-mono text-xs">
              {v.toFixed(2)}
            </span>
          </label>
          <label className="flex flex-col text-xs text-yellow-100/80 items-center gap-1">
            <span>Output bias</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={by}
              onChange={(e) => setBy(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-yellow-200 font-mono text-xs">
              {by.toFixed(2)}
            </span>
          </label>
        </div>
        {/* Learning rate buttons and reset */}
        <div className="flex flex-wrap gap-3 items-center justify-center mt-2">
          <span className="text-xs text-yellow-100/80">Learning rate (η):</span>
          <button
            className={`px-2 py-1 rounded text-xs font-bold border border-yellow-400/40 bg-yellow-500/20 hover:bg-yellow-500/40 transition ${
              learningRate === 0.01 ? "ring-2 ring-yellow-300" : ""
            }`}
            onClick={() => setLearningRate(0.01)}
            aria-label="Set learning rate to 0.01"
          >
            0.01
          </button>
          <button
            className={`px-2 py-1 rounded text-xs font-bold border border-yellow-400/40 bg-yellow-500/30 hover:bg-yellow-500/50 transition ${
              learningRate === 0.1 ? "ring-2 ring-yellow-300" : ""
            }`}
            onClick={() => setLearningRate(0.1)}
            aria-label="Set learning rate to 0.1"
          >
            0.1
          </button>
          <button
            className={`px-2 py-1 rounded text-xs font-bold border border-yellow-400/40 bg-yellow-500/50 hover:bg-yellow-500/70 transition ${
              learningRate === 0.5 ? "ring-2 ring-yellow-300" : ""
            }`}
            onClick={() => setLearningRate(0.5)}
            aria-label="Set learning rate to 0.5"
          >
            0.5
          </button>
          <span className="text-[10px] font-mono text-yellow-300 ml-1">
            current: {learningRate}
          </span>
          <button
            className="ml-4 px-3 py-1 rounded text-xs font-bold border border-yellow-400/60 bg-yellow-700/40 hover:bg-yellow-700/70 text-yellow-100 transition"
            onClick={resetAll}
          >
            Reset
          </button>
        </div>
        <button
          onClick={stepBackprop}
          className="px-4 py-2 rounded-md text-sm bg-yellow-500/40 hover:bg-yellow-500/60 border border-yellow-400/40 mt-2 font-bold text-yellow-900"
        >
          Let the robot learn!
        </button>
        <div className="flex flex-col gap-1 mt-2 text-sm text-yellow-100/90">
          <div>
            Hidden value:{" "}
            <span className="font-mono text-yellow-200">{h.toFixed(3)}</span>
          </div>
          <div>
            Output:{" "}
            <span className="font-mono text-yellow-200">{y.toFixed(3)}</span>
          </div>
          <div>
            Mistake:{" "}
            <span className="font-mono text-yellow-200">
              {error.toFixed(3)}
            </span>
          </div>
        </div>
        <div className="text-xs text-yellow-300 mt-2">
          Press <b>Let the robot learn!</b> to make the robot try to fix its
          mistake.
        </div>
      </div>
      {/* Feature explanations OUTSIDE the main container */}
      <div className="mt-6 bg-yellow-900/20 rounded-lg p-4 text-yellow-100 text-sm flex flex-col gap-2 max-w-xl mx-auto">
        <div>
          <b>Input (x):</b> The number you give to the robot. It goes into the
          first box.
        </div>
        <div>
          <b>Target (goal):</b> The answer you want the robot to get. The robot
          tries to match this.
        </div>
        <div>
          <b>Wire 1 (x→h):</b> Controls how much the input affects the hidden
          box.
        </div>
        <div>
          <b>Hidden bias:</b> A secret number the hidden box adds to its total.
        </div>
        <div>
          <b>Wire 2 (h→y):</b> Controls how much the hidden box affects the
          output box.
        </div>
        <div>
          <b>Output bias:</b> A secret number the output box adds to its total.
        </div>
        <div>
          <b>Learning rate (η):</b> How fast the robot learns. Bigger means
          faster, but can be wild!
        </div>
        <div>
          <b>δ (delta):</b> The robot&apos;s mistake for each box. The robot
          uses this to fix itself.
        </div>
      </div>
    </>
  );
}
