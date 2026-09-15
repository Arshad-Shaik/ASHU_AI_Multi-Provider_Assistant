// frontend/components/ui/ProviderBadge.tsx
"use client";

import { useState, memo } from "react";
import { motion } from "framer-motion";
import { AIProvider, ProviderStatus, TerminalTheme } from "@/types";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

interface ProviderMeta {
  label: string;
  color: string;
  glowColor: string;
  bgColor: string;
  borderColor: string;
}

interface ProviderBadgeProps {
  provider?: string;
  status?: ProviderStatus;
  theme?: TerminalTheme;
  showLatency?: boolean;
  size?: "sm" | "md" | "lg";
}

const THEME_COLORS: Record<TerminalTheme, string> = {
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

const PROVIDER_META: Partial<Record<AIProvider, ProviderMeta>> = {
  gemini: { label: "Gemini", color: "#4285f4", glowColor: "#4285f444", bgColor: "#4285f411", borderColor: "#4285f433" },
  groq: { label: "Groq", color: "#f55036", glowColor: "#f5503644", bgColor: "#f5503611", borderColor: "#f5503633" },
  openai: { label: "GPT", color: "#10a37f", glowColor: "#10a37f44", bgColor: "#10a37f11", borderColor: "#10a37f33" },
  grok: { label: "Grok", color: "#1da1f2", glowColor: "#1da1f244", bgColor: "#1da1f211", borderColor: "#1da1f233" },
  mistral: { label: "Mistral", color: "#ff7000", glowColor: "#ff700044", bgColor: "#ff700011", borderColor: "#ff700033" },
  claude: { label: "Claude", color: "#cc785c", glowColor: "#cc785c44", bgColor: "#cc785c11", borderColor: "#cc785c33" },
  cerebras: { label: "Cerebras", color: "#00d4aa", glowColor: "#00d4aa44", bgColor: "#00d4aa11", borderColor: "#00d4aa33" },
  openrouter: { label: "OpenRouter", color: "#6366f1", glowColor: "#6366f144", bgColor: "#6366f111", borderColor: "#6366f133" },
  cohere: { label: "Cohere", color: "#39594d", glowColor: "#39594d44", bgColor: "#39594d11", borderColor: "#39594d33" },
  huggingface: { label: "HuggingFace", color: "#ff9d00", glowColor: "#ff9d0044", bgColor: "#ff9d0011", borderColor: "#ff9d0033" },
  cloudflare: { label: "Cloudflare", color: "#f48120", glowColor: "#f4812044", bgColor: "#f4812011", borderColor: "#f4812033" },
  together: { label: "Together", color: "#0f6cbd", glowColor: "#0f6cbd44", bgColor: "#0f6cbd11", borderColor: "#0f6cbd33" },
  deepseek: { label: "DeepSeek", color: "#4d6bfe", glowColor: "#4d6bfe44", bgColor: "#4d6bfe11", borderColor: "#4d6bfe33" },
};

const FALLBACK_META: ProviderMeta = {
  label: "Unknown",
  color: "#666666",
  glowColor: "#66666644",
  bgColor: "#66666611",
  borderColor: "#66666633",
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-3 py-1.5",
};

const DOT_SIZES: Record<"sm" | "md" | "lg", string> = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
};

function isKnownProvider(value: string): value is AIProvider {
  return Object.prototype.hasOwnProperty.call(PROVIDER_META, value);
}

function buildFallbackMeta(name: string, theme: TerminalTheme): ProviderMeta {
  const themeColor = THEME_COLORS[theme];
  return {
    label: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    color: themeColor,
    glowColor: `${themeColor}44`,
    bgColor: `${themeColor}11`,
    borderColor: `${themeColor}33`,
  };
}

function resolveProviderMeta(
  name: string,
  theme: TerminalTheme
): ProviderMeta {
  if (isKnownProvider(name)) {
    return PROVIDER_META[name] ?? buildFallbackMeta(name, theme);
  }
  if (name === "unknown" || name === "") return FALLBACK_META;
  return buildFallbackMeta(name, theme);
}

function resolveDotColor(
  isAvailable: boolean,
  circuitState: string,
  activeColor: string
): string {
  if (!isAvailable) return "#ff4444";
  if (circuitState === "open") return "#ff4444";
  if (circuitState === "half_open") return "#ffaa00";
  return activeColor;
}

function ProviderBadgeInner({
  provider,
  status,
  theme = "matrix",
  showLatency = false,
  size = "md",
}: ProviderBadgeProps) {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useIsomorphicLayoutEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const name = provider ?? status?.provider_name ?? "unknown";
  const meta = resolveProviderMeta(name, theme);
  const isAvailable = status?.is_available ?? true;
  const circuitState = status?.circuit_state ?? "closed";
  const latency = status?.average_latency_ms ?? 0;

  const dotColor = resolveDotColor(isAvailable, circuitState, meta.color);
  const latencyLabel = showLatency && latency > 0 ? `${Math.round(latency)}ms` : null;
  const dotClass = DOT_SIZES[size];
  const sizeClass = SIZE_CLASSES[size];

  const ariaLabel = [
    `Provider: ${meta.label}`,
    latencyLabel ? `latency ${latencyLabel}` : null,
    `status ${isAvailable ? "available" : "unavailable"}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative inline-flex" aria-label={ariaLabel}>
      <div
        className="absolute inset-0 rounded pointer-events-none"
        style={{ boxShadow: `0 0 8px ${meta.glowColor}` }}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`relative inline-flex items-center gap-1.5 rounded font-mono font-bold ${sizeClass}`}
        style={{
          background: meta.bgColor,
          border: `1px solid ${meta.borderColor}`,
          color: meta.color,
          willChange: "transform, opacity",
        }}
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className={`${dotClass} rounded-full`}
            style={{ background: dotColor }}
            aria-hidden="true"
          />
          {!reducedMotion && (
            <motion.div
              className={`absolute ${dotClass} rounded-full`}
              style={{ background: dotColor, willChange: "transform, opacity" }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          )}
        </div>

        <span className="leading-none">{meta.label}</span>

        {latencyLabel !== null && (
          <span
            className="opacity-70 leading-none"
            style={{ fontSize: "9px" }}
            aria-hidden="true"
          >
            {latencyLabel}
          </span>
        )}
      </motion.div>
    </div>
  );
}

export default memo(ProviderBadgeInner);