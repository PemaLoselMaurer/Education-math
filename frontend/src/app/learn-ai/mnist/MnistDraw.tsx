"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";

/*
  MnistDraw: Freehand 28x28 digit drawing with real-time inference using exported PyTorch MLP weights.
  - Loads weights JSON (mnist_mlp.json) that contains 3 Linear layers.
  - Normalizes input using mean/std from export.
  - Performs pure JS forward pass.
*/

interface Layer {
  W: number[][];
  b: number[];
}
interface ModelPayload {
  architecture: string;
  input_size: number;
  layers: Layer[];
  normalization: { mean: number; std: number };
}

function relu(x: number) {
  return x > 0 ? x : 0;
}
function softmax(arr: number[]) {
  const m = Math.max(...arr);
  const ex = arr.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

const SIZE = 280; // canvas size in px (10x scale of 28)
const GRID = 28; // MNIST resolution

const MnistDraw: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDown, setIsDown] = useState(false);
  const [model, setModel] = useState<ModelPayload | null>(null);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [raw, setRaw] = useState<number[]>(Array(GRID * GRID).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/mnist_mlp.json")
      .then((r) => r.json())
      .then((j: ModelPayload) => {
        setModel(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const drawStroke = useCallback((cx: number, cy: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    const r = 8; // brush radius
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const pointer = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (isDown) drawStroke(x, y);
    if (isDown) updateArray();
  };
  const pointerDown = (e: React.PointerEvent) => {
    setIsDown(true);
    pointer(e);
  };
  const pointerUp = () => setIsDown(false);
  useEffect(() => {
    window.addEventListener("pointerup", pointerUp);
    return () => window.removeEventListener("pointerup", pointerUp);
  }, []);

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    setRaw(Array(GRID * GRID).fill(0));
    setProbs(null);
  };

  const updateArray = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const scale = SIZE / GRID;
    const arr: number[] = [];
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        let sum = 0,
          count = 0;
        const sx = Math.floor(gx * scale),
          sy = Math.floor(gy * scale);
        for (let y = 0; y < scale; y += 2) {
          for (let x = 0; x < scale; x += 2) {
            const px = ((sy + y) * SIZE + (sx + x)) * 4;
            sum += img.data[px];
            count++;
          }
        }
        arr.push(sum / (count * 255));
      }
    }
    setRaw(arr);
  };

  // Run inference whenever raw changes (debounced small delay)
  useEffect(() => {
    if (!model) return;
    if (!raw.some((v) => v > 0.02)) {
      setProbs(null);
      return;
    }
    const t = setTimeout(() => {
      // normalize (single channel): (x-mean)/std; export stored mean/std for data already scaled 0..1
      const mean = model.normalization.mean;
      const std = model.normalization.std;
      const norm = raw.map((v) => (v - mean) / std);
      const [L1, L2, L3] = model.layers;
      const h1 = L1.W.map((row, i) => {
        return row.reduce((a, w, j) => a + w * norm[j], L1.b[i]);
      }).map(relu);
      const h2 = L2.W.map((row, i) =>
        row.reduce((a, w, j) => a + w * h1[j], L2.b[i])
      ).map(relu);
      const logits = L3.W.map((row, i) =>
        row.reduce((a, w, j) => a + w * h2[j], L3.b[i])
      );
      setProbs(softmax(logits));
    }, 60);
    return () => clearTimeout(t);
  }, [raw, model]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-cyan-200 font-semibold text-sm">
          MNIST Live Digit Classifier
        </h2>
        <button
          onClick={clear}
          className="px-3 py-1 text-[11px] rounded-full bg-white/10 hover:bg-white/15 border border-white/15"
        >
          Clear
        </button>
        {loading && (
          <span className="text-[10px] text-indigo-300/70">
            Loading weights…
          </span>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center select-none">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onPointerDown={pointerDown}
            onPointerMove={pointer}
            className="bg-black rounded border border-white/10 touch-none cursor-crosshair"
          />
          <div className="mt-2 text-[10px] text-indigo-200/70">
            Draw a digit (0-9). Brush=white on black.
          </div>
        </div>
        <div className="flex-1 min-w-[220px]">
          {probs ? (
            <div className="grid grid-cols-5 gap-2 text-[11px]">
              {probs.map((p, i) => {
                const max = Math.max(...probs);
                const hi = p === max;
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border ${
                      hi
                        ? "border-cyan-400/50 bg-cyan-400/20"
                        : "border-white/10 bg-white/5"
                    } flex flex-col items-center`}
                  >
                    <span className="text-sm font-semibold">{i}</span>
                    <div className="w-full h-2 bg-white/10 rounded overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-400 to-cyan-400"
                        style={{ width: `${(p * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="mt-1 text-[10px] text-indigo-100/80">
                      {(p * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-indigo-300/70">
              Draw to see predictions.
            </div>
          )}
        </div>
      </div>
      {model && (
        <div className="text-[10px] text-indigo-300/60">
          Arch {model.architecture} • mean={model.normalization.mean} std=
          {model.normalization.std}
        </div>
      )}
    </div>
  );
};

export default MnistDraw;
