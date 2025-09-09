"use client";
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Real-time network visualization version
const MnistNetworkDemo = dynamic(() => import("./MnistNetworkDemo"), {
  ssr: false,
});

export default function MnistPage() {
  return (
    <div className="min-h-screen w-full flex flex-col font-quicksand text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(8,145,178,0.35),rgba(24,26,42,0)_70%)] pointer-events-none" />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-transparent/30 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
          MNIST Demo
        </h1>
        <Link
          href="/learn-ai"
          className="text-sm text-indigo-200 hover:underline ml-auto"
        >
          Learn AI
        </Link>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
        <MnistNetworkDemo />
        <section className="text-[11px] md:text-xs leading-relaxed text-indigo-100/70 bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-cyan-200 font-semibold mb-2 text-sm">About</h2>
          <p>
            This demo uses weights exported from the PyTorch MLP you trained in{" "}
            <code className="px-1 bg-white/10 rounded">
              mnist/mnist_pytorch.py
            </code>
            . You draw digits on a 280×280 canvas which is downsampled to 28×28
            grayscale and normalized using the dataset mean/std. The forward
            pass runs fully in the browser (no server) with the three linear
            layers.
          </p>
          <h3 className="mt-3 font-semibold text-indigo-200 text-xs">
            Updating Weights
          </h3>
          <ol className="list-decimal pl-4 space-y-1 mt-1">
            <li>Retrain or improve the model (e.g. more epochs or a CNN).</li>
            <li>
              Run the export script:{" "}
              <code className="px-1 bg-white/10 rounded">
                python mnist/export_mnist_weights.py
              </code>
            </li>
            <li>
              Reload this page (it fetches{" "}
              <code className="px-1 bg-white/10 rounded">/mnist_mlp.json</code>
              ).
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
