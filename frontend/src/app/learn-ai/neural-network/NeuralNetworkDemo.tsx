"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

/*
  NeuralNetworkDemo (with real simple math)
  Now performs an actual forward pass on a tiny randomly‑initialized 3‑layer MLP.
  Architecture (updated again):
    Freehand canvas → pooled into 36 average alpha features (6×6 blocks) → Hidden1(20 ReLU) → Hidden2(12 ReLU) → Output(4 softmax)
  We display:
    - Activations (color intensity)
    - Output probabilities
    - Optional matrix & vector numeric details
  Users can:
    - Draw any pattern on the grid (click & drag)
    - Randomize weights
    - Toggle math detail visibility
*/

interface ClassDef {
  id: string;
  label: string;
  icon: string;
  color: string;
}
// Output classes (Pixel Grid replaced by Pentagon)
const CLASSES: ClassDef[] = [
  { id: "circle", label: "Circle", icon: "◯", color: "#38bdf8" },
  { id: "square", label: "Square", icon: "▣", color: "#a78bfa" },
  { id: "triangle", label: "Triangle", icon: "△", color: "#f472b6" },
  { id: "pentagon", label: "Pentagon", icon: "⬠", color: "#34d399" },
];

// Canvas + feature pooling
const CANVAS_SIZE = 256; // draw canvas
const FEAT_ROWS = 8; // increased resolution
const FEAT_COLS = 8; // 64 pooled features
const BASE_INPUT_SIZE = FEAT_ROWS * FEAT_COLS; // 64
const EXTRA_GEOM = 5; // aspect, density, circularity, corners, strokeDensity
const INPUT_SIZE = BASE_INPUT_SIZE + EXTRA_GEOM; // 69 total features
const HIDDEN1 = 20;
const HIDDEN2 = 12;

// Helpers
const rand = () => Math.random() * 0.6 - 0.3; // centered small weights
function makeMatrix(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, rand));
}
function makeVector(len: number) {
  return Array.from({ length: len }, rand);
}
function relu(x: number) {
  return x > 0 ? x : 0;
}
function softmax(arr: number[]) {
  const m = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const NeuralNetworkDemo: React.FC = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<"draw" | "erase">("draw");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [showMath, setShowMath] = useState(false);
  const [heuristic, setHeuristic] = useState<{
    label: string;
    probs: number[];
  } | null>(null);
  const [predHistory, setPredHistory] = useState<number[]>([]); // recent final predictions
  const [userSamples, setUserSamples] = useState<{ x: number[]; y: number }[]>(
    []
  ); // collected freehand samples
  // Automatic synthetic pre-training status
  const [pretraining, setPretraining] = useState(true);
  const [preEpoch, setPreEpoch] = useState(0);
  const [preLoss, setPreLoss] = useState<number | null>(null);
  const TOTAL_PRE_EPOCHS = 80;
  const [features, setFeatures] = useState<number[]>(() =>
    Array(INPUT_SIZE).fill(0)
  );
  const [featMean, setFeatMean] = useState<number[] | null>(null); // normalization mean
  const [featStd, setFeatStd] = useState<number[] | null>(null); // normalization std
  const [W1, setW1] = useState(() => makeMatrix(INPUT_SIZE, HIDDEN1));
  const [b1, setB1] = useState(() => makeVector(HIDDEN1));
  const [W2, setW2] = useState(() => makeMatrix(HIDDEN1, HIDDEN2));
  const [b2, setB2] = useState(() => makeVector(HIDDEN2));
  const [W3, setW3] = useState(() => makeMatrix(HIDDEN2, CLASSES.length));
  const [b3, setB3] = useState(() => makeVector(CLASSES.length));
  const [logPriors, setLogPriors] = useState<number[] | null>(null); // class prior correction

  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0); // animation phase only
  const [isTuning, setIsTuning] = useState(false);
  const [autoTrain, setAutoTrain] = useState(false);
  const [autoTrainMode, setAutoTrainMode] = useState<
    "predicted" | "circle" | "square" | "triangle" | "pentagon"
  >("predicted");
  const [pendingAuto, setPendingAuto] = useState(false);

  // Forward pass with optional normalization
  const forward = useMemo(() => {
    const raw = features;
    const anyActive = raw.some((v) => v > 0.01);
    if (!anyActive) return null;
    const x =
      featMean && featStd && featMean.length === raw.length
        ? raw.map((v, i) => (v - featMean[i]) / (featStd[i] || 1))
        : raw;
    const z1: number[] = Array.from({ length: HIDDEN1 }, (_, j) =>
      x.reduce((acc, xi, i) => acc + xi * W1[i][j], b1[j])
    );
    const h1 = z1.map(relu);
    const z2: number[] = Array.from({ length: HIDDEN2 }, (_, j) =>
      h1.reduce((acc, v, i) => acc + v * W2[i][j], b2[j])
    );
    const h2 = z2.map(relu);
    let logits: number[] = Array.from({ length: CLASSES.length }, (_, j) =>
      h2.reduce((acc, v, i) => acc + v * W3[i][j], b3[j])
    );
    // subtract log priors to debias oversampled classes
    if (logPriors && logPriors.length === logits.length) {
      logits = logits.map((L, i) => L - logPriors[i]);
    }
    const probs = softmax(logits);
    return { x, z1, h1, z2, h2, logits, probs };
  }, [features, featMean, featStd, W1, W2, W3, b1, b2, b3, logPriors]);

  // Blend network + heuristic if uncertain
  const blendedProbs = useMemo(() => {
    if (!forward) return null;
    let p = [...forward.probs];
    if (heuristic) {
      // Continuous fusion: geometric mean of network & heuristic with alpha weight
      const alpha = 0.35; // heuristic influence strength
      const fused = p.map(
        (v, i) =>
          Math.pow(Math.max(v, 1e-8), 1 - alpha) *
          Math.pow(Math.max(heuristic.probs[i], 1e-8), alpha)
      );
      const sumF = fused.reduce((a, b) => a + b, 0);
      p = fused.map((v) => v / sumF);
      // If heuristic strongly disagrees & has high relative ratio, boost further
      const netIdx = p.indexOf(Math.max(...p));
      const heurIdx = heuristic.probs.indexOf(Math.max(...heuristic.probs));
      if (netIdx !== heurIdx) {
        const hTop = heuristic.probs[heurIdx];
        const hSecond = [...heuristic.probs].sort((a, b) => b - a)[1] || 1e-6;
        if (hTop > 0.55 && hTop / (hSecond + 1e-6) > 1.8) {
          // Re‑blend leaning more toward heuristic
          const beta = 0.55;
          const fused2 = forward.probs.map(
            (v, i) =>
              Math.pow(Math.max(v, 1e-8), 1 - beta) *
              Math.pow(Math.max(heuristic.probs[i], 1e-8), beta)
          );
          const s2 = fused2.reduce((a, b) => a + b, 0);
          p = fused2.map((v) => v / s2);
        }
      }
    }
    return p;
  }, [forward, heuristic]);

  // Final decision: choose between network, heuristic, or blended based on confidence margins
  const finalProbs = useMemo(() => {
    if (!forward) return null;
    const net = [...forward.probs];
    const blend = blendedProbs ? [...blendedProbs] : [...net];
    if (!heuristic) return blend;
    const heur = [...heuristic.probs];
    const top2 = (arr: number[]) => {
      let a = 0,
        b = 1;
      if (arr[b] > arr[a]) {
        const t = a;
        a = b;
        b = t;
      }
      for (let i = 2; i < arr.length; i++) {
        if (arr[i] > arr[a]) {
          b = a;
          a = i;
        } else if (arr[i] > arr[b]) b = i;
      }
      return { top: arr[a], second: arr[b], idx: a };
    };
    const nm = top2(net);
    const hm = top2(heur);
    const netMargin = nm.second ? nm.top / nm.second : nm.top;
    const heurMargin = hm.second ? hm.top / hm.second : hm.top;
    // If heuristic much more confident than net & confident enough, use heuristic directly
    if (heurMargin > netMargin * 1.15 && hm.top > 0.55) {
      return heur;
    }
    // If network extremely confident relative to heuristic, prefer pure net
    if (netMargin > heurMargin * 1.3 && nm.top > 0.6) {
      return net;
    }
    // If blended collapses (same label repeated) fall back to heuristic to diversify
    if (predHistory.length >= 3) {
      const last3 = predHistory.slice(-3);
      if (last3.every((v) => v === last3[0])) {
        // detect collapse; if heuristic disagrees, trust heuristic
        if (hm.idx !== last3[0] && hm.top > 0.5) return heur;
      }
    }
    return blend;
  }, [forward, blendedProbs, heuristic, predHistory]);

  // Track prediction history
  useEffect(() => {
    if (!finalProbs) return;
    const idx = finalProbs.indexOf(Math.max(...finalProbs));
    setPredHistory((h) => {
      if (h.length && h[h.length - 1] === idx) return h; // no change -> no re-render
      const trimmed = h.length >= 10 ? h.slice(-9) : h;
      return [...trimmed, idx];
    });
  }, [finalProbs]);

  // Animate phases whenever selection changes
  useEffect(() => {
    if (!forward) {
      setPhase(0);
      return;
    }
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 360);
    const t3 = setTimeout(() => setPhase(3), 640);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [forward]);

  const randomize = () => {
    setW1(makeMatrix(INPUT_SIZE, HIDDEN1));
    setB1(makeVector(HIDDEN1));
    setW2(makeMatrix(HIDDEN1, HIDDEN2));
    setB2(makeVector(HIDDEN2));
    setW3(makeMatrix(HIDDEN2, CLASSES.length));
    setB3(makeVector(CLASSES.length));
    // re-trigger forward pass
    setPhase(0);
    if (features.some((v) => v > 0.01)) {
      setTimeout(() => setPhase(1), 120);
      setTimeout(() => setPhase(2), 360);
      setTimeout(() => setPhase(3), 640);
    }
  };
  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setFeatures(Array(INPUT_SIZE).fill(0));
    setPhase(0);
    setHeuristic(null);
  }, []);

  // One-sample fine-tune using current drawing labeled as class index
  const fineTune = useCallback(
    async (classIndex: number) => {
      if (pretraining || isTuning) return;
      if (!features.some((v) => v > 0.01)) return; // nothing drawn
      if (!featMean || !featStd) return; // need normalization stats
      setIsTuning(true);
      try {
        // Copy weights locally for speed (mutable then set back)
        const W1l = W1.map((r) => [...r]);
        const b1l = [...b1];
        const W2l = W2.map((r) => [...r]);
        const b2l = [...b2];
        const W3l = W3.map((r) => [...r]);
        const b3l = [...b3];
        const x = features.map((v, i) => (v - featMean[i]) / (featStd[i] || 1));
        const steps = 8;
        for (let step = 0; step < steps; step++) {
          // Forward
          const z1 = Array.from({ length: HIDDEN1 }, (_, j) =>
            x.reduce((a, xi, i) => a + xi * W1l[i][j], b1l[j])
          );
          const h1 = z1.map((v) => (v > 0 ? v : 0));
          const z2 = Array.from({ length: HIDDEN2 }, (_, j) =>
            h1.reduce((a, v, i) => a + v * W2l[i][j], b2l[j])
          );
          const h2 = z2.map((v) => (v > 0 ? v : 0));
          const logits = Array.from({ length: CLASSES.length }, (_, j) =>
            h2.reduce((a, v, i) => a + v * W3l[i][j], b3l[j])
          );
          const m = Math.max(...logits);
          const exps = logits.map((L) => Math.exp(L - m));
          const sumExp = exps.reduce((a, b) => a + b, 0);
          const probs = exps.map((e) => e / sumExp);
          // Gradients (single sample)
          const dLogits = probs.map((p, j) => p - (j === classIndex ? 1 : 0));
          const gW3 = Array.from({ length: HIDDEN2 }, () =>
            Array(CLASSES.length).fill(0)
          );
          const gb3 = Array(CLASSES.length).fill(0);
          for (let j = 0; j < CLASSES.length; j++) {
            gb3[j] += dLogits[j];
            for (let i = 0; i < HIDDEN2; i++) gW3[i][j] += h2[i] * dLogits[j];
          }
          const dh2 = Array(HIDDEN2).fill(0);
          for (let i = 0; i < HIDDEN2; i++) {
            let s = 0;
            for (let j = 0; j < CLASSES.length; j++)
              s += dLogits[j] * W3l[i][j];
            dh2[i] = s;
          }
          const dz2 = dh2.map((v, i) => (z2[i] > 0 ? 1 : 0) * v);
          const gW2 = Array.from({ length: HIDDEN1 }, () =>
            Array(HIDDEN2).fill(0)
          );
          const gb2 = Array(HIDDEN2).fill(0);
          for (let j = 0; j < HIDDEN2; j++) {
            gb2[j] += dz2[j];
            for (let i = 0; i < HIDDEN1; i++) gW2[i][j] += h1[i] * dz2[j];
          }
          const dh1 = Array(HIDDEN1).fill(0);
          for (let i = 0; i < HIDDEN1; i++) {
            let s = 0;
            for (let j = 0; j < HIDDEN2; j++) s += dz2[j] * W2l[i][j];
            dh1[i] = s;
          }
          const dz1 = dh1.map((v, i) => (z1[i] > 0 ? 1 : 0) * v);
          const gW1 = Array.from({ length: INPUT_SIZE }, () =>
            Array(HIDDEN1).fill(0)
          );
          const gb1 = Array(HIDDEN1).fill(0);
          for (let j = 0; j < HIDDEN1; j++) {
            gb1[j] += dz1[j];
            for (let i = 0; i < INPUT_SIZE; i++) gW1[i][j] += x[i] * dz1[j];
          }
          const baseLr = 0.12;
          const lr = baseLr * (1 - step / steps); // decay
          for (let i = 0; i < INPUT_SIZE; i++)
            for (let j = 0; j < HIDDEN1; j++) W1l[i][j] -= lr * gW1[i][j];
          for (let j = 0; j < HIDDEN1; j++) b1l[j] -= lr * gb1[j];
          for (let i = 0; i < HIDDEN1; i++)
            for (let j = 0; j < HIDDEN2; j++) W2l[i][j] -= lr * gW2[i][j];
          for (let j = 0; j < HIDDEN2; j++) b2l[j] -= lr * gb2[j];
          for (let i = 0; i < HIDDEN2; i++)
            for (let j = 0; j < CLASSES.length; j++)
              W3l[i][j] -= lr * gW3[i][j];
          for (let j = 0; j < CLASSES.length; j++) b3l[j] -= lr * gb3[j];
        }
        setW1(W1l);
        setB1(b1l);
        setW2(W2l);
        setB2(b2l);
        setW3(W3l);
        setB3(b3l);
        // Store raw (unnormalized) feature vector + label for later batch training
        setUserSamples((s) => [...s, { x: [...features], y: classIndex }]);
        // After tuning, reset heuristic so network takes precedence
        setHeuristic(null);
      } finally {
        setIsTuning(false);
      }
    },
    [pretraining, isTuning, features, featMean, featStd, W1, b1, W2, b2, W3, b3]
  );

  // Batch training on accumulated user samples (multi-epoch small gradient descent)
  const trainUserBatch = useCallback(() => {
    if (pretraining || isTuning) return;
    if (!featMean || !featStd) return;
    if (userSamples.length === 0) return;
    setIsTuning(true);
    try {
      // local copies
      const W1l = W1.map((r) => [...r]);
      const b1l = [...b1];
      const W2l = W2.map((r) => [...r]);
      const b2l = [...b2];
      const W3l = W3.map((r) => [...r]);
      const b3l = [...b3];
      const epochs = Math.min(10, 3 + Math.floor(userSamples.length / 8));
      const lrBase = 0.06;
      for (let ep = 0; ep < epochs; ep++) {
        // shuffle indices
        const idxs = [...Array(userSamples.length).keys()];
        for (let i = idxs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
        }
        // accumulate full-batch grads for stability
        const gW1 = Array.from({ length: INPUT_SIZE }, () =>
          Array(HIDDEN1).fill(0)
        );
        const gb1 = Array(HIDDEN1).fill(0);
        const gW2 = Array.from({ length: HIDDEN1 }, () =>
          Array(HIDDEN2).fill(0)
        );
        const gb2 = Array(HIDDEN2).fill(0);
        const gW3 = Array.from({ length: HIDDEN2 }, () =>
          Array(CLASSES.length).fill(0)
        );
        const gb3 = Array(CLASSES.length).fill(0);
        for (const k of idxs) {
          const sample = userSamples[k];
          const xNorm = sample.x.map(
            (v, i) => (v - featMean[i]) / (featStd[i] || 1)
          );
          const z1 = Array.from({ length: HIDDEN1 }, (_, j) =>
            xNorm.reduce((a, xi, i) => a + xi * W1l[i][j], b1l[j])
          );
          const h1 = z1.map((v) => (v > 0 ? v : 0));
          const z2 = Array.from({ length: HIDDEN2 }, (_, j) =>
            h1.reduce((a, v, i) => a + v * W2l[i][j], b2l[j])
          );
          const h2 = z2.map((v) => (v > 0 ? v : 0));
          const logits = Array.from({ length: CLASSES.length }, (_, j) =>
            h2.reduce((a, v, i) => a + v * W3l[i][j], b3l[j])
          );
          const m = Math.max(...logits);
          const exps = logits.map((L) => Math.exp(L - m));
          const sumExp = exps.reduce((a, b) => a + b, 0);
          const probs = exps.map((e) => e / sumExp);
          const dLogits = probs.map((p, j) => p - (j === sample.y ? 1 : 0));
          for (let j = 0; j < CLASSES.length; j++) {
            gb3[j] += dLogits[j];
            for (let i = 0; i < HIDDEN2; i++) gW3[i][j] += h2[i] * dLogits[j];
          }
          const dh2 = Array(HIDDEN2).fill(0);
          for (let i = 0; i < HIDDEN2; i++) {
            let s = 0;
            for (let j = 0; j < CLASSES.length; j++)
              s += dLogits[j] * W3l[i][j];
            dh2[i] = s;
          }
          const dz2 = dh2.map((v, i) => (z2[i] > 0 ? 1 : 0) * v);
          for (let j = 0; j < HIDDEN2; j++) {
            gb2[j] += dz2[j];
            for (let i = 0; i < HIDDEN1; i++) gW2[i][j] += h1[i] * dz2[j];
          }
          const dh1 = Array(HIDDEN1).fill(0);
          for (let i = 0; i < HIDDEN1; i++) {
            let s = 0;
            for (let j = 0; j < HIDDEN2; j++) s += dz2[j] * W2l[i][j];
            dh1[i] = s;
          }
          const dz1 = dh1.map((v, i) => (z1[i] > 0 ? 1 : 0) * v);
          for (let j = 0; j < HIDDEN1; j++) {
            gb1[j] += dz1[j];
            for (let i = 0; i < INPUT_SIZE; i++) gW1[i][j] += xNorm[i] * dz1[j];
          }
        }
        const inv = 1 / userSamples.length;
        const lr = lrBase * (1 - ep / epochs);
        for (let j = 0; j < HIDDEN1; j++) {
          gb1[j] *= inv;
          for (let i = 0; i < INPUT_SIZE; i++) {
            gW1[i][j] *= inv;
            W1l[i][j] -= lr * gW1[i][j];
          }
          b1l[j] -= lr * gb1[j];
        }
        for (let j = 0; j < HIDDEN2; j++) {
          gb2[j] *= inv;
          for (let i = 0; i < HIDDEN1; i++) {
            gW2[i][j] *= inv;
            W2l[i][j] -= lr * gW2[i][j];
          }
          b2l[j] -= lr * gb2[j];
        }
        for (let j = 0; j < CLASSES.length; j++) {
          gb3[j] *= inv;
          for (let i = 0; i < HIDDEN2; i++) {
            gW3[i][j] *= inv;
            W3l[i][j] -= lr * gW3[i][j];
          }
          b3l[j] -= lr * gb3[j];
        }
      }
      setW1(W1l);
      setB1(b1l);
      setW2(W2l);
      setB2(b2l);
      setW3(W3l);
      setB3(b3l);
      setHeuristic(null);
    } finally {
      setIsTuning(false);
    }
  }, [
    userSamples,
    pretraining,
    isTuning,
    featMean,
    featStd,
    W1,
    b1,
    W2,
    b2,
    W3,
    b3,
  ]);

  const updateFeaturesFromCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // bounding box of ink
    let minX = CANVAS_SIZE,
      minY = CANVAS_SIZE,
      maxX = 0,
      maxY = 0,
      active = 0;
    const thr = 28;
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
        if (a > thr) {
          active++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (active === 0) {
      setFeatures(Array(INPUT_SIZE).fill(0));
      setHeuristic(null);
      return;
    }
    const bw = maxX - minX + 1,
      bh = maxY - minY + 1;
    const norm = document.createElement("canvas");
    norm.width = CANVAS_SIZE;
    norm.height = CANVAS_SIZE;
    const nctx = norm.getContext("2d");
    if (!nctx) return;
    const scale = (0.85 * CANVAS_SIZE) / Math.max(bw, bh);
    const dw = bw * scale,
      dh = bh * scale;
    const dx = (CANVAS_SIZE - dw) / 2,
      dy = (CANVAS_SIZE - dh) / 2;
    nctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    nctx.drawImage(canvas, minX, minY, bw, bh, dx, dy, dw, dh);
    const img2 = nctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const blockW = CANVAS_SIZE / FEAT_COLS,
      blockH = CANVAS_SIZE / FEAT_ROWS;
    const feats: number[] = [];
    for (let r = 0; r < FEAT_ROWS; r++) {
      for (let c = 0; c < FEAT_COLS; c++) {
        const sx = Math.floor(c * blockW),
          sy = Math.floor(r * blockH),
          ex = Math.floor((c + 1) * blockW),
          ey = Math.floor((r + 1) * blockH);
        let sum = 0,
          count = 0;
        for (let y = sy; y < ey; y += 2) {
          for (let x = sx; x < ex; x += 2) {
            const a = img2.data[(y * CANVAS_SIZE + x) * 4 + 3];
            sum += a;
            count++;
          }
        }
        feats.push(count ? +(sum / (count * 255)).toFixed(3) : 0);
      }
    }
    // geometric engineered features (re-derive using original img for speed reuse variables)
    // reuse bounding box stats already computed above
    // Active pixel ratio inside bounding box (stroke density)
    let inkInBox = 0;
    for (let y = minY; y <= maxY; y += 2) {
      for (let x = minX; x <= maxX; x += 2) {
        const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
        if (a > thr) inkInBox++;
      }
    }
    // bw/bh already computed above
    const aspect = bw / bh;
    const aspectNorm = aspect / (aspect + 1); // maps (0,inf) -> (0,1)
    // fill approximated as fraction of bbox area (subsampled) similar to stroke density
    const density = inkInBox / Math.max(1, (bw * bh) / 4);
    // quick edge-based circularity + corner count (reuse heuristic method in lightweight way)
    let corners = 0;
    let peri = 0;
    const edgePts: { x: number; y: number }[] = [];
    for (let y = minY; y <= maxY; y += 4) {
      for (let x = minX; x <= maxX; x += 4) {
        const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
        if (a > thr) {
          const aL = img.data[(y * CANVAS_SIZE + Math.max(0, x - 4)) * 4 + 3];
          const aR =
            img.data[
              (y * CANVAS_SIZE + Math.min(CANVAS_SIZE - 4, x + 4)) * 4 + 3
            ];
          const aU = img.data[(Math.max(0, y - 4) * CANVAS_SIZE + x) * 4 + 3];
          const aD =
            img.data[
              (Math.min(CANVAS_SIZE - 4, y + 4) * CANVAS_SIZE + x) * 4 + 3
            ];
          if (aL <= thr || aR <= thr || aU <= thr || aD <= thr)
            edgePts.push({ x, y });
        }
      }
    }
    for (let i = 1; i < edgePts.length; i++) {
      const dx = edgePts[i].x - edgePts[i - 1].x;
      const dy = edgePts[i].y - edgePts[i - 1].y;
      peri += Math.hypot(dx, dy);
    }
    const circularity = peri ? (4 * Math.PI * inkInBox) / (peri * peri) : 0;
    const step = Math.max(1, Math.floor(edgePts.length / 50));
    const simplified: { x: number; y: number }[] = [];
    for (let i = 0; i < edgePts.length; i += step) simplified.push(edgePts[i]);
    for (let i = 2; i < simplified.length; i++) {
      const p0 = simplified[i - 2],
        p1 = simplified[i - 1],
        p2 = simplified[i];
      const v1x = p1.x - p0.x,
        v1y = p1.y - p0.y,
        v2x = p2.x - p1.x,
        v2y = p2.y - p1.y;
      const m1 = Math.hypot(v1x, v1y),
        m2 = Math.hypot(v2x, v2y);
      if (!m1 || !m2) continue;
      const ang = Math.acos(
        Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (m1 * m2)))
      );
      if (ang > Math.PI / 6 && ang < Math.PI - Math.PI / 6) corners++;
    }
    const cornersNorm = Math.min(1, corners / 6);
    const circularityNorm = Math.min(1, circularity);
    const extra = [
      aspectNorm,
      Math.min(1, density),
      circularityNorm,
      cornersNorm,
      Math.min(1, inkInBox / 1000),
    ];
    while (extra.length < EXTRA_GEOM) extra.push(0);
    setFeatures([...feats, ...extra]);
    // Heuristic shape estimation
    try {
      let active = 0,
        minX = CANVAS_SIZE,
        minY = CANVAS_SIZE,
        maxX = 0,
        maxY = 0;
      const thr = 24;
      for (let y = 0; y < CANVAS_SIZE; y += 2) {
        for (let x = 0; x < CANVAS_SIZE; x += 2) {
          const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
          if (a > thr) {
            active++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (active === 0) {
        setHeuristic(null);
        return;
      }
      const w = Math.max(1, maxX - minX + 1);
      const h = Math.max(1, maxY - minY + 1);
      const aspect = w / h;
      const fill = active / ((w * h) / 4);
      // edge sampling
      const edge: { x: number; y: number }[] = [];
      for (let y = minY; y <= maxY; y += 4) {
        for (let x = minX; x <= maxX; x += 4) {
          const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
          if (a > thr) {
            const aL = img.data[(y * CANVAS_SIZE + Math.max(0, x - 4)) * 4 + 3];
            const aR =
              img.data[
                (y * CANVAS_SIZE + Math.min(CANVAS_SIZE - 4, x + 4)) * 4 + 3
              ];
            const aU = img.data[(Math.max(0, y - 4) * CANVAS_SIZE + x) * 4 + 3];
            const aD =
              img.data[
                (Math.min(CANVAS_SIZE - 4, y + 4) * CANVAS_SIZE + x) * 4 + 3
              ];
            if (aL <= thr || aR <= thr || aU <= thr || aD <= thr)
              edge.push({ x, y });
          }
        }
      }
      let peri = 0;
      for (let i = 1; i < edge.length; i++) {
        const dx = edge[i].x - edge[i - 1].x;
        const dy = edge[i].y - edge[i - 1].y;
        peri += Math.hypot(dx, dy);
      }
      const circularity = peri ? (4 * Math.PI * active) / (peri * peri) : 0;
      const simple: { x: number; y: number }[] = [];
      const step = Math.max(1, Math.floor(edge.length / 60));
      for (let i = 0; i < edge.length; i += step) simple.push(edge[i]);
      let corners = 0;
      for (let i = 2; i < simple.length; i++) {
        const p0 = simple[i - 2],
          p1 = simple[i - 1],
          p2 = simple[i];
        const v1x = p1.x - p0.x,
          v1y = p1.y - p0.y,
          v2x = p2.x - p1.x,
          v2y = p2.y - p1.y;
        const m1 = Math.hypot(v1x, v1y),
          m2 = Math.hypot(v2x, v2y);
        if (!m1 || !m2) continue;
        const ang = Math.acos(
          Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (m1 * m2)))
        );
        if (ang > Math.PI / 6 && ang < Math.PI - Math.PI / 6) corners++;
      }
      const scores: Record<string, number> = {
        circle: 0,
        square: 0,
        triangle: 0,
        pentagon: 0,
      };
      const aspectPenalty = Math.min(1, Math.abs(1 - aspect));
      scores.circle = (1 - aspectPenalty) * Math.min(1, circularity * 1.2);
      scores.square =
        (1 - aspectPenalty) *
        Math.exp(-Math.pow((corners - 4) / 1.8, 2)) *
        Math.exp(-Math.pow((fill - 0.6) / 0.35, 2));
      // Triangle: require ~3 corners and moderate fill, penalize high circularity
      const triCornerTerm = Math.exp(-Math.pow((corners - 3) / 1.5, 2));
      const triFillTerm = Math.exp(-Math.pow((fill - 0.38) / 0.28, 2));
      const triCircPenalty = Math.exp(
        -Math.pow((circularity - 0.35) / 0.25, 2)
      );
      scores.triangle = triCornerTerm * triFillTerm * triCircPenalty;
      scores.pentagon =
        Math.exp(-Math.pow((corners - 5) / 2, 2)) *
        Math.exp(-Math.pow((fill - 0.5) / 0.4, 2));
      const raw = CLASSES.map((c) => Math.max(1e-5, scores[c.id]));
      const sum = raw.reduce((a, b) => a + b, 0);
      const probs = raw.map((r) => r / sum);
      let bi = 0;
      probs.forEach((p, i) => {
        if (p > probs[bi]) bi = i;
      });
      setHeuristic({ label: CLASSES[bi].id, probs });
    } catch {
      setHeuristic(null);
    }
  }, []);

  const strokeTo = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 14;
      if (drawMode === "draw") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "#06b6d4";
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      }
      ctx.beginPath();
      if (!lastPoint.current) {
        ctx.moveTo(x, y);
      } else {
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      }
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPoint.current = { x, y };
    },
    [drawMode]
  );

  // Synthetic shape generator & pretraining
  useEffect(() => {
    if (!pretraining) return;
    const OFF = document.createElement("canvas");
    OFF.width = CANVAS_SIZE;
    OFF.height = CANVAS_SIZE;
    const ctx = OFF.getContext("2d");
    if (!ctx) return;
    interface Sample {
      x: number[];
      y: number;
    }
    const dataset: Sample[] = [];
    const perClass = 150; // base count per class
    function drawShape(id: string) {
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.save();
      ctx.translate(
        CANVAS_SIZE / 2 + (Math.random() * 70 - 35),
        CANVAS_SIZE / 2 + (Math.random() * 70 - 35)
      );
      const scale = 0.36 + Math.random() * 0.44;
      const angle = ((Math.random() * Math.PI) / 2) * (id === "circle" ? 0 : 1);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.beginPath();
      const R = (CANVAS_SIZE / 2) * 0.9;
      if (id === "circle") {
        ctx.arc(0, 0, R, 0, Math.PI * 2);
      } else if (id === "square") {
        const s = R * 1.32;
        ctx.rect(-s / 2, -s / 2, s, s);
      } else if (id === "triangle") {
        const r = R * 1.22;
        const open = Math.random() < 0.35;
        for (let i = 0; i < 3; i++) {
          const jitter = Math.random() * 0.2 - 0.1;
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3 + jitter;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        if (!open) ctx.closePath();
      } else if (id === "pentagon") {
        const r = R * 1.12;
        for (let i = 0; i < 5; i++) {
          const a =
            -Math.PI / 2 +
            (i * 2 * Math.PI) / 5 +
            (Math.random() * 0.15 - 0.075);
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
      ctx.restore();
      const strokeMode = Math.random() < 0.72;
      if (strokeMode) {
        ctx.lineWidth = 8 + Math.random() * 20;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.stroke();
        if (id === "triangle" && Math.random() < 0.22) {
          ctx.lineWidth += 6;
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fill();
        if (Math.random() < 0.5) {
          ctx.lineWidth = 4 + Math.random() * 10;
          ctx.strokeStyle = "rgba(255,255,255,1)";
          ctx.stroke();
        }
      }
    }
    function poolFeaturesAndGeom(): number[] {
      if (!ctx) return Array(INPUT_SIZE).fill(0);
      const img = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const blockW = CANVAS_SIZE / FEAT_COLS,
        blockH = CANVAS_SIZE / FEAT_ROWS;
      const feats: number[] = [];
      let minX = CANVAS_SIZE,
        minY = CANVAS_SIZE,
        maxX = 0,
        maxY = 0;
      const thr = 28;
      for (let y = 0; y < CANVAS_SIZE; y += 2) {
        for (let x = 0; x < CANVAS_SIZE; x += 2) {
          const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
          if (a > thr) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const bw = Math.max(1, maxX - minX + 1),
        bh = Math.max(1, maxY - minY + 1);
      for (let r = 0; r < FEAT_ROWS; r++) {
        for (let c = 0; c < FEAT_COLS; c++) {
          const sx = Math.floor(c * blockW),
            sy = Math.floor(r * blockH),
            ex = Math.floor((c + 1) * blockW),
            ey = Math.floor((r + 1) * blockH);
          let sum = 0,
            count = 0;
          for (let y = sy; y < ey; y += 2) {
            for (let x = sx; x < ex; x += 2) {
              const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
              sum += a;
              count++;
            }
          }
          feats.push(count ? sum / (count * 255) : 0);
        }
      }
      let inkInBox = 0;
      for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
          const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
          if (a > thr) inkInBox++;
        }
      }
      const aspect = bw / bh;
      const aspectNorm = aspect / (aspect + 1);
      const density = inkInBox / Math.max(1, (bw * bh) / 4);
      let peri = 0;
      const edgePts: { x: number; y: number }[] = [];
      for (let y = minY; y <= maxY; y += 4) {
        for (let x = minX; x <= maxX; x += 4) {
          const a = img.data[(y * CANVAS_SIZE + x) * 4 + 3];
          if (a > thr) {
            const aL = img.data[(y * CANVAS_SIZE + Math.max(0, x - 4)) * 4 + 3];
            const aR =
              img.data[
                (y * CANVAS_SIZE + Math.min(CANVAS_SIZE - 4, x + 4)) * 4 + 3
              ];
            const aU = img.data[(Math.max(0, y - 4) * CANVAS_SIZE + x) * 4 + 3];
            const aD =
              img.data[
                (Math.min(CANVAS_SIZE - 4, y + 4) * CANVAS_SIZE + x) * 4 + 3
              ];
            if (aL <= thr || aR <= thr || aU <= thr || aD <= thr)
              edgePts.push({ x, y });
          }
        }
      }
      for (let i = 1; i < edgePts.length; i++) {
        const dx = edgePts[i].x - edgePts[i - 1].x;
        const dy = edgePts[i].y - edgePts[i - 1].y;
        peri += Math.hypot(dx, dy);
      }
      const circularity = peri ? (4 * Math.PI * inkInBox) / (peri * peri) : 0;
      const step = Math.max(1, Math.floor(edgePts.length / 50));
      let corners = 0;
      const simplified: { x: number; y: number }[] = [];
      for (let i = 0; i < edgePts.length; i += step)
        simplified.push(edgePts[i]);
      for (let i = 2; i < simplified.length; i++) {
        const p0 = simplified[i - 2],
          p1 = simplified[i - 1],
          p2 = simplified[i];
        const v1x = p1.x - p0.x,
          v1y = p1.y - p0.y,
          v2x = p2.x - p1.x,
          v2y = p2.y - p1.y;
        const m1 = Math.hypot(v1x, v1y),
          m2 = Math.hypot(v2x, v2y);
        if (!m1 || !m2) continue;
        const ang = Math.acos(
          Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (m1 * m2)))
        );
        if (ang > Math.PI / 6 && ang < Math.PI - Math.PI / 6) corners++;
      }
      const cornersNorm = Math.min(1, corners / 6);
      const circularityNorm = Math.min(1, circularity);
      const extra = [
        aspectNorm,
        Math.min(1, density),
        circularityNorm,
        cornersNorm,
        Math.min(1, inkInBox / 1000),
      ];
      while (extra.length < EXTRA_GEOM) extra.push(0);
      return [...feats, ...extra].map((v) => +v.toFixed(3));
    }
    const classCounts: number[] = Array(CLASSES.length).fill(0);
    CLASSES.forEach((c, ci) => {
      const extra = c.id === "triangle" ? Math.round(perClass * 0.15) : 0;
      const total = perClass + extra;
      for (let k = 0; k < total; k++) {
        drawShape(c.id);
        const base = poolFeaturesAndGeom();
        const x = base.map((v) =>
          Math.min(1, Math.max(0, v + (Math.random() * 0.06 - 0.03)))
        );
        dataset.push({ x, y: ci });
        classCounts[ci]++;
      }
    });
    // normalization stats
    const mean = Array(INPUT_SIZE).fill(0);
    dataset.forEach((s) => s.x.forEach((v, i) => (mean[i] += v)));
    for (let i = 0; i < INPUT_SIZE; i++) mean[i] /= dataset.length;
    const variance = Array(INPUT_SIZE).fill(0);
    dataset.forEach((s) =>
      s.x.forEach((v, i) => {
        const d = v - mean[i];
        variance[i] += d * d;
      })
    );
    for (let i = 0; i < INPUT_SIZE; i++) variance[i] /= dataset.length;
    const std = variance.map((v) => Math.sqrt(v) + 1e-6);
    const W1l = W1.map((r) => [...r]);
    const b1l = [...b1];
    const W2l = W2.map((r) => [...r]);
    const b2l = [...b2];
    const W3l = W3.map((r) => [...r]);
    const b3l = [...b3];
    const lr = 0.09;
    let e = 0;
    const trainEpoch = () => {
      if (e >= TOTAL_PRE_EPOCHS) {
        setW1(W1l.map((r) => [...r]));
        setB1([...b1l]);
        setW2(W2l.map((r) => [...r]));
        setB2([...b2l]);
        setW3(W3l.map((r) => [...r]));
        setB3([...b3l]);
        setFeatMean(mean);
        setFeatStd(std);
        const total = classCounts.reduce((a, b) => a + b, 0);
        const priors = classCounts.map((c) => c / total || 1e-6);
        setLogPriors(priors.map((p) => Math.log(p)));
        setPretraining(false);
        return;
      }
      const gW1 = Array.from({ length: INPUT_SIZE }, () =>
        Array(HIDDEN1).fill(0)
      );
      const gb1 = Array(HIDDEN1).fill(0);
      const gW2 = Array.from({ length: HIDDEN1 }, () => Array(HIDDEN2).fill(0));
      const gb2 = Array(HIDDEN2).fill(0);
      const gW3 = Array.from({ length: HIDDEN2 }, () =>
        Array(CLASSES.length).fill(0)
      );
      const gb3 = Array(CLASSES.length).fill(0);
      let totalLoss = 0;
      for (const sample of dataset) {
        const x = sample.x.map((v, i) => (v - mean[i]) / std[i]);
        const z1 = Array.from({ length: HIDDEN1 }, (_, j) =>
          x.reduce((a, xi, i) => a + xi * W1l[i][j], b1l[j])
        );
        const h1 = z1.map((v) => (v > 0 ? v : 0));
        const z2 = Array.from({ length: HIDDEN2 }, (_, j) =>
          h1.reduce((a, v, i) => a + v * W2l[i][j], b2l[j])
        );
        const h2 = z2.map((v) => (v > 0 ? v : 0));
        const logits = Array.from({ length: CLASSES.length }, (_, j) =>
          h2.reduce((a, v, i) => a + v * W3l[i][j], b3l[j])
        );
        const m = Math.max(...logits);
        const exps = logits.map((L) => Math.exp(L - m));
        const sumExp = exps.reduce((a, b) => a + b, 0);
        const probs = exps.map((e) => e / sumExp);
        totalLoss += -Math.log(Math.max(1e-9, probs[sample.y]));
        const dLogits = probs.map((p, j) => p - (j === sample.y ? 1 : 0));
        for (let j = 0; j < CLASSES.length; j++) {
          gb3[j] += dLogits[j];
          for (let i = 0; i < HIDDEN2; i++) gW3[i][j] += h2[i] * dLogits[j];
        }
        const dh2 = Array(HIDDEN2).fill(0);
        for (let i = 0; i < HIDDEN2; i++) {
          let s = 0;
          for (let j = 0; j < CLASSES.length; j++) s += dLogits[j] * W3l[i][j];
          dh2[i] = s;
        }
        const dz2 = dh2.map((v, i) => (z2[i] > 0 ? 1 : 0) * v);
        for (let j = 0; j < HIDDEN2; j++) {
          gb2[j] += dz2[j];
          for (let i = 0; i < HIDDEN1; i++) gW2[i][j] += h1[i] * dz2[j];
        }
        const dh1 = Array(HIDDEN1).fill(0);
        for (let i = 0; i < HIDDEN1; i++) {
          let s = 0;
          for (let j = 0; j < HIDDEN2; j++) s += dz2[j] * W2l[i][j];
          dh1[i] = s;
        }
        const dz1 = dh1.map((v, i) => (z1[i] > 0 ? 1 : 0) * v);
        for (let j = 0; j < HIDDEN1; j++) {
          gb1[j] += dz1[j];
          for (let i = 0; i < INPUT_SIZE; i++) gW1[i][j] += x[i] * dz1[j];
        }
      }
      const invN = 1 / dataset.length;
      for (let j = 0; j < HIDDEN1; j++) {
        gb1[j] *= invN;
        for (let i = 0; i < INPUT_SIZE; i++) gW1[i][j] *= invN;
      }
      for (let j = 0; j < HIDDEN2; j++) {
        gb2[j] *= invN;
        for (let i = 0; i < HIDDEN1; i++) gW2[i][j] *= invN;
      }
      for (let j = 0; j < CLASSES.length; j++) {
        gb3[j] *= invN;
        for (let i = 0; i < HIDDEN2; i++) gW3[i][j] *= invN;
      }
      for (let i = 0; i < INPUT_SIZE; i++)
        for (let j = 0; j < HIDDEN1; j++) W1l[i][j] -= lr * gW1[i][j];
      for (let j = 0; j < HIDDEN1; j++) b1l[j] -= lr * gb1[j];
      for (let i = 0; i < HIDDEN1; i++)
        for (let j = 0; j < HIDDEN2; j++) W2l[i][j] -= lr * gW2[i][j];
      for (let j = 0; j < HIDDEN2; j++) b2l[j] -= lr * gb2[j];
      for (let i = 0; i < HIDDEN2; i++)
        for (let j = 0; j < CLASSES.length; j++) W3l[i][j] -= lr * gW3[i][j];
      for (let j = 0; j < CLASSES.length; j++) b3l[j] -= lr * gb3[j];
      setPreLoss(totalLoss / dataset.length);
      setPreEpoch(e + 1);
      e++;
      requestAnimationFrame(trainEpoch);
    };
    requestAnimationFrame(trainEpoch);
  }, [pretraining, W1, W2, W3, b1, b2, b3]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    lastPoint.current = null; // reset
    strokeTo(x, y);
    setIsDrawing(true);
  };
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    strokeTo(x, y);
  };
  const endStroke = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
    updateFeaturesFromCanvas();
    setPendingAuto(true);
  }, [isDrawing, updateFeaturesFromCanvas]);

  // Attach global pointerup to finish stroke
  useEffect(() => {
    window.addEventListener("pointerup", endStroke);
    return () => window.removeEventListener("pointerup", endStroke);
  }, [endStroke]);

  useEffect(() => {
    if (!pendingAuto || !autoTrain || pretraining || !finalProbs) return;
    // Prevent feedback loop if predicted same class (esp triangle) too many times consecutively without user labeling
    if (
      autoTrainMode === "predicted" &&
      predHistory
        .slice(-5)
        .every((i) => i === predHistory[predHistory.length - 1])
    ) {
      setPendingAuto(false);
      return;
    }
    if (!features.some((v) => v > 0.01)) {
      setPendingAuto(false);
      return;
    }
    let targetIdx = -1;
    if (autoTrainMode === "predicted")
      targetIdx = finalProbs.indexOf(Math.max(...finalProbs));
    else targetIdx = CLASSES.findIndex((c) => c.id === autoTrainMode);
    if (targetIdx >= 0) fineTune(targetIdx);
    setPendingAuto(false);
  }, [
    pendingAuto,
    autoTrain,
    autoTrainMode,
    pretraining,
    finalProbs,
    features,
    fineTune,
    predHistory,
  ]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-6 shadow flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold tracking-wide text-cyan-200">
          Neural Network (Shape Classifier)
        </h2>
        <span className="text-[10px] md:text-xs text-indigo-200/60">
          Canvas pooled into 64+5 geom features → 20 → 12 → 4 softmax (synthetic
          pre‑train).
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowMath((s) => !s)}
            className="px-3 py-1 rounded-full text-[11px] bg-white/10 hover:bg-white/15 border border-white/15"
          >
            {showMath ? "Hide Math" : "Show Math"}
          </button>
          <button
            onClick={randomize}
            disabled={pretraining}
            className="px-3 py-1 rounded-full text-[11px] bg-gradient-to-r from-fuchsia-500/60 to-pink-500/60 hover:from-fuchsia-500 hover:to-pink-500 border border-pink-300/30 disabled:opacity-40"
          >
            Randomize Weights
          </button>
          <button
            onClick={() =>
              setDrawMode((m) => (m === "draw" ? "erase" : "draw"))
            }
            className="px-3 py-1 rounded-full text-[11px] bg-white/10 hover:bg-white/15 border border-white/15"
          >
            {drawMode === "draw" ? "Erase" : "Draw"} Mode
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-1 rounded-full text-[11px] bg-white/10 hover:bg-white/15 border border-white/15"
          >
            Clear
          </button>
        </div>
      </div>
      {/* Drawing Grid */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="select-none flex flex-col items-center">
          <div
            className="relative"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              className="touch-none rounded-lg border border-white/10 bg-slate-900 cursor-crosshair"
            />
            {/* Optional overlay showing coarse grid */}
            <div
              className="pointer-events-none absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${FEAT_COLS},1fr)`,
                gridTemplateRows: `repeat(${FEAT_ROWS},1fr)`,
              }}
            >
              {Array.from({ length: INPUT_SIZE }).map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-indigo-200/70 w-full justify-between">
            <span>
              {drawMode === "draw" ? "Drawing" : "Erasing"} • 64 pooled + geom
              features
            </span>
            <span>
              {forward
                ? "Active feats: " + forward.x.filter((v) => v > 0.05).length
                : "No input yet"}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-[320px]">
          {/* Fine-tune controls */}
          <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
            {CLASSES.map((c, i) => (
              <button
                key={c.id}
                disabled={
                  pretraining || isTuning || !features.some((v) => v > 0.01)
                }
                onClick={() => fineTune(i)}
                className="px-2.5 py-1 rounded-md border border-white/15 bg-white/10 hover:bg-white/15 disabled:opacity-40"
              >
                Train as {c.label}
              </button>
            ))}
            <button
              disabled={pretraining || isTuning || userSamples.length === 0}
              onClick={trainUserBatch}
              className="px-2.5 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40"
            >
              Batch Train ({userSamples.length})
            </button>
            <label className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 bg-white/5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-cyan-400"
                checked={autoTrain}
                onChange={(e) => setAutoTrain(e.target.checked)}
              />
              <span>Auto</span>
            </label>
            <select
              disabled={!autoTrain}
              value={autoTrainMode}
              onChange={(e) =>
                setAutoTrainMode(e.target.value as typeof autoTrainMode)
              }
              className="px-2 py-1 rounded-md border border-white/15 bg-white/10 text-[10px] disabled:opacity-40"
            >
              <option value="predicted">predicted label</option>
              <option value="circle">circle</option>
              <option value="square">square</option>
              <option value="triangle">triangle</option>
              <option value="pentagon">pentagon</option>
            </select>
            {autoTrain && !isTuning && pendingAuto && (
              <span className="text-indigo-300/70">auto tuning…</span>
            )}
            {isTuning && (
              <span className="text-indigo-300/70">Updating weights…</span>
            )}
          </div>
          <div className="mb-2 text-[10px] text-indigo-300/70 flex flex-wrap gap-3">
            {CLASSES.map((c, i) => {
              const cnt = userSamples.reduce(
                (a, s) => a + (s.y === i ? 1 : 0),
                0
              );
              return (
                <span key={c.id}>
                  {c.label}: {cnt}
                </span>
              );
            })}
          </div>
          {/* Network Diagram */}
          <div className="relative overflow-x-auto pb-2">
            <svg
              role="img"
              aria-label="Neural network diagram"
              width={740}
              height={400}
              viewBox="0 0 740 400"
              className="max-w-full h-auto"
            >
              <defs>
                <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              {/* Compute scaling for weight visualization */}
              {(() => {
                const maxAbsW2 = Math.max(...W2.flat().map(Math.abs), 0.0001);
                const maxAbsW3 = Math.max(...W3.flat().map(Math.abs), 0.0001);
                const top = 30;
                const span = 340; // vertical layout parameters
                return (
                  <g>
                    {/* Hidden layer 1 */}
                    {Array.from({ length: HIDDEN1 }).map((_, j) => {
                      const x = 160;
                      const y = top + j * (span / (HIDDEN1 - 1));
                      const val = forward ? forward.h1[j] : 0;
                      const max = forward ? Math.max(...forward.h1) || 1 : 1;
                      const intensity = Math.min(1, val / max);
                      return (
                        <g key={`h1-${j}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r={11}
                            fill={`rgba(99,102,241,${0.15 + intensity * 0.85})`}
                            stroke="#6366f1"
                            strokeWidth={1.6}
                          />
                          <text
                            x={x}
                            y={y + 3}
                            fontSize={9}
                            textAnchor="middle"
                            fill="#0f172a"
                            fontFamily="monospace"
                          >
                            {val.toFixed(1)}
                          </text>
                          <title>
                            Hidden1 {j} act {val.toFixed(4)}
                            {"\n"}Incoming weights:{" "}
                            {W1.map((r) => r[j].toFixed(2)).join(", ")}
                          </title>
                        </g>
                      );
                    })}
                    {/* Hidden layer 2 */}
                    {Array.from({ length: HIDDEN2 }).map((_, j) => {
                      const x = 370;
                      const y = top + j * (span / (HIDDEN2 - 1));
                      const val = forward ? forward.h2[j] : 0;
                      const max = forward ? Math.max(...forward.h2) || 1 : 1;
                      const intensity = Math.min(1, val / max);
                      return (
                        <g key={`h2-${j}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r={12}
                            fill={`rgba(236,72,153,${0.15 + intensity * 0.85})`}
                            stroke="#ec4899"
                            strokeWidth={1.8}
                          />
                          <text
                            x={x}
                            y={y + 3}
                            fontSize={9}
                            textAnchor="middle"
                            fill="#0f172a"
                            fontFamily="monospace"
                          >
                            {val.toFixed(1)}
                          </text>
                          <title>
                            Hidden2 {j} act {val.toFixed(4)}
                            {"\n"}Incoming weights:{" "}
                            {W2.map((r) => r[j].toFixed(2)).join(", ")}
                          </title>
                        </g>
                      );
                    })}
                    {/* Output layer */}
                    {CLASSES.map((s, i) => {
                      const x = 600;
                      const y = 70 + i * 80;
                      const probSrc =
                        finalProbs ||
                        blendedProbs ||
                        (forward ? forward.probs : []);
                      const prob = probSrc && probSrc[i] ? probSrc[i] : 0;
                      const highlight =
                        probSrc && prob === Math.max(...probSrc);
                      return (
                        <g key={`out-${s.id}`}>
                          <rect
                            x={x - 22}
                            y={y - 22}
                            width={44}
                            height={44}
                            rx={10}
                            fill={highlight ? s.color : "#1e293b"}
                            stroke={s.color}
                            strokeWidth={highlight ? 3 : 1.5}
                          />
                          <text
                            x={x}
                            y={y + 5}
                            fontSize={16}
                            textAnchor="middle"
                            fontFamily="monospace"
                            fill={highlight ? "#0f172a" : s.color}
                          >
                            {s.icon}
                          </text>
                          {(forward || heuristic) && (
                            <text
                              x={x - 30}
                              y={y - 28}
                              fontSize={9}
                              fontFamily="monospace"
                              fill="#e0f2fe"
                            >
                              {(prob * 100).toFixed(1)}%
                            </text>
                          )}
                          <title>
                            Class {s.label}
                            {"\n"}prob {(prob * 100).toFixed(2)}%
                          </title>
                        </g>
                      );
                    })}
                    {/* Edges: H1 -> H2 */}
                    {Array.from({ length: HIDDEN1 }).flatMap((_, i) =>
                      Array.from({ length: HIDDEN2 }).map((__, j) => {
                        const sx = 171;
                        const sy = top + i * (span / (HIDDEN1 - 1));
                        const tx = 359;
                        const ty = top + j * (span / (HIDDEN2 - 1));
                        const w = W2[i][j];
                        const width = 0.35 + (Math.abs(w) / maxAbsW2) * 2.0;
                        const color = w >= 0 ? "#6366f1" : "#ec4899";
                        const opacity = 0.12 + (Math.abs(w) / maxAbsW2) * 0.78;
                        const active = phase >= 2;
                        return (
                          <line
                            key={`w2-${i}-${j}`}
                            x1={sx}
                            y1={sy}
                            x2={tx}
                            y2={ty}
                            stroke={color}
                            strokeWidth={active ? width : 0.4}
                            strokeOpacity={active ? opacity : 0.04}
                          />
                        );
                      })
                    )}
                    {/* Edges: H2 -> OUT */}
                    {Array.from({ length: HIDDEN2 }).flatMap((_, i) =>
                      CLASSES.map((s, j) => {
                        const sx = 381;
                        const sy = top + i * (span / (HIDDEN2 - 1));
                        const tx = 578;
                        const ty = 70 + j * 80;
                        const w = W3[i][j];
                        const width = 0.4 + (Math.abs(w) / maxAbsW3) * 2.0;
                        const color = w >= 0 ? "#06b6d4" : "#ec4899";
                        const opacity = 0.15 + (Math.abs(w) / maxAbsW3) * 0.8;
                        const active = phase === 3;
                        return (
                          <line
                            key={`w3-${i}-${s.id}`}
                            x1={sx}
                            y1={sy}
                            x2={tx}
                            y2={ty}
                            stroke={color}
                            strokeWidth={active ? width : 0.5}
                            strokeOpacity={active ? opacity : 0.05}
                          />
                        );
                      })
                    )}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-1 text-[11px] md:text-xs">
        <div className="flex justify-between flex-wrap gap-2">
          {pretraining ? (
            <span className="text-indigo-200/70">
              Pre-training shape network... Epoch {preEpoch}/{TOTAL_PRE_EPOCHS}{" "}
              {preLoss !== null && `(loss ${preLoss.toFixed(3)})`}
            </span>
          ) : (
            <span className="text-cyan-200">Model ready.</span>
          )}
          <span className="text-indigo-300/60">
            69→20→12→4 (norm+bbox+geom+fusion)
          </span>
        </div>
        {forward && finalProbs && heuristic && (
          <div className="text-indigo-200/70 flex flex-wrap gap-3">
            <span>
              Net:{" "}
              {CLASSES[forward.probs.indexOf(Math.max(...forward.probs))].label}
            </span>
            <span>
              Heuristic:{" "}
              {
                CLASSES[heuristic.probs.indexOf(Math.max(...heuristic.probs))]
                  .label
              }
            </span>
            <span>
              Final:{" "}
              {CLASSES[finalProbs.indexOf(Math.max(...finalProbs))].label}
            </span>
          </div>
        )}
      </div>
      <Caption phase={phase} hasInput={!!forward} />
      {showMath && forward && (
        <div className="mt-2 grid gap-4 text-[10px] md:text-[11px] leading-relaxed font-mono">
          <div>
            <b className="text-cyan-200">
              Input x (64 pooled + geom features):
            </b>{" "}
            [{forward.x.map((v) => v.toFixed(3)).join(", ")}]
          </div>
          <div className="overflow-auto">
            <b className="text-cyan-200">Layer 1: z1 = x·W1 + b1 → ReLU</b>
            <div className="mt-1">
              h1 = [{forward.h1.map((v) => v.toFixed(3)).join(", ")}]
            </div>
          </div>
          <div className="overflow-auto">
            <b className="text-cyan-200">Layer 2: z2 = h1·W2 + b2 → ReLU</b>
            <div className="mt-1">
              h2 = [{forward.h2.map((v) => v.toFixed(3)).join(", ")}]
            </div>
          </div>
          <div className="overflow-auto">
            <b className="text-cyan-200">
              Output: logits = h2·W3 + b3 → softmax
            </b>
            <div className="mt-1">
              logits = [{forward.logits.map((v) => v.toFixed(3)).join(", ")}]
            </div>
            <div className="mt-1">
              probs = [
              {(finalProbs || blendedProbs || forward.probs)
                .map((v) => v.toFixed(3))
                .join(", ")}
              ]
            </div>
          </div>
          <details className="bg-white/5 border border-white/10 rounded p-2">
            <summary className="cursor-pointer text-cyan-200">
              Show Matrices
            </summary>
            <div className="mt-2 space-y-2">
              <Matrix name="W1" data={W1} />
              <Matrix name="W2" data={W2} />
              <Matrix name="W3" data={W3} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

const Caption: React.FC<{ phase: number; hasInput: boolean }> = ({
  phase,
  hasInput,
}) => {
  if (!hasInput)
    return (
      <p className="text-[11px] text-indigo-200/60">
        Draw on the grid to feed the network.
      </p>
    );
  if (phase === 0)
    return (
      <p className="text-[11px] text-cyan-200/70">Encoding pooled pixels...</p>
    );
  if (phase === 1)
    return (
      <p className="text-[11px] text-cyan-200/70">
        Hidden Layer 1 extracting primitive features.
      </p>
    );
  if (phase === 2)
    return (
      <p className="text-[11px] text-cyan-200/70">
        Hidden Layer 2 composing higher patterns.
      </p>
    );
  return (
    <p className="text-[11px] text-cyan-200/70">
      Output distribution from pre-trained weights.
    </p>
  );
};

export default NeuralNetworkDemo;

// Matrix display helper
const Matrix: React.FC<{ name: string; data: number[][] }> = ({
  name,
  data,
}) => (
  <div className="overflow-auto max-w-full">
    <div className="text-pink-200 font-semibold mb-1">
      {name} ({data.length}×{data[0].length})
    </div>
    <table className="text-[10px] border-collapse">
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((v, j) => (
              <td
                key={j}
                className="px-1 py-[2px] border border-white/10 text-indigo-100/90"
              >
                {v.toFixed(2)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
