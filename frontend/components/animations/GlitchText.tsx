// frontend/components/animations/GlitchText.tsx
"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import type { CSSProperties } from "react";
import { TerminalTheme } from "@/types";

type PerformanceTier = "low" | "mid" | "high";

interface GlitchThemeColor {
  primary: string;
  secondary: string;
  tertiary: string;
  shadow: string;
}

interface GlitchTextProps {
  text: string;
  theme?: TerminalTheme;
  tier?: PerformanceTier;
  className?: string;
  intensity?: number;
  style?: CSSProperties;
}

const THEME_COLORS: Record<TerminalTheme, GlitchThemeColor> = {
  matrix: { primary: "#00ff88", secondary: "#00cc66", tertiary: "#009944", shadow: "#00ff8866" },
  cyberpunk: { primary: "#ff0088", secondary: "#ff44aa", tertiary: "#cc0066", shadow: "#ff008866" },
  holographic: { primary: "#00ffff", secondary: "#44ddff", tertiary: "#0099cc", shadow: "#00ffff66" },
  neon: { primary: "#b400ff", secondary: "#cc44ff", tertiary: "#8800cc", shadow: "#b400ff66" },
  cyber: { primary: "#0088ff", secondary: "#44aaff", tertiary: "#0055cc", shadow: "#0088ff66" },
  plasma: { primary: "#ff4400", secondary: "#ff6633", tertiary: "#cc3300", shadow: "#ff440066" },
  aurora: { primary: "#00ffcc", secondary: "#33ffdd", tertiary: "#00ccaa", shadow: "#00ffcc66" },
  inferno: { primary: "#ff8800", secondary: "#ffaa33", tertiary: "#cc6600", shadow: "#ff880066" },
  ghost: { primary: "#aaaaff", secondary: "#ccccff", tertiary: "#8888cc", shadow: "#aaaaff66" },
  crimson: { primary: "#ff2244", secondary: "#ff4466", tertiary: "#cc1133", shadow: "#ff224466" },
};

const TIER_INTERVAL_MS: Record<PerformanceTier, number> = { low: 0, mid: 6000, high: 4000 };
const TIER_DURATION_MS: Record<PerformanceTier, number> = { low: 0, mid: 260, high: 380 };

function GlitchText({ text, theme = "matrix", tier = "high", className = "", intensity = 0.3, style }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scheduleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = useMemo(() => THEME_COLORS[theme], [theme]);
  const animationName = useMemo(() => `glitch-${theme}-${tier}`, [theme, tier]);
  const jitter = useMemo(() => Math.max(1, Math.round(intensity * 6)), [intensity]);
  const enableEffect = tier !== "low" && !reducedMotion;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!enableEffect) return;
    const scheduleNext = () => {
      const delay = TIER_INTERVAL_MS[tier] + Math.random() * TIER_INTERVAL_MS[tier];
      scheduleTimeoutRef.current = setTimeout(() => {
        setIsGlitching(true);
        resetTimeoutRef.current = setTimeout(() => setIsGlitching(false), TIER_DURATION_MS[tier]);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (scheduleTimeoutRef.current) clearTimeout(scheduleTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [enableEffect, tier]);

  const showLayers = enableEffect && isGlitching;

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        color: colors.primary,
        textShadow: `0 0 8px ${colors.shadow}`,
        fontFamily: "inherit",
        ...style,
      }}
    >
      {text}
      {enableEffect ? (
        <style>{`
          @keyframes ${animationName}-a {
            0% { transform: translate(0, 0); opacity: 0.85; }
            50% { transform: translate(-${jitter}px, ${jitter}px); opacity: 0.5; }
            100% { transform: translate(0, 0); opacity: 0; }
          }
          @keyframes ${animationName}-b {
            0% { transform: translate(0, 0); opacity: 0.85; }
            50% { transform: translate(${jitter}px, -${jitter}px); opacity: 0.5; }
            100% { transform: translate(0, 0); opacity: 0; }
          }
        `}</style>
      ) : null}
      {showLayers ? (
        <>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              color: colors.secondary,
              mixBlendMode: "screen",
              willChange: "transform, opacity",
              animation: `${animationName}-a ${TIER_DURATION_MS[tier]}ms ease-out`,
              pointerEvents: "none",
            }}
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              color: colors.tertiary,
              mixBlendMode: "screen",
              willChange: "transform, opacity",
              animation: `${animationName}-b ${TIER_DURATION_MS[tier]}ms ease-out`,
              pointerEvents: "none",
            }}
          >
            {text}
          </span>
        </>
      ) : null}
    </span>
  );
}

export default memo(GlitchText);