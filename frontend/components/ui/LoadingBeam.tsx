// frontend/components/ui/LoadingBeam.tsx
"use client";

import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { TerminalTheme, AIProvider } from "@/types";

interface LoadingBeamProps {
  theme?: TerminalTheme;
  provider?: string;
}

interface BeamColor {
  primary: string;
  secondary: string;
  glow: string;
}

const THEME_COLORS: Record<TerminalTheme, BeamColor> = {
  matrix: { primary: "#00ff88", secondary: "#00cc66", glow: "#00ff8866" },
  cyberpunk: { primary: "#ff0088", secondary: "#cc0066", glow: "#ff008866" },
  holographic: { primary: "#00ffff", secondary: "#0099cc", glow: "#00ffff66" },
  neon: { primary: "#b400ff", secondary: "#8800cc", glow: "#b400ff66" },
  cyber: { primary: "#0088ff", secondary: "#0055cc", glow: "#0088ff66" },
  plasma: { primary: "#ff4400", secondary: "#cc3300", glow: "#ff440066" },
  aurora: { primary: "#00ffcc", secondary: "#00ccaa", glow: "#00ffcc66" },
  inferno: { primary: "#ff8800", secondary: "#cc6600", glow: "#ff880066" },
  ghost: { primary: "#aaaaff", secondary: "#8888cc", glow: "#aaaaff66" },
  crimson: { primary: "#ff2244", secondary: "#cc1133", glow: "#ff224466" },
};

const PROVIDER_COLORS: Partial<Record<AIProvider, BeamColor>> = {
  gemini: { primary: "#4285f4", secondary: "#1a73e8", glow: "#4285f466" },
  groq: { primary: "#f55036", secondary: "#d32f2f", glow: "#f5503666" },
  openai: { primary: "#10a37f", secondary: "#0d8a6a", glow: "#10a37f66" },
  grok: { primary: "#1da1f2", secondary: "#0d8ecf", glow: "#1da1f266" },
  mistral: { primary: "#ff7000", secondary: "#cc5a00", glow: "#ff700066" },
  claude: { primary: "#cc785c", secondary: "#a85e44", glow: "#cc785c66" },
  cerebras: { primary: "#00d4aa", secondary: "#00aa88", glow: "#00d4aa66" },
  openrouter: { primary: "#6366f1", secondary: "#4f46e5", glow: "#6366f166" },
  cohere: { primary: "#39594d", secondary: "#2d4a40", glow: "#39594d66" },
  huggingface: { primary: "#ff9d00", secondary: "#cc7d00", glow: "#ff9d0066" },
  cloudflare: { primary: "#f48120", secondary: "#c26510", glow: "#f4812066" },
  together: { primary: "#0f6cbd", secondary: "#0a5299", glow: "#0f6cbd66" },
  deepseek: { primary: "#4d6bfe", secondary: "#3a52d4", glow: "#4d6bfe66" },
};

function isKnownProvider(value: string): value is AIProvider {
  return Object.prototype.hasOwnProperty.call(PROVIDER_COLORS, value);
}

function LoadingBeamInner({ theme = "matrix", provider }: LoadingBeamProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handleChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const providerColors =
    provider && isKnownProvider(provider)
      ? PROVIDER_COLORS[provider]
      : undefined;
  const c = providerColors ?? THEME_COLORS[theme];

  if (reducedMotion) {
    return (
      <div
        className="relative h-0.5 shrink-0 overflow-hidden"
        style={{ background: `${c.primary}22` }}
        role="progressbar"
        aria-label="AI response loading"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: c.primary, willChange: "opacity" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative h-0.5 shrink-0 overflow-hidden"
      style={{ background: `${c.primary}18` }}
      role="progressbar"
      aria-label="AI response loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${c.glow} 0%, transparent 70%)`,
        }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute h-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.primary}cc, ${c.primary}, ${c.secondary}, transparent)`,
          width: "35%",
          willChange: "transform",
        }}
        animate={{ x: ["-100%", "390%"] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 0.1,
        }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute h-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.secondary}88, ${c.primary}66, transparent)`,
          width: "20%",
          willChange: "transform",
        }}
        animate={{ x: ["-100%", "600%"] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
          repeatDelay: 0.1,
        }}
      />
    </div>
  );
}

export default memo(LoadingBeamInner);