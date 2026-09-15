// frontend/components/panels/AnalyticsDashboard.tsx
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommandType,
  TerminalTheme,
  AnalyticsDashboard as AnalyticsDashboardType,
  ProviderStatus,
  AnalyticsPeriod,
} from "@/types";
import { getAnalytics, getProviderStatus } from "@/lib/api/client";
import { useTheme } from "@/hooks/useTheme";

interface AnalyticsDashboardProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  theme?: TerminalTheme;
}

interface DualColor {
  dark: string;
  light: string;
}

interface ThemeInk {
  primary: string;
  secondary: string;
  bg: string;
  border: string;
}

interface ThemeInkPair {
  dark: ThemeInk;
  light: ThemeInk;
}

const THEME_INK: Record<TerminalTheme, ThemeInkPair> = {
  matrix: { dark: { primary: "#00ff88", secondary: "#00cc66", bg: "#000800", border: "#00ff8833" }, light: { primary: "#046b3a", secondary: "#035c30", bg: "#eef8f2", border: "#046b3a33" } },
  cyberpunk: { dark: { primary: "#ff0088", secondary: "#cc0066", bg: "#080004", border: "#ff008833" }, light: { primary: "#99005c", secondary: "#7a004a", bg: "#fff0f7", border: "#99005c33" } },
  holographic: { dark: { primary: "#00ffff", secondary: "#0099cc", bg: "#000408", border: "#00ffff33" }, light: { primary: "#006677", secondary: "#00505c", bg: "#eafcff", border: "#00667733" } },
  neon: { dark: { primary: "#b400ff", secondary: "#8800cc", bg: "#040008", border: "#b400ff33" }, light: { primary: "#6a00b3", secondary: "#55008f", bg: "#f7eeff", border: "#6a00b333" } },
  cyber: { dark: { primary: "#0088ff", secondary: "#0055cc", bg: "#000208", border: "#0088ff33" }, light: { primary: "#004a99", secondary: "#003b7a", bg: "#eef4ff", border: "#004a9933" } },
  plasma: { dark: { primary: "#ff4400", secondary: "#cc3300", bg: "#080200", border: "#ff440033" }, light: { primary: "#b32d00", secondary: "#8f2400", bg: "#fff3ec", border: "#b32d0033" } },
  aurora: { dark: { primary: "#00ffcc", secondary: "#00ccaa", bg: "#000807", border: "#00ffcc33" }, light: { primary: "#007a66", secondary: "#006352", bg: "#eafff9", border: "#007a6633" } },
  inferno: { dark: { primary: "#ff8800", secondary: "#cc6600", bg: "#080400", border: "#ff880033" }, light: { primary: "#b35f00", secondary: "#8f4c00", bg: "#fff6ec", border: "#b35f0033" } },
  ghost: { dark: { primary: "#aaaaff", secondary: "#8888cc", bg: "#020208", border: "#aaaaff33" }, light: { primary: "#4c4c99", secondary: "#3d3d7a", bg: "#f1f1fb", border: "#4c4c9933" } },
  crimson: { dark: { primary: "#ff2244", secondary: "#cc1133", bg: "#080002", border: "#ff224433" }, light: { primary: "#99001a", secondary: "#7a0015", bg: "#fff0f2", border: "#99001a33" } },
};

const COMMAND_LABELS: Record<CommandType, string> = {
  "@": "Expert Mode",
  "$": "Code Analysis",
  "#": "Memory Save",
  "*": "Regenerate",
  "\u2731": "Regenerate",
  "default": "Plain Chat",
  "slash": "Slash Command",
};

const COMMAND_COLORS: Record<CommandType, DualColor> = {
  "@": { dark: "#00ff88", light: "#046b3a" },
  "$": { dark: "#0088ff", light: "#004a99" },
  "#": { dark: "#ff8800", light: "#b35f00" },
  "*": { dark: "#b400ff", light: "#6a00b3" },
  "\u2731": { dark: "#b400ff", light: "#6a00b3" },
  "default": { dark: "#00ffff", light: "#006677" },
  "slash": { dark: "#ff0088", light: "#99005c" },
};

const PROVIDER_COLORS: DualColor[] = [
  { dark: "#00ff88", light: "#046b3a" },
  { dark: "#0088ff", light: "#004a99" },
  { dark: "#b400ff", light: "#6a00b3" },
  { dark: "#ff8800", light: "#b35f00" },
  { dark: "#00ffff", light: "#006677" },
  { dark: "#ff0088", light: "#99005c" },
  { dark: "#ffff00", light: "#998f00" },
  { dark: "#88ff00", light: "#4c9900" },
  { dark: "#ff4400", light: "#b32d00" },
  { dark: "#00ff44", light: "#046b24" },
  { dark: "#4400ff", light: "#2b0099" },
  { dark: "#ff00ff", light: "#99009c" },
  { dark: "#00ffcc", light: "#007a66" },
];

const FALLBACK_COLOR: DualColor = { dark: "#00ffff", light: "#006677" };

const STAT_COLORS: Record<string, DualColor> = {
  totalRequests: { dark: "#00ff88", light: "#046b3a" },
  totalTokens: { dark: "#0088ff", light: "#004a99" },
  avgLatency: { dark: "#b400ff", light: "#6a00b3" },
  providersActive: { dark: "#ff8800", light: "#b35f00" },
};

const SECTION_COLORS: Record<string, DualColor> = {
  commands: { dark: "#00ff88", light: "#046b3a" },
  providers: { dark: "#0088ff", light: "#004a99" },
};

const STATUS_COLORS: Record<string, DualColor> = {
  available: { dark: "#00ff88", light: "#046b3a" },
  unavailable: { dark: "rgba(255,68,68,1)", light: "rgba(179,0,0,1)" },
};

const ERROR_COLOR: DualColor = {
  dark: "rgba(255,102,102,1)",
  light: "rgba(179,0,0,1)",
};
const ERROR_BORDER: DualColor = {
  dark: "rgba(255,68,68,0.2)",
  light: "rgba(179,0,0,0.2)",
};

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "24H", value: "1d" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

function resolveMode(raw: string): "dark" | "light" {
  return raw === "light" ? "light" : "dark";
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  suffix?: string;
}

function StatCard({ label, value, color, suffix = "" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded border p-3 overflow-hidden"
      style={{
        borderColor: `${color}33`,
        background: `${color}08`,
        willChange: "transform, opacity",
      }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `linear-gradient(135deg, ${color}, transparent)`,
        }}
      />
      <p
        className="text-xs font-mono mb-1"
        style={{ color: `${color}99` }}
      >
        {label}
      </p>
      <p className="text-xl font-bold font-mono" style={{ color }}>
        {value}
        {suffix}
      </p>
    </motion.div>
  );
}

interface BarChartProps {
  data: Record<string, number>;
  colors: string[];
  total: number;
  labelMap?: Record<string, string>;
}

function BarChart({ data, colors, total, labelMap }: BarChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return (
      <p
        className="text-xs font-mono text-center py-4"
        style={{ color: `${colors[0] ?? "#888888"}44` }}
      >
        No data yet
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map(([key, count], idx) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = colors[idx % colors.length] ?? "#888888";
        const displayLabel = labelMap?.[key] ?? key;
        return (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span
                className="text-xs font-mono truncate"
                style={{ color: `${color}cc` }}
              >
                {displayLabel}
              </span>
              <span
                className="text-xs font-mono ml-2"
                style={{ color }}
              >
                {count} ({pct}%)
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: `${color}22` }}
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: color,
                  width: "100%",
                  transformOrigin: "left",
                  willChange: "transform",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ProviderStatusGridProps {
  providers: ProviderStatus[];
  mode: "dark" | "light";
}

function ProviderStatusGrid({ providers, mode }: ProviderStatusGridProps) {
  const availableColor = STATUS_COLORS["available"]?.[mode] ?? "#00ff88";
  const unavailableColor = STATUS_COLORS["unavailable"]?.[mode] ?? "rgba(255,68,68,1)";

  if (providers.length === 0) {
    return (
      <p
        className="text-xs font-mono text-center py-4"
        style={{ color: `${availableColor}44` }}
      >
        Loading providers...
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {providers.map((p) => {
        const color = p.is_available ? availableColor : unavailableColor;
        return (
          <div
            key={p.provider_name}
            className="rounded border p-2 flex flex-col gap-1"
            style={{
              borderColor: `${color}33`,
              background: `${color}08`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: color,
                  boxShadow: `0 0 4px ${color}`,
                }}
              />
              <span
                className="text-xs font-mono truncate"
                style={{ color: `${color}cc` }}
              >
                {p.provider_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="text-xs font-mono"
                style={{ color: `${color}66` }}
              >
                {p.average_latency_ms > 0
                  ? `${Math.round(p.average_latency_ms)}ms`
                  : "\u2014"}
              </span>
              <span className="text-xs font-mono" style={{ color }}>
                {p.circuit_state === "closed"
                  ? "OK"
                  : (p.circuit_state ?? "unknown").toUpperCase()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsDashboardPanel({
  sessionId,
  isOpen,
  onClose,
  theme = "matrix",
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] =
    useState<AnalyticsDashboardType | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { resolvedMode: rawMode } = useTheme();
  const resolvedMode = resolveMode(rawMode);
  const ink = THEME_INK[theme][resolvedMode];
  const primary = ink.primary;
  const overlay =
    resolvedMode === "light" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.6)";
  const panelBg = `${ink.bg}fa`;
  const commandsColor =
    SECTION_COLORS["commands"]?.[resolvedMode] ?? "#00ff88";
  const providersColor =
    SECTION_COLORS["providers"]?.[resolvedMode] ?? "#0088ff";
  const errorColor = ERROR_COLOR[resolvedMode];
  const errorBorder = ERROR_BORDER[resolvedMode];

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsData, providerData] = await Promise.all([
        getAnalytics(period),
        getProviderStatus(),
      ]);
      if (!isMountedRef.current) return;
      setAnalytics(analyticsData);
      setProviders(providerData);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load analytics"
      );
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const commandTotal = analytics
    ? Object.values(analytics.command_breakdown).reduce(
        (a, b) => a + b,
        0
      )
    : 0;
  const providerTotal = analytics
    ? Object.values(analytics.provider_breakdown).reduce(
        (a, b) => a + b,
        0
      )
    : 0;

  const commandColors = Object.keys(
    analytics?.command_breakdown ?? {}
  ).map(
    (key) =>
      (COMMAND_COLORS[key as CommandType] ?? FALLBACK_COLOR)[resolvedMode]
  );

  const providerColors = Object.keys(
    analytics?.provider_breakdown ?? {}
  ).map(
    (_key, idx) =>
      (PROVIDER_COLORS[idx % PROVIDER_COLORS.length] ?? FALLBACK_COLOR)[
        resolvedMode
      ]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: overlay, willChange: "opacity" }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(420px, 95vw)",
              background: panelBg,
              borderLeft: `1px solid ${ink.border}`,
              willChange: "transform, opacity",
            }}
            role="complementary"
            aria-label="Analytics dashboard panel"
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${primary}22` }}
            >
              <div>
                <h2
                  className="text-sm font-bold font-mono tracking-widest"
                  style={{ color: primary }}
                >
                  ANALYTICS
                </h2>
                <p
                  className="text-xs font-mono"
                  style={{ color: `${primary}66` }}
                >
                  session: {sessionId.slice(0, 16)}&#x2026;
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{
                  color: `${primary}88`,
                  border: `1px solid ${primary}22`,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = primary;
                  e.currentTarget.style.borderColor = `${primary}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${primary}88`;
                  e.currentTarget.style.borderColor = `${primary}22`;
                }}
                aria-label="Close analytics"
              >
                &#x2715;
              </button>
            </div>

            <div className="flex gap-1 px-4 py-2 shrink-0">
              {PERIODS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className="flex-1 py-1 text-xs font-mono rounded transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  style={{
                    background:
                      period === p.value ? `${primary}22` : "transparent",
                    color:
                      period === p.value ? primary : `${primary}55`,
                    border: `1px solid ${
                      period === p.value ? `${primary}66` : `${primary}22`
                    }`,
                  }}
                  aria-pressed={period === p.value}
                  aria-label={`View ${p.label} analytics`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoading}
                className="px-2 py-1 text-xs font-mono rounded transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{
                  background: `${primary}11`,
                  color: isLoading ? `${primary}44` : primary,
                  border: `1px solid ${primary}33`,
                }}
                aria-label="Refresh analytics"
              >
                {isLoading ? "\u2026" : "\u21ba"}
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
              style={{ overscrollBehavior: "contain" }}
            >
              {error && (
                <div
                  className="rounded border p-3 text-xs font-mono"
                  role="alert"
                  style={{
                    borderColor: errorBorder,
                    color: errorColor,
                    background: `${errorColor}08`,
                  }}
                >
                  {error}
                </div>
              )}

              {analytics && (
                <>
                  <div>
                    <p
                      className="text-xs font-mono mb-2 tracking-widest"
                      style={{ color: `${primary}66` }}
                    >
                      OVERVIEW
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <StatCard
                        label="TOTAL REQUESTS"
                        value={analytics.total_requests.toLocaleString()}
                        color={
                          STAT_COLORS["totalRequests"]?.[resolvedMode] ??
                          primary
                        }
                      />
                      <StatCard
                        label="TOTAL TOKENS"
                        value={
                          analytics.total_tokens >= 1000
                            ? `${(analytics.total_tokens / 1000).toFixed(
                                1
                              )}k`
                            : analytics.total_tokens.toString()
                        }
                        color={
                          STAT_COLORS["totalTokens"]?.[resolvedMode] ??
                          primary
                        }
                      />
                      <StatCard
                        label="AVG LATENCY"
                        value={Math.round(analytics.average_latency_ms)}
                        suffix="ms"
                        color={
                          STAT_COLORS["avgLatency"]?.[resolvedMode] ??
                          primary
                        }
                      />
                      <StatCard
                        label="PROVIDERS ACTIVE"
                        value={
                          providers.filter((p) => p.is_available).length
                        }
                        color={
                          STAT_COLORS["providersActive"]?.[resolvedMode] ??
                          primary
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <p
                      className="text-xs font-mono mb-2 tracking-widest"
                      style={{ color: `${commandsColor}66` }}
                    >
                      COMMANDS ({commandTotal})
                    </p>
                    <div
                      className="rounded border p-3"
                      style={{
                        borderColor: `${commandsColor}22`,
                        background: `${commandsColor}06`,
                      }}
                    >
                      <BarChart
                        data={analytics.command_breakdown}
                        colors={commandColors}
                        total={commandTotal}
                        labelMap={COMMAND_LABELS}
                      />
                    </div>
                  </div>

                  <div>
                    <p
                      className="text-xs font-mono mb-2 tracking-widest"
                      style={{ color: `${providersColor}66` }}
                    >
                      PROVIDERS ({providerTotal})
                    </p>
                    <div
                      className="rounded border p-3"
                      style={{
                        borderColor: `${providersColor}22`,
                        background: `${providersColor}06`,
                      }}
                    >
                      <BarChart
                        data={analytics.provider_breakdown}
                        colors={providerColors}
                        total={providerTotal}
                      />
                    </div>
                  </div>
                </>
              )}

              {!analytics && !isLoading && !error && (
                <p
                  className="text-xs font-mono text-center py-8"
                  style={{ color: `${primary}44` }}
                >
                  No analytics data yet. Start chatting!
                </p>
              )}

              <div>
                <p
                  className="text-xs font-mono mb-2 tracking-widest"
                  style={{ color: `${primary}66` }}
                >
                  PROVIDER STATUS
                </p>
                <div
                  className="rounded border p-3"
                  style={{
                    borderColor: `${primary}22`,
                    background: `${primary}06`,
                  }}
                >
                  <ProviderStatusGrid
                    providers={providers}
                    mode={resolvedMode}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(AnalyticsDashboardPanel);