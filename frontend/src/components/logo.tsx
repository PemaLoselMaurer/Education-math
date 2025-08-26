"use client";
import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  clickable?: boolean;
  size?: number;
}

export function Logo({
  className = "",
  clickable = true,
  size = 40,
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_6px_rgba(56,189,248,0.55)]"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="planetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="18" fill="url(#planetGlow)">
            <animate
              attributeName="r"
              values="18;19;18"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <g className="origin-center animate-[spin_14s_linear_infinite]">
            <ellipse
              cx="32"
              cy="32"
              rx="30"
              ry="12"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="3"
              strokeOpacity="0.55"
            />
          </g>
          <circle cx="24" cy="26" r="4" fill="white" fillOpacity="0.6" />
          <circle cx="41" cy="38" r="3" fill="#f0f9ff" fillOpacity="0.75" />
        </svg>
        <span className="pointer-events-none absolute inset-0 blur-xl opacity-40 bg-cyan-400/20" />
      </div>
      <span
        className="font-extrabold tracking-tight text-lg md:text-2xl bg-gradient-to-r from-cyan-200 via-indigo-200 to-pink-200 bg-clip-text text-transparent"
        style={{
          textShadow:
            "0 0 14px rgba(165,243,252,0.35),0 0 30px rgba(99,102,241,0.25)",
        }}
      >
        Space<span className="ml-[2px]">Math</span>
      </span>
    </div>
  );

  if (!clickable) return content;
  return (
    <Link href="/" aria-label="Space Math Home" className="group">
      <span className="relative inline-block">
        {content}
        <span className="absolute -inset-2 rounded-xl opacity-0 group-hover:opacity-30 bg-gradient-to-r from-cyan-400/30 via-indigo-500/20 to-fuchsia-400/30 blur-lg transition" />
      </span>
    </Link>
  );
}

export default Logo;
