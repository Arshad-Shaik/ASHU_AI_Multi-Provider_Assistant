// frontend/components/animations/ScanlineEffect.tsx
"use client";

import { memo } from "react";
import { TerminalTheme, DeviceTier } from "@/types";

export interface ScanlineEffectProps {
  theme?: TerminalTheme;
  tier?: DeviceTier;
  opacity?: number;
}

const THEME_SCANLINE_COLORS: Record<TerminalTheme, string> = {
  matrix: "#00ff88",
  cyberpunk: "#ff0088",
  holographic: "#00ffff",
  neon: "#b400ff",
  cyber: "#0088ff",
  plasma: "#ff4400",
  aurora: "#00ffcc",
  inferno: "#ff8800",
  ghost: "#aaaaff",
  crimson: "#ff2244",
};

const TIER_SWEEP_DURATION: Record<Exclude<DeviceTier, "low">, number> = {
  mid: 5,
  high: 3,
};

const TIER_LINE_OPACITY: Record<Exclude<DeviceTier, "low">, number> = {
  mid: 0.6,
  high: 1,
};

function ScanlineEffect({ theme = "matrix", tier = "high", opacity = 1 }: ScanlineEffectProps) {
  if (tier === "low") return null;

  const color = THEME_SCANLINE_COLORS[theme];
  const sweepDuration = TIER_SWEEP_DURATION[tier];
  const lineOpacity = TIER_LINE_OPACITY[tier];
  const animationName = `ashu-scanline-sweep-${theme}-${tier}`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ${animationName} {
          0% { transform: translateY(-20%); }
          100% { transform: translateY(120%); }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: opacity * lineOpacity,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}06 2px, ${color}06 4px)`,
          backgroundSize: "100% 4px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "18%",
          background: `linear-gradient(180deg, transparent 0%, ${color}14 45%, ${color}22 50%, ${color}14 55%, transparent 100%)`,
          opacity,
          animation: `${animationName} ${sweepDuration}s linear infinite`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
export default memo(ScanlineEffect);