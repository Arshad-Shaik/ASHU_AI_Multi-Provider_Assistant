// frontend/components/terminal/ProviderStatusBar.tsx
"use client";

import { memo, useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TerminalTheme, ProviderStatus, AIProvider } from "@/types";
import { getProviderStatus } from "@/lib/api/client";
import { useTheme } from "@/hooks/useTheme";

const Z_TOOLTIP = 60;
const POLL_INTERVAL_MS = 30000;
const DISCO_COLORS = ["#00ff88", "#00ffff", "#b400ff", "#ff0088", "#ffaa00", "#00ff88"];
const DISCO_TIMES = [0, 0.2, 0.4, 0.6, 0.8, 1];
const DOT_UNAVAILABLE_COLOR = "rgba(255,68,68,1)";
const DOT_HALF_OPEN_COLOR = "rgba(255,170,0,1)";
const BULLET = "\u2022";
const DIAMOND = "\u25c6";

const KNOWN_PROVIDERS: AIProvider[] = [
  "gemini", "groq", "openai", "grok", "mistral", "claude",
  "cerebras", "openrouter", "cohere", "huggingface", "cloudflare",
  "together", "deepseek",
];

interface ProviderStatusBarProps {
  theme?: TerminalTheme;
  currentProvider?: string;
  isAuthenticated?: boolean;
}

interface ThemeStyle {
  border: string;
  glow: string;
  bg: string;
  text: string;
}

interface ThemeStylePair {
  dark: ThemeStyle;
  light: ThemeStyle;
}

function resolveMode(raw: string): "dark" | "light" {
  return raw === "light" ? "light" : "dark";
}

const THEME_STYLES: Record<TerminalTheme, ThemeStylePair> = {
  matrix: {
    dark: { border: "#00ff8822", glow: "#00ff88", bg: "rgba(0,8,0,0.95)", text: "#00ff88" },
    light: { border: "#046b3a33", glow: "#046b3a", bg: "rgba(230,250,240,0.95)", text: "#046b3a" },
  },
  cyberpunk: {
    dark: { border: "#ff008822", glow: "#ff0088", bg: "rgba(8,0,4,0.95)", text: "#ff0088" },
    light: { border: "#99005c33", glow: "#99005c", bg: "rgba(255,235,245,0.95)", text: "#99005c" },
  },
  holographic: {
    dark: { border: "#00ffff22", glow: "#00ffff", bg: "rgba(0,4,8,0.95)", text: "#00ffff" },
    light: { border: "#00667733", glow: "#006677", bg: "rgba(230,250,255,0.95)", text: "#006677" },
  },
  neon: {
    dark: { border: "#b400ff22", glow: "#b400ff", bg: "rgba(4,0,8,0.95)", text: "#b400ff" },
    light: { border: "#6a00b333", glow: "#6a00b3", bg: "rgba(245,235,255,0.95)", text: "#6a00b3" },
  },
  cyber: {
    dark: { border: "#0088ff22", glow: "#0088ff", bg: "rgba(0,2,8,0.95)", text: "#0088ff" },
    light: { border: "#004a9933", glow: "#004a99", bg: "rgba(230,240,255,0.95)", text: "#004a99" },
  },
  plasma: {
    dark: { border: "#ff440022", glow: "#ff4400", bg: "rgba(8,2,0,0.95)", text: "#ff4400" },
    light: { border: "#b32d0033", glow: "#b32d00", bg: "rgba(255,240,230,0.95)", text: "#b32d00" },
  },
  aurora: {
    dark: { border: "#00ffcc22", glow: "#00ffcc", bg: "rgba(0,8,6,0.95)", text: "#00ffcc" },
    light: { border: "#007a6633", glow: "#007a66", bg: "rgba(230,255,250,0.95)", text: "#007a66" },
  },
  inferno: {
    dark: { border: "#ff880022", glow: "#ff8800", bg: "rgba(8,4,0,0.95)", text: "#ff8800" },
    light: { border: "#b35f0033", glow: "#b35f00", bg: "rgba(255,245,230,0.95)", text: "#b35f00" },
  },
  ghost: {
    dark: { border: "#aaaaff22", glow: "#aaaaff", bg: "rgba(2,2,8,0.95)", text: "#aaaaff" },
    light: { border: "#4c4c9933", glow: "#4c4c99", bg: "rgba(240,240,255,0.95)", text: "#4c4c99" },
  },
  crimson: {
    dark: { border: "#ff224422", glow: "#ff2244", bg: "rgba(8,0,2,0.95)", text: "#ff2244" },
    light: { border: "#99001a33", glow: "#99001a", bg: "rgba(255,230,235,0.95)", text: "#99001a" },
  },
};

const PROVIDER_META: Record<
  AIProvider,
  { label: string; shortLabel: string; tinyLabel: string; color: string; model: string }
> = {
  gemini: { label: "Google Gemini", shortLabel: "GEMINI", tinyLabel: "GEM", color: "#4285f4", model: "gemini-flash-latest" },
  groq: { label: "Groq", shortLabel: "GROQ", tinyLabel: "GRQ", color: "#f55036", model: "llama-3.3-70b-versatile" },
  openai: { label: "OpenAI", shortLabel: "GPT", tinyLabel: "GPT", color: "#10a37f", model: "gpt-4o-mini" },
  grok: { label: "xAI Grok", shortLabel: "GROK", tinyLabel: "GRK", color: "#1da1f2", model: "grok-beta" },
  mistral: { label: "Mistral", shortLabel: "MSTRL", tinyLabel: "MST", color: "#ff7000", model: "mistral-large-latest" },
  claude: { label: "Anthropic Claude", shortLabel: "CLAUDE", tinyLabel: "CLD", color: "#cc785c", model: "claude-haiku-4-5" },
  cerebras: { label: "Cerebras", shortLabel: "CBRS", tinyLabel: "CBR", color: "#00d4aa", model: "gpt-oss-120b" },
  openrouter: { label: "OpenRouter", shortLabel: "OR", tinyLabel: "OR", color: "#6366f1", model: "mistral-small-3.2-24b" },
  cohere: { label: "Cohere", shortLabel: "COHERE", tinyLabel: "COH", color: "#39594d", model: "command-a-03-2025" },
  huggingface: { label: "HuggingFace", shortLabel: "HF", tinyLabel: "HF", color: "#ff9d00", model: "llama-3.1-8b-instruct" },
  cloudflare: { label: "Cloudflare AI", shortLabel: "CF", tinyLabel: "CF", color: "#f48120", model: "llama-3-8b" },
  together: { label: "Together AI", shortLabel: "TGTR", tinyLabel: "TGT", color: "#0f6cbd", model: "mixtral-8x7b" },
  deepseek: { label: "DeepSeek", shortLabel: "DSK", tinyLabel: "DSK", color: "#4d6bfe", model: "deepseek-chat" },
  unknown: { label: "Unknown", shortLabel: "UNK", tinyLabel: "UNK", color: "#666666", model: "unknown" },
};

function getProviderMeta(name: string) {
  return (
    PROVIDER_META[name as AIProvider] ?? {
      label: name.toUpperCase(),
      shortLabel: name.toUpperCase().slice(0, 5),
      tinyLabel: name.toUpperCase().slice(0, 3),
      color: "#00ff88",
      model: "",
    }
  );
}

function mergeWithKnownProviders(backendList: ProviderStatus[]): ProviderStatus[] {
  const backendMap = new Map<string, ProviderStatus>();
  for (const item of backendList) {
    backendMap.set(item.provider_name, item);
  }
  return KNOWN_PROVIDERS.map((providerName) => {
    const existing = backendMap.get(providerName);
    if (existing) return existing;
    return {
      provider_name: providerName,
      is_available: false,
      circuit_state: "open" as const,
      failure_count: 0,
      last_failure_time: null,
      recovery_time: null,
      total_requests: 0,
      total_failures: 0,
      average_latency_ms: 0,
    };
  });
}

function useDeviceTier(): "mobile" | "tablet" | "desktop" {
  const [tier, setTier] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setTier("mobile");
      else if (w < 1024) setTier("tablet");
      else setTier("desktop");
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  return tier;
}

interface ProviderDotProps {
  status: ProviderStatus;
  isActive: boolean;
  deviceTier: "mobile" | "tablet" | "desktop";
}

const ProviderDot = memo(function ProviderDot({
  status,
  isActive,
  deviceTier,
}: ProviderDotProps) {
  const meta = getProviderMeta(status.provider_name);
  const isOk = status.is_available && status.circuit_state === "closed";
  const isHalf = status.circuit_state === "half-open";
  const dotColor = isOk ? meta.color : isHalf ? DOT_HALF_OPEN_COLOR : DOT_UNAVAILABLE_COLOR;
  const latencyText =
    (status.average_latency_ms ?? 0) > 0 ? `${BULLET} ${Math.round(status.average_latency_ms ?? 0)}ms` : "";
  const circuitLabel = (status.circuit_state ?? "closed").toUpperCase();

  const displayLabel =
    deviceTier === "mobile"
      ? meta.tinyLabel
      : deviceTier === "tablet"
      ? meta.shortLabel
      : meta.shortLabel;

  const dotSize = deviceTier === "mobile" ? "w-1.5 h-1.5" : "w-1.5 h-1.5";
  const fontSize = deviceTier === "mobile" ? "7px" : "9px";
  const px = deviceTier === "mobile" ? "px-1 py-0.5" : "px-1.5 py-0.5";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.2 }}
      tabIndex={0}
      className={`relative group flex items-center gap-1 ${px} rounded cursor-default shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-white/50`}
      style={{
        border: `1px solid ${isActive ? dotColor : `${dotColor}33`}`,
        background: isActive ? `${dotColor}0d` : "transparent",
        willChange: "transform, opacity",
      }}
      aria-label={`${meta.label}: ${isOk ? "available" : "unavailable"}, ${circuitLabel}${latencyText.length > 0 ? `, ${latencyText}` : ""}`}
    >
      {isActive ? (
        <motion.div
          animate={{ backgroundColor: DISCO_COLORS }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "linear",
            times: DISCO_TIMES,
          }}
          className={`${dotSize} rounded-full shrink-0`}
          style={{ boxShadow: `0 0 6px ${dotColor}`, willChange: "background-color" }}
        />
      ) : (
        <div
          className={`${dotSize} rounded-full shrink-0`}
          style={{ background: dotColor, opacity: isOk ? 0.85 : 0.45 }}
        />
      )}

      <span
        className="font-mono shrink-0 leading-none"
        style={{ color: `${dotColor}cc`, fontSize }}
      >
        {displayLabel}
      </span>

      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 rounded font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-150"
        style={{
          background: "rgba(0,0,0,0.96)",
          border: `1px solid ${dotColor}44`,
          color: dotColor,
          fontSize: "10px",
          zIndex: Z_TOOLTIP,
          boxShadow: `0 4px 16px rgba(0,0,0,0.8), 0 0 8px ${dotColor}22`,
        }}
      >
        <span className="font-bold">{meta.label}</span>
        {meta.model.length > 0 && (
          <span className="opacity-70">
            {" "}{BULLET} {meta.model}
          </span>
        )}
        <span>
          {" "}{BULLET} {circuitLabel}
        </span>
        {latencyText.length > 0 && (
          <span className="opacity-70"> {latencyText}</span>
        )}
      </div>
    </motion.div>
  );
});

interface ActiveProviderBadgeProps {
  meta: { label: string; shortLabel: string; tinyLabel: string; color: string; model: string };
  deviceTier: "mobile" | "tablet" | "desktop";
}

const ActiveProviderBadge = memo(function ActiveProviderBadge({
  meta,
  deviceTier,
}: ActiveProviderBadgeProps) {
  const label = deviceTier === "mobile" ? meta.tinyLabel : meta.shortLabel;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Active provider: ${meta.label}`}
      className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded"
      style={{
        border: `1px solid ${meta.color}55`,
        background: `${meta.color}11`,
      }}
    >
      <motion.div
        animate={{ backgroundColor: DISCO_COLORS }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "linear",
          times: DISCO_TIMES,
        }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ boxShadow: `0 0 6px ${meta.color}`, willChange: "background-color" }}
      />
      <span
        className="font-mono shrink-0 leading-none"
        style={{ color: meta.color, fontSize: deviceTier === "mobile" ? "7px" : "9px" }}
      >
        {label} {DIAMOND} LIVE
      </span>
    </div>
  );
});

function ProviderStatusBarInner({
  theme = "matrix",
  currentProvider,
  isAuthenticated = false,
}: ProviderStatusBarProps) {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const { resolvedMode } = useTheme();
  const mode = resolveMode(resolvedMode);
  const s = THEME_STYLES[theme][mode];
  const deviceTier = useDeviceTier();
  const currentMeta = currentProvider ? getProviderMeta(currentProvider) : null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchStatuses = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    getProviderStatus()
      .then((data) => {
        if (!isMountedRef.current) return;
        const merged = mergeWithKnownProviders(
          Array.isArray(data) ? (data as ProviderStatus[]) : [],
        );
        setStatuses(merged);
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setStatuses(mergeWithKnownProviders([]));
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchStatuses();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStatuses]);

  if (!isAuthenticated) return null;

  const available = statuses.filter((p) => p.is_available).length;
  const total = statuses.length;

  return (
    <div
      className="w-full shrink-0"
      style={{
        background: s.bg,
        borderTop: `1px solid ${s.border}`,
      }}
      role="region"
      aria-label="AI provider status bar"
    >
      <div className="flex items-center gap-x-1.5 gap-y-1 px-2 py-1.5 w-full min-w-0">
        <span
          className="font-mono shrink-0 leading-none"
          style={{
            color: `${s.text}66`,
            fontSize: deviceTier === "mobile" ? "7px" : "9px",
          }}
        >
          {deviceTier === "mobile" ? "AI" : "PROVIDERS"}
        </span>

        {currentMeta && (
          <ActiveProviderBadge meta={currentMeta} deviceTier={deviceTier} />
        )}

        <div
          className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          aria-label="All provider status indicators"
        >
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.span
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="font-mono shrink-0"
                style={{ color: `${s.text}44`, fontSize: "9px" }}
              >
                scanning...
              </motion.span>
            ) : (
              statuses.map((status) => (
                <ProviderDot
                  key={status.provider_name}
                  status={status}
                  isActive={status.provider_name === currentProvider}
                  deviceTier={deviceTier}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {!isLoading && total > 0 && (
          <span
            className="font-mono shrink-0 leading-none"
            style={{
              color: `${s.text}66`,
              fontSize: deviceTier === "mobile" ? "7px" : "9px",
            }}
            aria-label={`${available} of ${total} providers available`}
          >
            {available}/{total}
          </span>
        )}
      </div>
    </div>
  );
}
export default memo(ProviderStatusBarInner);