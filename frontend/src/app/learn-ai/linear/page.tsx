"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";

/*
  Linear Models Playground
  - Teaches: linear function y = mx + b, vector form y = w·x + b, mean squared error, gradients.
  - Interactive: generate synthetic points (1D -> 2D scatter), adjust slope & intercept, run gradient descent.
  - Extension notes for multiple features & logistic regression.
*/

interface Point {
  x: number;
  y: number;
}

// ...existing code...

// ...existing code...

// ...existing code...

// Data for kid-friendly syllabus modules
interface ModuleItem {
  id: number;
  title: string;
  bullets: string[];
  activity: string;
  theme: string; // tailwind color accents
  notes: string[];
}

// Interactive Activity for Module 4: Drag points, see best-fit line
const BestFitActivity: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([
    { x: -0.7, y: -0.5 },
    { x: -0.2, y: 0.1 },
    { x: 0.3, y: 0.5 },
    { x: 0.7, y: 0.2 },
  ]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Simple least squares fit
  function fitLine(pts: Point[]) {
    const n = pts.length;
    if (n === 0) return { m: 0, b: 0 };
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    for (const p of pts) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    return { m, b };
  }
  const { m, b } = fitLine(points);

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
    setPoints((pts: Point[]) =>
      pts.map((p: Point, i: number) => (i === dragIdx ? { x, y } : p))
    );
  }

  // SVG helpers
  const toX = (x: number) => 40 + ((x + 1) / 2) * 320;
  const toY = (y: number) => 200 - ((y + 1) / 2) * 160;

  return (
    <div className="rounded-xl bg-indigo-900/10 border border-indigo-400/30 p-4 mb-2">
      <div className="mb-2 text-[13px] text-indigo-100/90">
        Drag the dots! The line moves to fit the points. Try making a pattern
        and see how the line follows.
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 400 230"
        className="w-full h-[230px] select-none cursor-pointer"
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
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
        {/* Points */}
        {points.map((p: Point, i: number) => (
          <circle
            key={i}
            cx={toX(p.x)}
            cy={toY(p.y)}
            r={10}
            fill="#fbbf24"
            stroke="#fff"
            strokeWidth={dragIdx === i ? 3 : 1}
            style={{ cursor: "grab" }}
            onPointerDown={() => handlePointerDown(i)}
          />
        ))}
        {/* Best fit line */}
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
              strokeWidth={4}
              strokeLinecap="round"
            />
          );
        })()}
      </svg>
      <div className="mt-2 text-[12px] text-indigo-200/80">
        Current line:{" "}
        <span className="text-cyan-200">
          y = {m.toFixed(2)}x + {b.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// Interactive Activity for Module 5: Drag line to classify apples/bananas
const ClassifyActivity: React.FC = () => {
  // Two groups: apples (red circles), bananas (yellow rectangles)
  const [lineX, setLineX] = useState(0.0); // vertical line position
  const items = [
    { x: -0.7, y: 0.3, type: "apple" },
    { x: -0.5, y: -0.2, type: "apple" },
    { x: 0.5, y: 0.2, type: "banana" },
    { x: 0.7, y: -0.3, type: "banana" },
  ];
  const toX = (x: number) => 40 + ((x + 1) / 2) * 320;
  const toY = (y: number) => 200 - ((y + 1) / 2) * 160;

  return (
    <div className="rounded-xl bg-violet-900/10 border border-violet-400/30 p-4 mb-2">
      <div className="mb-2 text-[13px] text-violet-100/90">
        Drag the blue line left or right! Apples go on one side, bananas on the
        other. Try to separate them.
      </div>
      <div className="flex gap-2 items-center mb-2">
        <span className="text-[12px] text-violet-200">Line position:</span>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={lineX}
          onChange={(e) => setLineX(parseFloat(e.target.value))}
          className="w-32"
        />
        <span className="text-violet-200">{lineX.toFixed(2)}</span>
      </div>
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
        {/* Items */}
        {items.map((item, i) =>
          item.type === "apple" ? (
            <circle
              key={i}
              cx={toX(item.x)}
              cy={toY(item.y)}
              r={12}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={2}
            />
          ) : (
            <rect
              key={i}
              x={toX(item.x) - 10}
              y={toY(item.y) - 8}
              width={20}
              height={16}
              rx={6}
              fill="#fde047"
              stroke="#fff"
              strokeWidth={2}
            />
          )
        )}
        {/* Decision boundary line */}
        <line
          x1={toX(lineX)}
          y1={40}
          x2={toX(lineX)}
          y2={200}
          stroke="#38bdf8"
          strokeWidth={5}
          strokeDasharray="6 4"
        />
      </svg>
      <div className="mt-2 text-[12px] text-violet-200">
        Apples left of the line, bananas right!
      </div>
    </div>
  );
};

// Kid-friendly interactive linear model demo
const LinearModelDemo: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([
    { x: -0.8, y: -0.6 },
    { x: -0.3, y: 0.2 },
    { x: 0.2, y: 0.7 },
    { x: 0.7, y: 0.1 },
  ]);
  const [m, setM] = useState(0.5);
  const [b, setB] = useState(0.0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
    setPoints((pts: Point[]) =>
      pts.map((p: Point, i: number) => (i === dragIdx ? { x, y } : p))
    );
  }

  // Fit score (average distance from line)
  function fitScore() {
    let sum = 0;
    for (const p of points) {
      const pred = m * p.x + b;
      sum += Math.abs(pred - p.y);
    }
    return (sum / points.length).toFixed(2);
  }

  // SVG helpers
  const toX = (x: number) => 40 + ((x + 1) / 2) * 320;
  const toY = (y: number) => 200 - ((y + 1) / 2) * 160;

  return (
    <div className="rounded-xl bg-cyan-900/10 border border-cyan-400/30 p-4">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <svg
          ref={svgRef}
          viewBox="0 0 400 230"
          className="w-full h-[230px] select-none cursor-pointer"
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          {/* Axes */}
          <line
            x1={40}
            y1={200}
            x2={360}
            y2={200}
            stroke="#fff2"
            strokeWidth={1}
          />
          <line
            x1={40}
            y1={40}
            x2={40}
            y2={200}
            stroke="#fff2"
            strokeWidth={1}
          />
          {/* Points */}
          {points.map((p: Point, i: number) => (
            <circle
              key={i}
              cx={toX(p.x)}
              cy={toY(p.y)}
              r={12}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={dragIdx === i ? 4 : 2}
              style={{ cursor: "grab" }}
              onPointerDown={() => handlePointerDown(i)}
            />
          ))}
          {/* Fit line */}
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
                strokeWidth={6}
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
            Fit Score: <span className="text-cyan-100">{fitScore()}</span>
          </div>
          <div className="text-[13px] text-cyan-100">
            Lower score means the line is closer to all the points!
          </div>
        </div>
      </div>
    </div>
  );
};

const MODULES: ModuleItem[] = [
  {
    id: 1,
    title: "Introduction to AI",
    bullets: [
      "What is AI? (Siri, YouTube, game opponents)",
      "AI in daily life: games, chatbots, cars",
      "Human vs machine intelligence",
    ],
    activity: "Spot AI around you – list examples on a board.",
    theme: "cyan",
    notes: [
      "AI stands for Artificial Intelligence.",
      "Computers learn from lots of examples and use patterns to make guesses.",
      "AI helps people by suggesting, sorting, or answering questions.",
      "It is not magic or a person—it’s a smart tool that finds patterns in data.",
    ],
  },
  {
    id: 2,
    title: "Machines & Learning",
    bullets: [
      "Computers follow instructions (algorithms)",
      "What does 'learning' mean?",
      "Data is food for AI",
    ],
    activity: "Compare a calculator to an AI guessing game.",
    theme: "emerald",
    notes: [
      "Machines learn by changing their answers when they make mistakes.",
      "Learning from feedback means trying again and improving each time.",
      "More good examples help computers make smarter guesses.",
    ],
  },
  {
    id: 3,
    title: "Linear Thinking",
    bullets: [
      "What does linear mean?",
      "Cause & effect (rain → umbrella)",
      "Rules vs learning",
    ],
    activity: "Build an if–then decision tree chatbot.",
    theme: "pink",
    notes: [
      "Linear means changing in a straight, steady way.",
      "Growing taller by the same amount each year is a linear change.",
      "Computers use linear models to find simple rules and make predictions.",
    ],
  },
  {
    id: 4,
    title: "Line of Best Fit",
    bullets: [
      "Numbers & patterns",
      "Line through dots (best fit)",
      "Predict new values",
    ],
    activity: "Plot points & draw a prediction line.",
    theme: "indigo",
    notes: [
      "A line of best fit is a straight line that goes close to many points on a graph.",
      "It helps us see patterns and make predictions about the future.",
      "For example, it can show how you’re growing and help guess your height next year.",
    ],
  },
  {
    id: 5,
    title: "Linear AI in Action",
    bullets: [
      "Spam vs not spam",
      "Game move scoring",
      "Lane following (stay centered)",
    ],
    activity: "Classify fruits: round=apple, long=banana.",
    theme: "violet",
    notes: [
      "Linear AI helps sort things into groups using a line or boundary.",
      "The computer learns where to put the line to tell things apart.",
      "It can separate apples from bananas, or spam from not spam in emails.",
    ],
  },
  {
    id: 6,
    title: "Mini Projects",
    bullets: [
      "Rule-based chatbot",
      "Study hours → test score predictor",
      "Cat vs dog sorting",
    ],
    activity: "Quiz: AI or Not AI?",
    theme: "amber",
    notes: [
      "Mini projects help you practice what you’ve learned.",
      "You can build a chatbot or a program that predicts scores from study time.",
      "More examples make your project better at making predictions.",
    ],
  },
  {
    id: 7,
    title: "Future & Ethics",
    bullets: [
      "AI makes mistakes",
      "Humans bring creativity & values",
      "Safe & questioning mindset",
    ],
    activity: "Debate: Can AI be my friend?",
    theme: "rose",
    notes: [
      "AI is a tool that helps people, but it can make mistakes.",
      "Humans bring creativity and make sure AI is used safely and fairly.",
      "We need to ask questions and think about how AI affects everyone.",
    ],
  },
];

const themeRing: Record<string, string> = {
  cyan: "focus:ring-cyan-400/50 border-cyan-400/30",
  emerald: "focus:ring-emerald-400/50 border-emerald-400/30",
  pink: "focus:ring-pink-400/50 border-pink-400/30",
  indigo: "focus:ring-indigo-400/50 border-indigo-400/30",
  violet: "focus:ring-violet-400/50 border-violet-400/30",
  amber: "focus:ring-amber-400/50 border-amber-400/30",
  rose: "focus:ring-rose-400/50 border-rose-400/30",
};

const ModuleList: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(1);
  return (
    <div className="space-y-4">
      {MODULES.map((m) => {
        const open = openId === m.id;
        return (
          <div
            key={m.id}
            className={`rounded-2xl border bg-white/[0.03] backdrop-blur-xl px-4 md:px-6 py-4 transition-shadow ${
              themeRing[m.theme] || "border-white/15"
            } shadow shadow-black/20`}
          >
            <button
              onClick={() => setOpenId(open ? null : m.id)}
              className="w-full flex items-center justify-between text-left group focus:outline-none"
            >
              <span className="font-semibold tracking-wide text-sm md:text-base bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent flex items-center gap-2">
                <span className="text-[11px] px-2 py-[2px] rounded-full bg-white/10 border border-white/15">
                  {m.id}
                </span>
                {m.title}
              </span>
              <span className="text-xs text-indigo-200/70 group-hover:text-indigo-100 transition">
                {open ? "Hide" : "View"}
              </span>
            </button>
            <div
              className="grid overflow-hidden transition-all"
              style={{
                gridTemplateRows: open ? "1fr" : "0fr",
              }}
            >
              <div className="min-h-0">
                {open && (
                  <div className="pt-4 pb-1 flex flex-col gap-3 text-[13px] text-indigo-100/80">
                    <ul className="list-disc pl-5 space-y-1">
                      {m.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    {/* Interactive activities for modules 4 and 5 */}
                    {m.id === 4 && <BestFitActivity />}
                    {m.id === 5 && <ClassifyActivity />}
                    {m.notes?.length > 0 && (
                      <div className="mt-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-3 backdrop-blur-sm shadow-inner shadow-black/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] uppercase tracking-wide font-semibold text-indigo-200/80 flex items-center gap-1">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-cyan-200"
                            >
                              <rect x="3" y="7" width="18" height="13" rx="2" />
                              <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                            </svg>
                            Teaching
                          </span>
                          <span className="text-[10px] text-indigo-300/60">
                            Guidance & explanation
                          </span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[12.5px] leading-snug text-indigo-100/85">
                          {m.notes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-[12px] flex items-start gap-2">
                      <span className="text-cyan-300">★</span>
                      <span>
                        <span className="font-semibold text-cyan-200">
                          Activity:
                        </span>{" "}
                        {m.activity}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function LinearModelsPage() {
  // ...existing code...

  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_20%,rgba(14,165,233,0.25),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-emerald-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
          Linear Models
        </h1>
        <Link
          href="/learn-ai"
          className="text-sm text-cyan-200 hover:underline ml-auto"
        >
          ← Learn AI
        </Link>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-10">
        {/* Syllabus Navigation & Modules */}
        <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/20 via-indigo-900/20 to-pink-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <header className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-200 via-pink-200 to-emerald-200 bg-clip-text text-transparent">
              Linear AI for Kids – Guided Journey
            </h2>
            <p className="text-indigo-100/80 text-sm md:text-base max-w-3xl">
              Learn how computers spot patterns and make simple predictions
              using straight lines. Explore each module below. Click a module to
              expand. Do the activity before moving on!
            </p>
          </header>
          {/* Module list (collapsible) */}
          <ModuleList />
        </section>
        <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-10 shadow shadow-emerald-500/10">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent">
            Try a Linear Model!
          </h2>
          <div className="mb-2 text-indigo-100/90 text-[15px]">
            Drag the dots or use the sliders to move the line. See how close you
            can get the line to all the points!
          </div>
          <LinearModelDemo />
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl space-y-4 text-[12px] leading-relaxed text-indigo-100/70">
          <h3 className="text-cyan-200 font-semibold text-sm tracking-wide">
            Key Takeaways
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Linear = weighted sum + bias (a plane / line / hyperplane).</li>
            <li>
              Training minimizes loss; gradients tell us how to adjust
              parameters.
            </li>
            <li>Learning rate too high: diverges; too low: slow.</li>
            <li>
              Noise prevents perfect fit; aim for generalization, not zero loss.
            </li>
            <li>Neural networks stack linear transforms + nonlinearities.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
