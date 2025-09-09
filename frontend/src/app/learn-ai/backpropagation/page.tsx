"use client";
import NeuralNetDemo from "./NeuralNetDemo";
import "katex/dist/katex.min.css";
import katex from "katex";
import Link from "next/link";

function K({
  tex,
  block = false,
  size = "text-lg",
}: {
  tex: string;
  block?: boolean;
  size?: string;
}) {
  return (
    <span
      className={`katex-math ${block ? "block my-2" : "inline"} ${size}`}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          throwOnError: false,
          displayMode: block,
        }),
      }}
    />
  );
}

// Static backpropagation diagram (simple, can be improved)
function BackpropDiagram() {
  return (
    <div className="flex justify-center my-6">
      <svg
        width={640}
        height={360}
        viewBox="0 0 640 360"
        className="max-w-full h-auto rounded-2xl shadow-[0_2px_16px_rgba(59,7,100,0.15)] bg-transparent"
      >
        <text x="320" y="40" textAnchor="middle" fontSize="24" fill="#fff">
          Backpropagation
        </text>
        <text x="320" y="80" textAnchor="middle" fontSize="16" fill="#fff">
          (Error flows backward, weights update)
        </text>
        <line
          x1="500"
          y1="200"
          x2="320"
          y2="150"
          stroke="#f87171"
          strokeWidth="4"
          markerEnd="url(#arrow)"
        />
        <line
          x1="320"
          y1="150"
          x2="120"
          y2="150"
          stroke="#f87171"
          strokeWidth="4"
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
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#f87171" />
          </marker>
        </defs>
        <circle
          cx="120"
          cy="150"
          r="32"
          fill="#7dd3fc"
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx="320"
          cy="150"
          r="36"
          fill="#a7f3d0"
          stroke="#fff"
          strokeWidth="2"
        />
        <circle
          cx="500"
          cy="200"
          r="40"
          fill="#fbbf24"
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
          Input
        </text>
        <text
          x="320"
          y="155"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          Hidden
        </text>
        <text
          x="500"
          y="205"
          textAnchor="middle"
          fill="#0a0a0a"
          fontWeight="600"
        >
          Output
        </text>
        <text x="320" y="250" textAnchor="middle" fill="#f87171" fontSize="14">
          Error signal
        </text>
      </svg>
    </div>
  );
}

export default function BackpropagationPage() {
  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(59,7,100,0.45),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-transparent/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-yellow-300 via-pink-200 to-cyan-300 bg-clip-text text-transparent">
          Unit 4: Backpropagation
        </h1>
        <Link
          href="/learn-ai"
          className="text-sm text-cyan-200 hover:underline ml-auto"
        >
          ← Learn AI
        </Link>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-12">
        {/* Full Backpropagation Notes (from GeeksforGeeks) */}
        <section className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-yellow-500/10 via-fuchsia-500/10 to-pink-500/10 blur-xl pointer-events-none" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-6 md:px-12 py-10 flex flex-col gap-8 overflow-hidden shadow-lg shadow-yellow-500/10">
            <div className="flex flex-col gap-8 items-start">
              <div className="prose prose-invert max-w-none text-yellow-100/90 w-full">
                <>
                  <p>
                    <b>Forward Pass</b> and <b>Backward Pass</b> in
                    backpropagation:
                  </p>
                  <div className="flex flex-col items-center my-2">
                    <svg
                      width="320"
                      height="80"
                      viewBox="0 0 320 80"
                      className="mb-2"
                    >
                      <line
                        x1="40"
                        y1="40"
                        x2="280"
                        y2="40"
                        stroke="#38bdf8"
                        strokeWidth="6"
                        markerEnd="url(#arrow-fwd)"
                      />
                      <line
                        x1="280"
                        y1="60"
                        x2="40"
                        y2="60"
                        stroke="#f87171"
                        strokeWidth="6"
                        markerEnd="url(#arrow-bwd)"
                      />
                      <defs>
                        <marker
                          id="arrow-fwd"
                          markerWidth="8"
                          markerHeight="8"
                          refX="4"
                          refY="4"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#38bdf8" />
                        </marker>
                        <marker
                          id="arrow-bwd"
                          markerWidth="8"
                          markerHeight="8"
                          refX="4"
                          refY="4"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#f87171" />
                        </marker>
                      </defs>
                      <text x="60" y="32" fontSize="13" fill="#38bdf8">
                        Forward Pass
                      </text>
                      <text x="200" y="75" fontSize="13" fill="#f87171">
                        Backward Pass (Error)
                      </text>
                    </svg>
                    <span className="text-xs text-yellow-300/80">
                      Forward pass computes output, backward pass propagates
                      error.
                    </span>
                  </div>
                </>
                {/* ...existing notes content between the two diagrams... */}
                {/* Chain Rule/Neuron Diagram Inline - moved out of <p> to avoid invalid nesting */}
                <>
                  <p>
                    <b>Chain Rule</b> in backpropagation:
                  </p>
                  <div className="flex flex-col items-center my-2">
                    <svg width="320" height="100" viewBox="0 0 320 100">
                      <circle
                        cx="60"
                        cy="50"
                        r="18"
                        fill="#7dd3fc"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <text
                        x="60"
                        y="55"
                        textAnchor="middle"
                        fontSize="13"
                        fill="#0a0a0a"
                      >
                        x
                      </text>
                      <rect
                        x="120"
                        y="30"
                        width="60"
                        height="40"
                        rx="10"
                        fill="#a7f3d0"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <text
                        x="150"
                        y="55"
                        textAnchor="middle"
                        fontSize="13"
                        fill="#0a0a0a"
                      >
                        Neuron
                      </text>
                      <circle
                        cx="240"
                        cy="50"
                        r="18"
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <text
                        x="240"
                        y="55"
                        textAnchor="middle"
                        fontSize="13"
                        fill="#0a0a0a"
                      >
                        ŷ
                      </text>
                      <line
                        x1="78"
                        y1="50"
                        x2="120"
                        y2="50"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        markerEnd="url(#arrow-n1)"
                      />
                      <line
                        x1="180"
                        y1="50"
                        x2="222"
                        y2="50"
                        stroke="#fbbf24"
                        strokeWidth="3"
                        markerEnd="url(#arrow-n2)"
                      />
                      <defs>
                        <marker
                          id="arrow-n1"
                          markerWidth="8"
                          markerHeight="8"
                          refX="4"
                          refY="4"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#38bdf8" />
                        </marker>
                        <marker
                          id="arrow-n2"
                          markerWidth="8"
                          markerHeight="8"
                          refX="4"
                          refY="4"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#fbbf24" />
                        </marker>
                      </defs>
                      {/* Chain Rule equation moved below for KaTeX rendering */}
                    </svg>
                    <div className="mt-2 flex flex-col items-center">
                      <K
                        tex={
                          "\\text{Chain Rule: } \\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}"
                        }
                        block
                        size="text-2xl"
                      />
                      <span className="text-sm text-yellow-300/80 mt-1">
                        Each neuron&apos;s weight update uses the chain rule.
                      </span>
                    </div>
                  </div>
                </>
                {/* ...rest of existing notes content... */}
                <h3 className="mt-0 mb-2 text-xl font-bold text-yellow-200">
                  What is Backpropagation?
                </h3>
                <p>
                  Backpropagation is a supervised learning algorithm used for
                  training artificial neural networks. It efficiently computes
                  the gradient of the loss function with respect to each weight
                  by applying the chain rule, allowing the network to update its
                  weights and biases to minimize error.
                </p>
                <h3 className="mt-6 mb-2 text-xl font-bold text-yellow-200">
                  Why do we need Backpropagation?
                </h3>
                <ul className="mb-4 list-disc pl-5">
                  <li>
                    Enables neural networks to learn from data by minimizing the
                    loss function.
                  </li>
                  <li>
                    Allows for efficient computation of gradients, making deep
                    learning practical.
                  </li>
                  <li>
                    Without backpropagation, training deep networks would be
                    computationally infeasible.
                  </li>
                </ul>
                <h3 className="mt-6 mb-2 text-xl font-bold text-yellow-200">
                  How does Backpropagation work?
                </h3>
                <ol className="mb-4 list-decimal pl-5">
                  <li>
                    <b>Forward Pass:</b> Input data is passed through the
                    network to generate an output.
                  </li>
                  <li>
                    <b>Loss Calculation:</b> The difference between the
                    predicted output and the actual target is computed using a
                    loss function (e.g., Mean Squared Error).
                  </li>
                  <li>
                    <b>Backward Pass:</b> The error is propagated backward
                    through the network. The gradient of the loss with respect
                    to each weight is calculated using the chain rule.
                  </li>
                  <li>
                    <b>Weight Update:</b> Weights and biases are updated using
                    gradient descent:{" "}
                    <K tex={"w = w - \\eta \\frac{\\partial L}{\\partial w}"} />
                    ,{" "}
                    <K tex={"b = b - \\eta \\frac{\\partial L}{\\partial b}"} />
                  </li>
                </ol>
                <h3 className="mt-6 mb-2 text-xl font-bold text-yellow-200">
                  Mathematical Derivation
                </h3>
                <ul className="mb-4 list-disc pl-5">
                  <li>
                    Let <K tex={"L"} /> be the loss function, <K tex={"w"} />{" "}
                    the weights, <K tex={"y"} /> the true output, and{" "}
                    <K tex={"\\hat{y}"} /> the predicted output.
                  </li>
                  <li>
                    The goal is to minimize <K tex={"L(y, \\hat{y})"} /> by
                    adjusting <K tex={"w"} /> and <K tex={"b"} />.
                  </li>
                  <li>
                    Using the chain rule, we compute the partial derivatives of
                    the loss with respect to each parameter.
                  </li>
                  <li>
                    For a neuron: <K tex={"z = w \\cdot x + b"} />,{" "}
                    <K tex={"a = f(z)"} />, where <K tex={"f"} /> is the
                    activation function.
                  </li>
                  <li>
                    The gradient for each weight:{" "}
                    <K
                      tex={
                        "\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a} \\cdot \\frac{\\partial a}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}"
                      }
                    />
                  </li>
                </ul>
                <h3 className="mt-6 mb-2 text-xl font-bold text-yellow-200">
                  Step-by-Step Example
                </h3>
                <ol className="mb-4 list-decimal pl-5">
                  <li>Initialize weights and biases randomly.</li>
                  <li>
                    For each training example:
                    <ul className="list-disc pl-5">
                      <li>Perform a forward pass to compute the output.</li>
                      <li>Compute the loss.</li>
                      <li>Perform a backward pass to compute gradients.</li>
                      <li>Update weights and biases using the gradients.</li>
                    </ul>
                  </li>
                </ol>
                <h3 className="mt-6 mb-2 text-xl font-bold text-yellow-200">
                  Key Points
                </h3>
                <ul className="mb-4 list-disc pl-5">
                  <li>
                    Backpropagation uses the chain rule to efficiently compute
                    gradients in multi-layer networks.
                  </li>
                  <li>
                    It is the foundation of training deep neural networks.
                  </li>
                  <li>
                    Learning rate (η) controls how much weights are updated at
                    each step.
                  </li>
                  <li>
                    Proper initialization and choice of activation/loss
                    functions are important for effective learning.
                  </li>
                </ul>
                <h3 className="mt-6 mb-2 text-xl font-bold text-yellow-200">
                  Summary
                </h3>
                <ul className="mb-4 list-disc pl-5">
                  <li>
                    Backpropagation is essential for training neural networks.
                  </li>
                  <li>
                    It allows the network to learn from mistakes by adjusting
                    weights to minimize loss.
                  </li>
                  <li>
                    It is widely used in deep learning and forms the basis of
                    modern AI systems.
                  </li>
                </ul>
                <div className="mt-4">
                  <span className="text-[13px] text-yellow-300/80">
                    Source:{" "}
                    <a
                      href="https://www.geeksforgeeks.org/machine-learning/backpropagation-in-neural-network/"
                      target="_blank"
                      rel="noopener"
                      className="underline text-yellow-200"
                    >
                      GeeksforGeeks Backpropagation Guide
                    </a>
                  </span>
                </div>
              </div>
            </div>
            {/* --- Diagrams Section (moved to end, with better spacing) --- */}
            <div className="mt-12 flex flex-col gap-8 items-center w-full">
              {/* Example: Backpropagation diagram */}
              <BackpropDiagram />
              {/* Add more diagrams here if needed, each separated by gap-8 */}
            </div>
          </div>
        </section>

        {/* Interactive Backpropagation Demo */}
        <section className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-900/10 via-pink-900/10 to-cyan-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-200 to-cyan-200 bg-clip-text text-transparent">
            Interactive Backpropagation
          </h2>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-yellow-900/20 border border-yellow-300/20">
              <h3 className="text-sm font-semibold text-yellow-200 tracking-wide">
                Neural Network Backpropagation Demo
              </h3>
              {/* 1 input, 2 hidden, 1 output, all linear for clarity */}
              <NeuralNetDemo />
            </div>
          </div>
        </section>

        {/* Glossary Section */}
        <section className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-900/10 via-cyan-900/10 to-pink-900/10 p-6 md:p-8 shadow-lg backdrop-blur-md space-y-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-200 via-cyan-200 to-pink-200 bg-clip-text text-transparent">
            Key Terms Explained Simply
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-yellow-100/85 text-[15px]">
            <li>
              <b>Backpropagation:</b> The process of sending error backward
              through the network to update weights.
            </li>
            <li>
              <b>Gradient:</b> A number that tells us how much a weight should
              change to reduce error.
            </li>
            <li>
              <b>Learning Rate (η):</b> How big a step we take when updating
              weights.
            </li>
            <li>
              <b>Loss Function:</b> A way to measure how wrong the network’s
              answer is.
            </li>
            <li>
              <b>Chain Rule:</b> A math rule from calculus that helps us compute
              gradients through layers.
            </li>
            <li>
              <b>Epoch:</b> One full pass through the training data.
            </li>
            <li>
              <b>Weight Update:</b> Changing the weights to make the network
              better at its task.
            </li>
            <li>
              <b>Forward Pass:</b> Calculating the output with current weights.
            </li>
            <li>
              <b>Backward Pass:</b> Calculating how to change the weights to
              reduce error.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
