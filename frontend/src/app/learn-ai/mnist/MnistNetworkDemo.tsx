"use client";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

/*
  MnistNetworkDemo
  Real-time MNIST digit classifier with LIVE weight + activation visualization.
  - Draw digit (white on black) 280x280 -> downsample to 28x28 vector (784)
  - Load exported PyTorch MLP weights (784-256-128-10)
  - Forward pass in JS each stroke
  - Visualize pooled input (14x14) -> subset of Hidden1 (12 neurons) -> subset of Hidden2 (10 neurons) -> Outputs (10 digits)
  - Lines show sign (cyan positive / pink negative) & |weight| thickness.
  - Node fill intensity = activation normalized per layer.
  - Toggles: weights, activations, raw probability bars.
  NOTE: Only a subset of neurons drawn to keep performance.
*/
interface Layer {
  W: number[][];
  b: number[];
}
interface ModelPayload {
  layers: Layer[];
  normalization: { mean: number; std: number };
  architecture: string;
  input_size: number;
}

const CANVAS_SIZE = 280; // px
const GRID = 28; // MNIST dimension
const POOLED = 14; // display pooling (2x2 average)
const H1_SHOW = 12; // subset of first hidden layer to visualize (max)
const H2_SHOW = 10; // subset of second hidden layer to visualize (max)
const DIAGRAM_HEIGHT = 430; // moderate height (between previous large and tight)

function relu(x: number) {
  return x > 0 ? x : 0;
}
function softmax(a: number[]) {
  const m = Math.max(...a);
  const ex = a.map((v) => Math.exp(v - m));
  const s = ex.reduce((p, c) => p + c, 0);
  return ex.map((e) => e / s);
}
function safeWidth(weight: number, max: number, base: number, scale: number) {
  if (!isFinite(weight)) weight = 0;
  if (!isFinite(max) || max <= 1e-12) max = 1e-6;
  const w = base + (Math.abs(weight) / max) * scale;
  return isFinite(w) ? w : base;
}

const MnistNetworkDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawRef = useRef<Float32Array>(new Float32Array(GRID * GRID)); // fast mutable buffer
  const [isDown, setIsDown] = useState(false);
  const [raw, setRaw] = useState<number[]>(Array(GRID * GRID).fill(0));
  const [model, setModel] = useState<ModelPayload | null>(null);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [h1, setH1] = useState<number[] | null>(null);
  const [h2, setH2] = useState<number[] | null>(null);
  const [c1, setC1] = useState<number[] | null>(null); // contributions of hidden1 neurons to predicted output
  const [c2, setC2] = useState<number[] | null>(null); // contributions of hidden2 neurons to predicted output
  const [showWeights, setShowWeights] = useState(true);
  const [showActs, setShowActs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [classic, setClassic] = useState(true); // classic diagram style like shapes screenshot
  const [centerScale, setCenterScale] = useState(true); // MNIST-like preprocess (crop, scale to 20x20, center)
  const [weightMode, setWeightMode] = useState<"sparse" | "medium" | "full">(
    "sparse"
  ); // control number of weight lines
  // ReLU line filtering always enabled automatically (removed user toggle)
  const reluLines = true; // apply ReLU to contribution (activation*weight) so negatives vanish
  const [hover, setHover] = useState<{
    layer: "h1" | "h2" | "out" | null;
    index: number | null;
  }>({ layer: null, index: null });
  const [lineHover, setLineHover] = useState<string | null>(null); // id of currently hovered line
  const isOutputHover = hover.layer === "out" && hover.index != null;
  const reloadWeights = () => {
    setLoading(true);
    fetch("/mnist_mlp.json?cacheBust=" + Date.now())
      .then((r) => r.json())
      .then((j: ModelPayload) => {
        setModel(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/mnist_mlp.json")
      .then((r) => r.json())
      .then((j: ModelPayload) => {
        setModel(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setRaw(Array(GRID * GRID).fill(0));
    setProbs(null);
    setH1(null);
    setH2(null);
  };

  const BRUSH = 12; // px radius on canvas
  const drawDot = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    // Update 28x28 buffer directly (avoid costly getImageData)
    const scale = CANVAS_SIZE / GRID; // size of one cell in pixels
    const minCol = Math.max(0, Math.floor((x - BRUSH) / scale));
    const maxCol = Math.min(GRID - 1, Math.floor((x + BRUSH) / scale));
    const minRow = Math.max(0, Math.floor((y - BRUSH) / scale));
    const maxRow = Math.min(GRID - 1, Math.floor((y + BRUSH) / scale));
    const brushSq = BRUSH * BRUSH;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cx = c * scale + scale / 2;
        const cy = r * scale + scale / 2;
        const dx = cx - x;
        const dy = cy - y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= brushSq) {
          // simple radial falloff
          const v = 1 - d2 / brushSq; // 0..1
          const idx = r * GRID + c;
          if (v > rawRef.current[idx]) rawRef.current[idx] = v;
        }
      }
    }
  };

  // removed lastUpdateRef (no longer needed with RAF loop)
  const dirtyRef = useRef(false);
  const lastInferRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMove = (e: React.PointerEvent) => {
    if (!isDown) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    // Use coalesced events (gives many sub-points for smooth line if supported)
    const nativeEvt = e.nativeEvent as unknown as PointerEvent & {
      getCoalescedEvents?: () => PointerEvent[];
    };
    const evts: PointerEvent[] = nativeEvt.getCoalescedEvents
      ? nativeEvt.getCoalescedEvents()
      : [nativeEvt];
    for (const ev of evts) {
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const last = lastPointRef.current;
      if (last) {
        // interpolate along segment at fixed step for smooth stroke
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = 4; // px spacing for interpolation
        if (dist > 0) {
          const steps = Math.min(64, Math.ceil(dist / step));
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            drawDot(last.x + dx * t, last.y + dy * t);
          }
        } else {
          drawDot(x, y);
        }
      } else {
        drawDot(x, y);
      }
      lastPointRef.current = { x, y };
    }
    dirtyRef.current = true;
  };
  const pointerDown = (e: React.PointerEvent) => {
    setIsDown(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = { x, y };
    drawDot(x, y);
    dirtyRef.current = true;
  };
  const up = () => setIsDown(false);
  useEffect(() => {
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const runInference = useCallback(() => {
    if (!model) {
      setProbs(null);
      return;
    }
    const src = rawRef.current;
    // 1. Simple blur for smoothing
    const blur = new Float32Array(GRID * GRID);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        let acc = 0,
          cnt = 0;
        for (let yy = -1; yy <= 1; yy++)
          for (let xx = -1; xx <= 1; xx++) {
            const nx = x + xx,
              ny = y + yy;
            if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
            acc += src[ny * GRID + nx];
            cnt++;
          }
        blur[y * GRID + x] = acc / cnt;
      }
    let work: Float32Array = blur;
    // 2. MNIST-style crop & scale to 20x20 then center if enabled
    if (centerScale) {
      // bounding box
      let minX = GRID,
        minY = GRID,
        maxX = -1,
        maxY = -1;
      const thresh = 0.15; // dynamic threshold
      for (let y = 0; y < GRID; y++)
        for (let x = 0; x < GRID; x++) {
          const v = work[y * GRID + x];
          if (v > thresh) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      if (maxX >= minX && maxY >= minY) {
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        const scale = 20 / Math.max(bw, bh);
        const newW = Math.max(1, Math.round(bw * scale));
        const newH = Math.max(1, Math.round(bh * scale));
        const dx = (28 - newW) >> 1;
        const dy = (28 - newH) >> 1; // center
        const dest = new Float32Array(GRID * GRID);
        for (let y = 0; y < newH; y++)
          for (let x = 0; x < newW; x++) {
            const sx = minX + (x + 0.5) / scale - 0.5;
            const sy = minY + (y + 0.5) / scale - 0.5;
            const ix = Math.min(maxX, Math.max(minX, Math.round(sx)));
            const iy = Math.min(maxY, Math.max(minY, Math.round(sy)));
            dest[(y + dy) * GRID + (x + dx)] = work[iy * GRID + ix];
          }
        work = dest;
      }
    }
    // 3. Normalize intensities (scale max to 1)
    let maxVal = 0;
    for (let i = 0; i < work.length; i++)
      if (work[i] > maxVal) maxVal = work[i];
    if (maxVal > 0) {
      for (let i = 0; i < work.length; i++) work[i] /= maxVal;
    }
    const vec = Array.from(work);
    setRaw(vec); // update visualization grid & pooled view
    if (!vec.some((v) => v > 0.02)) {
      setProbs(null);
      setH1(null);
      setH2(null);
      return;
    }
    const mean = model.normalization.mean,
      std = model.normalization.std;
    const norm = vec.map((v) => (v - mean) / std);
    const [L1, L2, L3] = model.layers;
    const z1 = L1.W.map((row, i) =>
      row.reduce((a, w, j) => a + w * norm[j], L1.b[i])
    );
    const a1 = z1.map(relu);
    const z2 = L2.W.map((row, i) =>
      row.reduce((a, w, j) => a + w * a1[j], L2.b[i])
    );
    const a2 = z2.map(relu);
    const logits = L3.W.map((row, i) =>
      row.reduce((a, w, j) => a + w * a2[j], L3.b[i])
    );
    const probsLocal = softmax(logits);
    setH1(a1.slice(0, H1_SHOW));
    setH2(a2.slice(0, H2_SHOW));
    setProbs(probsLocal);
    // compute contributions for classic diagram fill animation
    const predIdx = probsLocal.indexOf(Math.max(...probsLocal));
    if (predIdx >= 0) {
      // Hidden2 contributions: activation * weight to predicted output
      const h2ContribFull = a2.map((act, j) => act * L3.W[predIdx][j]);
      setC2(h2ContribFull.slice(0, H2_SHOW));
      // Hidden1 contributions: activation * effective weight (sum over hidden2 path)
      const h2CountEff = Math.min(L2.W.length, h2ContribFull.length);
      const effWeightsH1: number[] = new Array(a1.length).fill(0);
      for (let h2i = 0; h2i < h2CountEff; h2i++) {
        const wOut = L3.W[predIdx][h2i];
        const wRow = L2.W[h2i];
        for (let h1i = 0; h1i < a1.length; h1i++)
          effWeightsH1[h1i] += wOut * wRow[h1i];
      }
      const h1ContribFull = effWeightsH1.map((wEff, i) => wEff * a1[i]);
      setC1(h1ContribFull.slice(0, H1_SHOW));
    } else {
      setC1(null);
      setC2(null);
    }
  }, [model, centerScale]);

  // Utility to get top-K indices by absolute magnitude
  const topK = useCallback((arr: number[], k: number): Set<number> => {
    if (k === Infinity) return new Set(arr.map((_, i) => i));
    // partial select: simple sort acceptable due to small sizes (<200)
    return new Set(
      arr
        .map((v, i) => ({ i, a: Math.abs(v) }))
        .sort((x, y) => y.a - x.a)
        .slice(0, Math.min(k, arr.length))
        .map((o) => o.i)
    );
  }, []);

  const modeConfig = useMemo(() => {
    switch (weightMode) {
      case "sparse":
        return { inTop: 12, h1h2Top: 4, h2outTop: 4 };
      case "medium":
        return { inTop: 30, h1h2Top: 8, h2outTop: 8 };
      default:
        return { inTop: Infinity, h1h2Top: Infinity, h2outTop: Infinity };
    }
  }, [weightMode]);

  // RAF loop for smoother drawing & inference ~30fps using direct buffer
  useEffect(() => {
    let frame: number;
    const interval = 100; // 0.1s delay between inference updates
    const loop = () => {
      const now = performance.now();
      if (dirtyRef.current && now - lastInferRef.current > interval) {
        lastInferRef.current = now;
        dirtyRef.current = false;
        runInference();
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [runInference]);

  // Derived pooled display input (14x14)
  const pooled = useMemo(() => {
    if (!raw.some((v) => v > 0)) return Array(POOLED * POOLED).fill(0);
    const out: number[] = [];
    for (let y = 0; y < POOLED; y++) {
      for (let x = 0; x < POOLED; x++) {
        let sum = 0;
        let count = 0;
        for (let yy = 0; yy < 2; yy++)
          for (let xx = 0; xx < 2; xx++) {
            const iy = y * 2 + yy;
            const ix = x * 2 + xx;
            const v = raw[iy * GRID + ix];
            sum += v;
            count++;
          }
        out.push(sum / count);
      }
    }
    return out;
  }, [raw]);

  // Precompute weight stats for subsets
  const weightMeta = useMemo(() => {
    if (!model) return null;
    const L1 = model.layers[0]; // input->hidden1
    const L2 = model.layers[1]; // hidden1->hidden2
    const h1Count = Math.min(H1_SHOW, L1.W.length);
    const h2Count = Math.min(H2_SHOW, L2.W.length);
    // Build pooled weights for each shown hidden1 neuron (aggregate 2x2 blocks)
    const layer1WeightsPooled: number[][] = [];
    let maxAbsIn = 1e-6;
    for (let i = 0; i < h1Count; i++) {
      const row = L1.W[i]; // length 784
      const pooledRow: number[] = [];
      for (let py = 0; py < POOLED; py++) {
        for (let px = 0; px < POOLED; px++) {
          let sum = 0;
          let cnt = 0;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const ix = px * 2 + dx;
              const iy = py * 2 + dy;
              const idx = iy * GRID + ix;
              const w = row[idx];
              sum += w;
              cnt++;
            }
          }
          const avg = cnt ? sum / cnt : 0;
          pooledRow.push(avg);
          const a = Math.abs(avg);
          if (a > maxAbsIn) maxAbsIn = a;
        }
      }
      layer1WeightsPooled.push(pooledRow);
    }
    // Max abs across hidden1->hidden2 subset
    let maxAbsH1H2 = 1e-6;
    for (let j = 0; j < h2Count; j++) {
      const row = L2.W[j];
      for (let i = 0; i < h1Count; i++) {
        const a = Math.abs(row[i]);
        if (a > maxAbsH1H2) maxAbsH1H2 = a;
      }
    }
    return { layer1WeightsPooled, maxAbsIn, maxAbsH1H2, L2, h1Count, h2Count };
  }, [model]);

  // When hovering an output digit, compute upstream important hidden2 and hidden1 neurons for path visualization
  const hoverPath = useMemo(() => {
    if (!isOutputHover || !model || !h1 || !h2 || hover.index == null)
      return null;
    const outIdx = hover.index;
    const L2 = model.layers[1].W; // hidden2 x hidden1
    const L3 = model.layers[2].W; // output x hidden2
    const h2Count = Math.min(h2.length, H2_SHOW);
    const h1Count = Math.min(h1.length, H1_SHOW);
    const row = L3[outIdx];
    if (!row) return null;
    const contribH2 = row.slice(0, h2Count).map((w, i) => w * (h2[i] || 0));
    const keepH2 = new Set(
      contribH2
        .map((v, i) => ({ v: Math.abs(v), i }))
        .sort((a, b) => b.v - a.v)
        .slice(0, Math.min(6, h2Count))
        .map((o) => o.i)
    );
    const keepH1 = new Set<number>();
    keepH2.forEach((h2i) => {
      const wRow = L2[h2i];
      if (!wRow) return;
      const contribH1 = wRow.slice(0, h1Count).map((w, i) => w * (h1[i] || 0));
      contribH1
        .map((v, i) => ({ v: Math.abs(v), i }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 3)
        .forEach((o) => keepH1.add(o.i));
    });
    return { keepH2, keepH1 };
  }, [isOutputHover, model, h1, h2, hover.index]);

  const handlePointerUp = useCallback(() => {
    lastPointRef.current = null;
    dirtyRef.current = true;
  }, []);
  // Attach pointerup listener once
  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerUp]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3 flex-nowrap h-16 overflow-hidden">
        <h2 className="text-sm font-semibold text-cyan-200">
          MNIST Network (Real Weights)
        </h2>
        <button
          onClick={() => {
            rawRef.current.fill(0);
            clear();
          }}
          className="px-3 py-1 rounded-full text-[11px] bg-white/10 hover:bg-white/15 border border-white/15"
        >
          Clear
        </button>
        <button
          onClick={reloadWeights}
          className="px-3 py-1 rounded-full text-[11px] bg-white/10 hover:bg-white/15 border border-white/15"
        >
          Reload Weights
        </button>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={showWeights}
            onChange={(e) => setShowWeights(e.target.checked)}
          />{" "}
          Weights
        </label>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer select-none">
          {/* ReLU Lines toggle removed; feature always active */}
        </label>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={showActs}
            onChange={(e) => setShowActs(e.target.checked)}
          />{" "}
          Activations
        </label>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={centerScale}
            onChange={(e) => setCenterScale(e.target.checked)}
          />{" "}
          Center & Scale
        </label>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-indigo-300/70">Weights:</span>
          <select
            value={weightMode}
            onChange={(e) =>
              setWeightMode(e.target.value as "sparse" | "medium" | "full")
            }
            className="bg-white/10 border border-white/15 rounded px-2 py-[2px] text-[11px] outline-none hover:bg-white/15"
          >
            <option value="sparse">Sparse</option>
            <option value="medium">Medium</option>
            <option value="full">Full</option>
          </select>
        </div>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={classic}
            onChange={(e) => setClassic(e.target.checked)}
          />{" "}
          Classic Diagram
        </label>
        {loading && (
          <span className="text-[10px] text-indigo-300/70">Loading model…</span>
        )}
        <div className="ml-auto">
          {probs ? (
            (() => {
              const m = Math.max(...probs!);
              const idx = probs!.indexOf(m);
              return (
                <div className="flex items-baseline gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10 w-[150px] justify-center">
                  <span className="text-[10px] uppercase tracking-wide text-indigo-200/80">
                    {idx}
                  </span>
                  <span className="text-[11px] text-pink-200/80">
                    {(m * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-center bg-white/5 px-3 py-1 rounded-lg border border-white/10 w-[150px] h-[46px] opacity-40 text-[10px] text-indigo-200/40">
              Waiting...
            </div>
          )}
        </div>
      </div>
      <div
        className="flex flex-col lg:flex-row gap-8 items-start"
        style={{ minHeight: DIAGRAM_HEIGHT + 1 }}
      >
        {/* Canvas */}
        <div className="flex flex-col items-center select-none">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            className="bg-black rounded-lg border border-white/10 cursor-crosshair touch-none"
          />
          <div className="mt-2 text-[10px] text-indigo-300/70">
            Draw a digit (white on black).
          </div>
        </div>
        {/* Network Visualization */}
        {!classic && (
          <div
            className="flex-1 min-w-[420px] overflow-x-auto"
            style={{ height: DIAGRAM_HEIGHT }}
          >
            <svg
              width={900}
              height={DIAGRAM_HEIGHT}
              viewBox={`0 0 900 ${DIAGRAM_HEIGHT}`}
              className="max-w-full h-auto"
            >
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="3"
                    floodColor="#f0f9ff"
                    floodOpacity="0.8"
                  />
                </filter>
              </defs>
              {/* Input pooled grid (14x14) */}
              {pooled.map((v, i) => {
                const col = i % POOLED;
                const row = Math.floor(i / POOLED);
                const x = 10 + col * 14;
                const y = 10 + row * 14;
                const intensity = v; // already 0..1 approx
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={12}
                    height={12}
                    fill={`rgba(255,255,255,${intensity})`}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={0.5}
                  />
                );
              })}
              {/* Hidden layer 1 nodes */}
              {h1 &&
                (() => {
                  const maxAbsC1 = c1
                    ? Math.max(1e-6, ...c1.map((v) => Math.abs(v)))
                    : 1;
                  return h1.map((a, i) => {
                    const usedCount = h1.length;
                    const x = 300;
                    const y = 40 + i * (380 / Math.max(1, usedCount - 1));
                    const intensity = showActs ? a / (Math.max(...h1) || 1) : 0;
                    const contrib = c1 ? c1[i] || 0 : 0;
                    const frac = Math.min(1, Math.abs(contrib) / maxAbsC1);
                    const r = 14;
                    const arcR = r + 4;
                    const circ = 2 * Math.PI * arcR;
                    const dash = frac * circ;
                    const arcColor = contrib >= 0 ? "#34d399" : "#f472b6";
                    return (
                      <g
                        key={`h1-${i}`}
                        onMouseEnter={() => setHover({ layer: "h1", index: i })}
                        onMouseLeave={() =>
                          setHover({ layer: null, index: null })
                        }
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={r}
                          fill={`rgba(99,102,241,${0.15 + intensity * 0.85})`}
                          stroke="#6366f1"
                          strokeWidth={1.6}
                        />
                        {c1 && (
                          <circle
                            cx={x}
                            cy={y}
                            r={arcR}
                            fill="none"
                            stroke={arcColor}
                            strokeWidth={3}
                            strokeDasharray={`${dash} ${circ}`}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${x} ${y})`}
                            style={{
                              transition: "stroke-dasharray 0.3s, stroke 0.3s",
                            }}
                            opacity={0.9}
                          />
                        )}
                      </g>
                    );
                  });
                })()}
              {/* Hidden layer 2 nodes */}
              {h2 &&
                (() => {
                  const used = h2.slice(0, H2_SHOW);
                  const maxAbsC2 = c2
                    ? Math.max(
                        1e-6,
                        ...used.map((_, i) => Math.abs(c2[i] || 0))
                      )
                    : 1;
                  return used.map((a, i) => {
                    const usedCount = used.length;
                    const x = 520;
                    const y = 40 + i * (380 / Math.max(1, usedCount - 1));
                    const intensity = showActs
                      ? a / (Math.max(...used) || 1)
                      : 0;
                    const contrib = c2 ? c2[i] || 0 : 0;
                    const frac = Math.min(1, Math.abs(contrib) / maxAbsC2);
                    const r = 16;
                    const arcR = r + 4;
                    const circ = 2 * Math.PI * arcR;
                    const dash = frac * circ;
                    const arcColor = contrib >= 0 ? "#10b981" : "#fb7185";
                    return (
                      <g
                        key={`h2-${i}`}
                        onMouseEnter={() => setHover({ layer: "h2", index: i })}
                        onMouseLeave={() =>
                          setHover({ layer: null, index: null })
                        }
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={r}
                          fill={`rgba(236,72,153,${0.15 + intensity * 0.85})`}
                          stroke="#ec4899"
                          strokeWidth={1.8}
                        />
                        {c2 && (
                          <circle
                            cx={x}
                            cy={y}
                            r={arcR}
                            fill="none"
                            stroke={arcColor}
                            strokeWidth={3.2}
                            strokeDasharray={`${dash} ${circ}`}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${x} ${y})`}
                            style={{
                              transition: "stroke-dasharray 0.3s, stroke 0.3s",
                            }}
                            opacity={0.92}
                          />
                        )}
                      </g>
                    );
                  });
                })()}
              {/* Output digits */}
              {probs &&
                probs.map((p, i) => {
                  const x = 760;
                  const y = 40 + i * (380 / 9);
                  const max = Math.max(...probs);
                  const highlight = p === max;
                  return (
                    <g
                      key={`out-${i}`}
                      onMouseEnter={() => setHover({ layer: "out", index: i })}
                      onMouseLeave={() =>
                        setHover({ layer: null, index: null })
                      }
                    >
                      <rect
                        x={x - 24}
                        y={y - 24}
                        width={48}
                        height={48}
                        rx={10}
                        fill={highlight ? "#06b6d4" : "#1e293b"}
                        stroke={"#06b6d4"}
                        strokeWidth={highlight ? 3 : 1.6}
                      />
                      <text
                        x={x}
                        y={y + 6}
                        fontSize={20}
                        textAnchor="middle"
                        fontFamily="monospace"
                        fill={highlight ? "#0f172a" : "#06b6d4"}
                      >
                        {i}
                      </text>
                      <text
                        x={x - 38}
                        y={y - 30}
                        fontSize={9}
                        fontFamily="monospace"
                        fill="#e0f2fe"
                      >
                        {(p * 100).toFixed(1)}%
                      </text>
                    </g>
                  );
                })}
              {/* Weights lines */}
              {showWeights && weightMeta && h1 && h2 && (
                <g>
                  {/* Input->H1 subset lines (dynamic contributions: pooled activation * weight) */}
                  {weightMeta.layer1WeightsPooled.map((wRow, i) => {
                    // If hovering an output, only show input lines feeding selected path hidden1 neurons
                    if (isOutputHover && hoverPath && !hoverPath.keepH1.has(i))
                      return null;
                    // compute contributions for this hidden1 neuron across pooled inputs
                    let contrib = wRow.map((w, idx) => (pooled[idx] || 0) * w);
                    if (reluLines)
                      contrib = contrib.map((v) => (v < 0 ? 0 : v));
                    const maxAbsContrib = Math.max(
                      1e-6,
                      ...contrib.map((v) => Math.abs(v))
                    );
                    const keep = topK(contrib, modeConfig.inTop);
                    const targetY =
                      40 + i * (380 / Math.max(1, weightMeta.h1Count - 1));
                    return wRow.map((w, pi) => {
                      if (!keep.has(pi)) return null;
                      const col = pi % POOLED;
                      const row = Math.floor(pi / POOLED);
                      const sx = 10 + col * 14 + 6;
                      const sy = 10 + row * 14 + 6;
                      const tx = 300;
                      const ty = targetY;
                      const dyn = contrib[pi];
                      if (reluLines && dyn <= 0) return null;
                      const width = safeWidth(
                        Math.abs(dyn),
                        maxAbsContrib,
                        0.18,
                        2.4
                      );
                      const color = "#06b6d4";
                      let op = 0.1 + (Math.abs(dyn) / maxAbsContrib) * 0.65;
                      const onPath = isOutputHover && hoverPath?.keepH1.has(i);
                      const dim =
                        hover.layer && hover.layer !== "h1" && !onPath;
                      if (dim) op *= 0.15;
                      let adjWidth = width;
                      if (!reluLines && dyn < 0) {
                        adjWidth *= 0.7; // make negatives more visible (was 0.45)
                        op = Math.max(op, onPath ? 0.35 : 0.25); // higher floor if on path
                      } else {
                        adjWidth *= onPath ? 1.3 : 1.18; // boost positive if on path
                        op = Math.max(op, onPath ? 0.55 : 0.1);
                      }
                      const id = `in-${i}-${pi}`;
                      const hovered = lineHover === id;
                      return (
                        <line
                          key={id}
                          x1={sx}
                          y1={sy}
                          x2={tx}
                          y2={ty}
                          stroke={color}
                          strokeWidth={
                            adjWidth *
                            ((hover.layer === "h1" && hover.index === i) ||
                            onPath ||
                            hovered
                              ? 1.55
                              : 1)
                          }
                          strokeOpacity={
                            op * (onPath ? 1.25 : 1) * (hovered ? 1.3 : 1)
                          }
                          style={{
                            transition:
                              "stroke-opacity .15s, stroke-width .15s",
                          }}
                          onMouseEnter={() => setLineHover(id)}
                          onMouseLeave={() => setLineHover(null)}
                        />
                      );
                    });
                  })}
                  {/* H1->H2 subset lines (dynamic contributions) */}
                  {weightMeta.L2.W.slice(0, weightMeta.h2Count).map(
                    (row, j) => {
                      let contrib = row
                        .slice(0, weightMeta.h1Count)
                        .map((w, idx) => (h1[idx] || 0) * w);
                      if (reluLines)
                        contrib = contrib.map((v) => (v < 0 ? 0 : v));
                      const maxAbsContrib = Math.max(
                        1e-6,
                        ...contrib.map((v) => Math.abs(v))
                      );
                      const keep = topK(contrib, modeConfig.h1h2Top);
                      return row.slice(0, weightMeta.h1Count).map((w, i) => {
                        if (!keep.has(i)) return null;
                        const sx = 300;
                        const sy =
                          40 + i * (380 / Math.max(1, weightMeta.h1Count - 1));
                        const tx = 520;
                        const ty =
                          40 + j * (380 / Math.max(1, weightMeta.h2Count - 1));
                        const dyn = contrib[i];
                        if (reluLines && dyn <= 0) return null;
                        const width = safeWidth(
                          Math.abs(dyn),
                          maxAbsContrib,
                          0.25,
                          2.6
                        );
                        const color = "#06b6d4";
                        let op = 0.14 + (Math.abs(dyn) / maxAbsContrib) * 0.6;
                        const dim =
                          hover.layer &&
                          hover.layer !== "h1" &&
                          hover.layer !== "h2" &&
                          !(
                            isOutputHover &&
                            hoverPath?.keepH1.has(i) &&
                            hoverPath?.keepH2.has(j)
                          );
                        if (dim) op *= 0.15;
                        let adjWidth = width;
                        if (!reluLines && dyn < 0) {
                          adjWidth *= 0.72; // more visible negatives (was 0.5)
                          op = Math.max(op, 0.28);
                        } else {
                          adjWidth *= 1.18; // positive slightly thicker
                        }
                        const id = `h1h2-${i}-${j}`;
                        const hovered = lineHover === id;
                        return (
                          <line
                            key={id}
                            x1={sx}
                            y1={sy}
                            x2={tx}
                            y2={ty}
                            stroke={color}
                            strokeWidth={
                              adjWidth *
                              ((hover.layer === "h1" && hover.index === i) ||
                              (hover.layer === "h2" && hover.index === j) ||
                              hovered
                                ? 1.5
                                : 1)
                            }
                            strokeOpacity={op * (hovered ? 1.35 : 1)}
                            style={{
                              transition:
                                "stroke-opacity .15s, stroke-width .15s",
                            }}
                            onMouseEnter={() => setLineHover(id)}
                            onMouseLeave={() => setLineHover(null)}
                          />
                        );
                      });
                    }
                  )}
                  {/* H2->Output dynamic lines */}
                  {model &&
                    probs &&
                    h2 &&
                    (() => {
                      const outW = model.layers[2].W;
                      const h2Count = Math.min(weightMeta.h2Count, h2.length);
                      const predictedIdx = probs.indexOf(Math.max(...probs));
                      const outTop = isOutputHover
                        ? Infinity
                        : weightMode === "sparse"
                        ? 2
                        : weightMode === "medium"
                        ? 4
                        : 8;
                      return outW.map((row, outIdx) => {
                        if (
                          isOutputHover &&
                          hover.index !== outIdx &&
                          !hoverPath
                        )
                          return null;
                        const subset = row.slice(0, h2Count);
                        let contrib = subset.map((w, i) => w * (h2[i] || 0));
                        if (reluLines)
                          contrib = contrib.map((v) => (v < 0 ? 0 : v));
                        const maxAbs = Math.max(
                          1e-6,
                          ...contrib.map((v) => Math.abs(v))
                        );
                        const keep = topK(contrib, outTop);
                        return contrib.map((val, i) => {
                          if (!keep.has(i)) return null;
                          // If hovering an output restrict to upstream important hidden2 neurons if we computed a path
                          if (
                            isOutputHover &&
                            hoverPath &&
                            !hoverPath.keepH2.has(i)
                          )
                            return null;
                          const sx = 520;
                          const sy = 40 + i * (380 / Math.max(1, h2Count - 1));
                          const outCenterY = 40 + outIdx * (380 / 9);
                          const outx = 760 - 24; // left edge of output box
                          const outy = outCenterY; // vertical center
                          let width = safeWidth(
                            Math.abs(val),
                            maxAbs,
                            0.4,
                            3.2
                          );
                          if (
                            outIdx === predictedIdx ||
                            (isOutputHover && hover.index === outIdx)
                          )
                            width *= 1.9;
                          const color = "#06b6d4";
                          const opBase = 0.16 + (Math.abs(val) / maxAbs) * 0.55;
                          let op =
                            outIdx === predictedIdx ||
                            (isOutputHover && hover.index === outIdx)
                              ? Math.min(1, opBase + 0.25)
                              : opBase * 0.75;
                          const dim =
                            hover.layer &&
                            !(
                              (hover.layer === "h2" && hover.index === i) ||
                              (hover.layer === "out" &&
                                hover.index === outIdx) ||
                              (isOutputHover &&
                                hoverPath?.keepH2.has(i) &&
                                hover.index === outIdx)
                            );
                          if (dim) op *= 0.15;
                          if (reluLines) {
                            if (val <= 0) return null; // drop non-positive
                            width *= 1.18;
                            op = Math.max(op, 0.3);
                          } else {
                            if (val < 0) {
                              width *= 0.7; // more visible negatives (was 0.5)
                              op = Math.max(op, 0.3);
                            } else {
                              width *= 1.18; // positive slightly thicker
                            }
                          }
                          const id = `h2out-${outIdx}-${i}`;
                          const hovered = lineHover === id;
                          return (
                            <line
                              key={id}
                              x1={sx}
                              y1={sy}
                              x2={outx}
                              y2={outy}
                              stroke={color}
                              strokeWidth={
                                width *
                                ((hover.layer === "h2" && hover.index === i) ||
                                (hover.layer === "out" &&
                                  hover.index === outIdx) ||
                                hovered
                                  ? 1.55
                                  : 1)
                              }
                              strokeOpacity={op * (hovered ? 1.35 : 1)}
                              style={{
                                transition:
                                  "stroke-opacity .15s, stroke-width .15s",
                              }}
                              filter={
                                outIdx === predictedIdx
                                  ? "url(#glow)"
                                  : undefined
                              }
                              onMouseEnter={() => setLineHover(id)}
                              onMouseLeave={() => setLineHover(null)}
                            />
                          );
                        });
                      });
                    })()}
                </g>
              )}
              {/* Labels */}
              <text x={100} y={470} fontSize={12} fill="#94a3b8">
                Input 28×28 (pooled 14×14)
              </text>
              <text x={260} y={470} fontSize={12} fill="#94a3b8">
                Hidden 1 (first {weightMeta?.h1Count ?? H1_SHOW})
              </text>
              <text x={480} y={470} fontSize={12} fill="#94a3b8">
                Hidden 2 (first {weightMeta?.h2Count ?? H2_SHOW})
              </text>
              <text x={740} y={470} fontSize={12} fill="#94a3b8">
                Output (digits)
              </text>
            </svg>
          </div>
        )}
        {classic && (
          <div
            className="flex-1 overflow-x-auto"
            style={{ height: DIAGRAM_HEIGHT }}
          >
            <svg
              width={1000}
              height={DIAGRAM_HEIGHT}
              viewBox={`0 0 1000 ${DIAGRAM_HEIGHT}`}
              className="max-w-full h-auto"
            >
              {/* Top row: digits (outputs) */}
              {Array.from({ length: 10 }).map((_, i) => {
                const spacing = 900 / 9;
                const x = 40 + i * spacing;
                const y = 40;
                const active = probs && i === probs.indexOf(Math.max(...probs));
                return (
                  <g key={i}>
                    <rect
                      x={x - 28}
                      y={y - 28}
                      width={56}
                      height={56}
                      rx={8}
                      fill={active ? "#000" : "#f8fafc"}
                      stroke="#111827"
                      strokeWidth={2}
                    />
                    <text
                      x={x}
                      y={y + 9}
                      fontSize={28}
                      fontWeight={600}
                      textAnchor="middle"
                      fill={active ? "#ffffff" : "#111827"}
                      fontFamily="monospace"
                    >
                      {i}
                    </text>
                    {probs && (
                      <text
                        x={x}
                        y={y + 46}
                        fontSize={9}
                        textAnchor="middle"
                        fill="#64748b"
                      >
                        {(probs[i] * 100 || 0).toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Hidden layer 1 row */}
              {h1 &&
                h1.map((a, i) => {
                  const count = h1.length;
                  const x = 80 + i * (860 / Math.max(1, count - 1));
                  const y = 200; // moderate spacing (previously tight 160)
                  const intensity = showActs ? a / (Math.max(...h1) || 1) : 0;
                  const contrib = c1 ? c1[i] || 0 : 0;
                  const maxAbsC1 = c1
                    ? Math.max(1e-6, ...c1.map((v) => Math.abs(v)))
                    : 1;
                  const frac = Math.min(1, Math.abs(contrib) / maxAbsC1);
                  const barH = 36 * frac;
                  const barY = y - 18 + (36 - barH);
                  const barColor = contrib >= 0 ? "#34d399" : "#f472b6";
                  return (
                    <g key={`c-h1-${i}`}>
                      <rect
                        x={x - 18}
                        y={y - 18}
                        width={36}
                        height={36}
                        rx={6}
                        fill={`rgba(99,102,241,${0.15 + intensity * 0.85})`}
                        stroke="#6366f1"
                        strokeWidth={1.5}
                      />
                      {c1 && (
                        <rect
                          x={x - 18 + 3}
                          width={30}
                          y={barY + 3}
                          height={barH - 6}
                          rx={4}
                          fill={barColor}
                          fillOpacity={0.55}
                          style={{ transition: "y 0.28s, height 0.28s" }}
                        />
                      )}
                    </g>
                  );
                })}
              {/* Hidden layer 2 row */}
              {h2 &&
                h2.slice(0, H2_SHOW).map((a, i) => {
                  const count = Math.min(H2_SHOW, h2.length);
                  const x = 80 + i * (860 / Math.max(1, count - 1));
                  const y = 330; // moderate spacing (previously tight 300)
                  const intensity = showActs ? a / (Math.max(...h2) || 1) : 0;
                  const contrib = c2 ? c2[i] || 0 : 0;
                  const maxAbsC2 = c2
                    ? Math.max(1e-6, ...c2.map((v) => Math.abs(v)))
                    : 1;
                  const frac = Math.min(1, Math.abs(contrib) / maxAbsC2);
                  const barH = 40 * frac;
                  const barY = y - 20 + (40 - barH);
                  const barColor = contrib >= 0 ? "#10b981" : "#fb7185";
                  return (
                    <g key={`c-h2-${i}`}>
                      <rect
                        x={x - 20}
                        y={y - 20}
                        width={40}
                        height={40}
                        rx={8}
                        fill={`rgba(236,72,153,${0.15 + intensity * 0.85})`}
                        stroke="#ec4899"
                        strokeWidth={1.7}
                      />
                      {c2 && (
                        <rect
                          x={x - 20 + 4}
                          width={32}
                          y={barY + 4}
                          height={barH - 8}
                          rx={5}
                          fill={barColor}
                          fillOpacity={0.55}
                          style={{ transition: "y 0.28s, height 0.28s" }}
                        />
                      )}
                    </g>
                  );
                })}
              {/* Connection lines (Hidden2 -> Outputs) */}
              {/* Classic lines using actual weights */}
              {classic && showWeights && model && h1 && h2 && (
                <g>
                  {/* Minimal important lines mode for classic diagram */}
                  {(() => {
                    /* constants for minimal visualization */ return null;
                  })()}
                  {/* Hidden1 -> Hidden2 (use L2 weights) */}
                  {model.layers[1].W.slice(0, Math.min(H2_SHOW, h2.length)).map(
                    (row, h2i) => {
                      const CLASSIC_H1H2_TOP = 2; // dynamic top 2 contributions
                      const contribVals = row
                        .slice(0, h1.length)
                        .map((w, idx) => (h1[idx] || 0) * w);
                      const maxAbsContrib = Math.max(
                        1e-6,
                        ...contribVals.map((v) => Math.abs(v))
                      );
                      const keep = topK(contribVals, CLASSIC_H1H2_TOP);
                      return row.slice(0, h1.length).map((w, h1i) => {
                        if (!keep.has(h1i)) return null;
                        const h1x =
                          80 + h1i * (860 / Math.max(1, h1.length - 1));
                        const h1y = 200;
                        const h2x =
                          80 +
                          h2i *
                            (860 /
                              Math.max(1, Math.min(H2_SHOW, h2.length) - 1));
                        const h2y = 330;
                        const dyn = contribVals[h1i];
                        const width = safeWidth(dyn, maxAbsContrib, 0.6, 3.4);
                        const color = dyn >= 0 ? "#16a34a" : "#9333ea";
                        const op =
                          0.18 + Math.min(0.8, Math.abs(dyn) / maxAbsContrib);
                        return (
                          <line
                            key={`cl-h1h2-${h1i}-${h2i}`}
                            x1={h2x}
                            y1={h2y - 20}
                            x2={h1x}
                            y2={h1y + 18}
                            stroke={color}
                            strokeWidth={width}
                            strokeOpacity={op}
                          />
                        );
                      });
                    }
                  )}
                  {/* Hidden1 -> Outputs (effective weights aggregated through Hidden2) */}
                  {(() => {
                    const predictedIdx = probs
                      ? probs.indexOf(Math.max(...probs))
                      : -1;
                    const CLASSIC_H1OUT_TOP = 3; // dynamic top contributors based on current activations
                    const L2 = model.layers[1].W; // hidden2 x hidden1
                    const L3 = model.layers[2].W; // output x hidden2
                    const h2Count = Math.min(H2_SHOW, h2.length);
                    const h1Count = h1.length;
                    // Precompute effective weights: out x h1
                    const effective: number[][] = L3.map((row) => {
                      const subset = row.slice(0, h2Count);
                      const eff: number[] = new Array(h1Count).fill(0);
                      for (let h2i = 0; h2i < h2Count; h2i++) {
                        const wOut = subset[h2i];
                        const wRow = L2[h2i];
                        for (let h1i = 0; h1i < h1Count; h1i++) {
                          eff[h1i] += wOut * wRow[h1i];
                        }
                      }
                      return eff;
                    });
                    // incorporate current activation for dynamic contributions
                    const dynEff = effective.map((row) =>
                      row.map((wEff, i) => wEff * (h1[i] || 0))
                    );
                    const maxAbsDynEff = Math.max(
                      1e-6,
                      ...dynEff.flat().map((v) => Math.abs(v))
                    );
                    return dynEff.map((row, outIdx) => {
                      const keep = topK(row, CLASSIC_H1OUT_TOP);
                      return row.map((dynVal, h1i) => {
                        if (!keep.has(h1i)) return null;
                        const outSpacing = 900 / 9;
                        const outx = 40 + outIdx * outSpacing;
                        const outy = 40 + 28; // bottom center of digit box
                        const h1x = 80 + h1i * (860 / Math.max(1, h1Count - 1));
                        const h1y = 200 - 18; // top center of hidden1 rect (moderate layout)
                        let width = safeWidth(dynVal, maxAbsDynEff, 0.5, 3.2);
                        if (outIdx === predictedIdx) width *= 2.2; // emphasize current prediction pathway
                        const color = dynVal >= 0 ? "#16a34a" : "#9333ea";
                        const opBase =
                          0.2 + Math.min(0.65, Math.abs(dynVal) / maxAbsDynEff);
                        const op =
                          outIdx === predictedIdx
                            ? Math.min(1, opBase + 0.25)
                            : opBase * 0.6;
                        return (
                          <line
                            key={`cl-h1out-${h1i}-${outIdx}`}
                            x1={h1x}
                            y1={h1y}
                            x2={outx}
                            y2={outy}
                            stroke={color}
                            strokeWidth={width}
                            strokeOpacity={op}
                          />
                        );
                      });
                    });
                  })()}
                </g>
              )}
              {/* Labels */}
              <text x={40} y={375} fontSize={12} fill="#64748b">
                Hidden Layer 2
              </text>
              <text x={40} y={245} fontSize={12} fill="#64748b">
                Hidden Layer 1
              </text>
              <text x={40} y={110} fontSize={12} fill="#64748b">
                Output Digits
              </text>
            </svg>
          </div>
        )}
      </div>
      {/* Percentage grid removed as per request */}
      {model && (
        <div className="text-[10px] text-indigo-300/60">
          Arch {model.architecture}
        </div>
      )}
    </div>
  );
};

export default MnistNetworkDemo;
