// frontend/components/panels/ConversationPanel.tsx
"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Conversation, TerminalTheme } from "@/types";
import { getConversations } from "@/lib/supabase/queries";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

interface ConversationPanelProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onIdClick: (id: string) => void;
  theme?: TerminalTheme;
}

interface ThemeStyle {
  bg: string;
  border: string;
  text: string;
  dim: string;
  glow: string;
  hover: string;
  accent: string;
  overlay: string;
}

interface ThemeStylePair {
  dark: ThemeStyle;
  light: ThemeStyle;
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
  matrix: {
    dark: { primary: "#00ff88", secondary: "#00cc66", bg: "#000800", border: "#00ff8833" },
    light: { primary: "#046b3a", secondary: "#035c30", bg: "#eef8f2", border: "#046b3a33" },
  },
  cyberpunk: {
    dark: { primary: "#ff0088", secondary: "#cc0066", bg: "#080004", border: "#ff008833" },
    light: { primary: "#99005c", secondary: "#7a004a", bg: "#fff0f7", border: "#99005c33" },
  },
  holographic: {
    dark: { primary: "#00ffff", secondary: "#0099cc", bg: "#000408", border: "#00ffff33" },
    light: { primary: "#006677", secondary: "#00505c", bg: "#eafcff", border: "#00667733" },
  },
  neon: {
    dark: { primary: "#b400ff", secondary: "#8800cc", bg: "#040008", border: "#b400ff33" },
    light: { primary: "#6a00b3", secondary: "#55008f", bg: "#f7eeff", border: "#6a00b333" },
  },
  cyber: {
    dark: { primary: "#0088ff", secondary: "#0055cc", bg: "#000208", border: "#0088ff33" },
    light: { primary: "#004a99", secondary: "#003b7a", bg: "#eef4ff", border: "#004a9933" },
  },
  plasma: {
    dark: { primary: "#ff4400", secondary: "#cc3300", bg: "#080200", border: "#ff440033" },
    light: { primary: "#b32d00", secondary: "#8f2400", bg: "#fff3ec", border: "#b32d0033" },
  },
  aurora: {
    dark: { primary: "#00ffcc", secondary: "#00ccaa", bg: "#000807", border: "#00ffcc33" },
    light: { primary: "#007a66", secondary: "#006352", bg: "#eafff9", border: "#007a6633" },
  },
  inferno: {
    dark: { primary: "#ff8800", secondary: "#cc6600", bg: "#080400", border: "#ff880033" },
    light: { primary: "#b35f00", secondary: "#8f4c00", bg: "#fff6ec", border: "#b35f0033" },
  },
  ghost: {
    dark: { primary: "#aaaaff", secondary: "#8888cc", bg: "#020208", border: "#aaaaff33" },
    light: { primary: "#4c4c99", secondary: "#3d3d7a", bg: "#f1f1fb", border: "#4c4c9933" },
  },
  crimson: {
    dark: { primary: "#ff2244", secondary: "#cc1133", bg: "#080002", border: "#ff224433" },
    light: { primary: "#99001a", secondary: "#7a0015", bg: "#fff0f2", border: "#99001a33" },
  },
};

function buildThemeStylePair(ink: ThemeInkPair): ThemeStylePair {
  return {
    dark: {
      bg: `${ink.dark.bg}f7`,
      border: ink.dark.border,
      text: ink.dark.primary,
      dim: `${ink.dark.primary}66`,
      glow: ink.dark.primary,
      hover: `${ink.dark.primary}11`,
      accent: ink.dark.secondary,
      overlay: "rgba(0,0,0,0.6)",
    },
    light: {
      bg: `${ink.light.bg}f7`,
      border: ink.light.border,
      text: ink.light.primary,
      dim: `${ink.light.primary}66`,
      glow: ink.light.primary,
      hover: `${ink.light.primary}11`,
      accent: ink.light.secondary,
      overlay: "rgba(0,0,0,0.35)",
    },
  };
}

const THEME_STYLES: Record<TerminalTheme, ThemeStylePair> = (
  Object.keys(THEME_INK) as TerminalTheme[]
).reduce(
  (acc, key) => {
    acc[key] = buildThemeStylePair(THEME_INK[key]);
    return acc;
  },
  {} as Record<TerminalTheme, ThemeStylePair>,
);

const STAR_GLYPH = "\u2731";

const COMMAND_COLORS: Record<string, string> = {
  "@": "#00ff88",
  "$": "#0088ff",
  "#": "#ff8800",
  "*": "#b400ff",
  [STAR_GLYPH]: "#b400ff",
  "default": "#00ffff",
  "slash": "#ff0088",
};

const DEFAULT_CMD_COLOR = "#00ffff";
const LOAD_ERROR_COLOR = "rgba(255,68,68,1)";

interface GetConversationsResult {
  data: Conversation[];
  error: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function resolveProviderLabel(entry: Conversation): string {
  const raw = entry.last_provider_used ?? entry.provider_used ?? "";
  if (!raw || raw.trim().length === 0) return "unknown";
  return raw.trim().toLowerCase();
}

interface EntryCardProps {
  entry: Conversation;
  onIdClick: (id: string) => void;
  themeStyle: ThemeStyle;
}

const EntryCard = memo(function EntryCard({
  entry,
  onIdClick,
  themeStyle,
}: EntryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = themeStyle;

  const cmdType = entry.command_type ?? "default";
  const cmdColor = COMMAND_COLORS[cmdType] ?? DEFAULT_CMD_COLOR;
  const providerLabel = resolveProviderLabel(entry);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearTouchDismiss = useCallback(() => {
    if (touchDismissRef.current) {
      clearTimeout(touchDismissRef.current);
      touchDismissRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      clearTouchDismiss();
    };
  }, [clearTimer, clearTouchDismiss]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearTimer();
    timerRef.current = setTimeout(() => setShowPreview(true), 350);
  }, [clearTimer]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowPreview(false);
    clearTimer();
  }, [clearTimer]);

  const handleTouchStart = useCallback(() => {
    setIsTouchActive(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsTouchActive(false);
    clearTouchDismiss();
    if (!showPreview) {
      setShowPreview(true);
      touchDismissRef.current = setTimeout(() => setShowPreview(false), 3000);
    } else {
      setShowPreview(false);
    }
  }, [showPreview, clearTouchDismiss]);

  const handleClick = useCallback(() => {
    onIdClick(entry.id);
  }, [entry.id, onIdClick]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const isActive = isHovered || isTouchActive;
  const displayTitle = entry.title ?? "Untitled Conversation";
  const createdAt = entry.created_at ?? new Date().toISOString();

  return (
    <div className="relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className="rounded border p-3 cursor-pointer select-none"
        style={{
          borderColor: isActive ? `${s.glow}55` : s.border,
          background: isActive ? s.hover : "transparent",
          transition: "border-color 0.2s, background 0.2s",
          willChange: "transform, opacity",
        }}
        role="button"
        tabIndex={0}
        aria-label={`Conversation: ${displayTitle.slice(0, 50)}`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
              style={{
                color: cmdColor,
                background: `${cmdColor}18`,
                border: `1px solid ${cmdColor}33`,
              }}
            >
              {cmdType}
            </span>
            <span
              className="text-xs font-mono truncate"
              style={{ color: s.dim }}
            >
              {providerLabel}
            </span>
          </div>
          <span
            className="text-xs font-mono shrink-0 ml-2"
            style={{ color: `${s.dim}99` }}
          >
            {formatRelativeTime(createdAt)}
          </span>
        </div>

        <p
          className="text-xs font-mono truncate"
          style={{ color: `${s.text}cc` }}
        >
          {displayTitle}
        </p>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-xs font-mono font-bold tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: s.text,
              background: `${s.glow}15`,
              border: `1px solid ${s.glow}33`,
            }}
          >
            {entry.id}
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: `${s.dim}88` }}
          >
            &#x21b5; click to paste
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 rounded border p-3 shadow-2xl"
            style={{
              top: "calc(100% + 4px)",
              background: s.bg,
              borderColor: `${s.glow}55`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.85), 0 0 20px ${s.glow}22`,
              maxHeight: "220px",
              overflow: "hidden",
              willChange: "transform, opacity",
            }}
          >
            <p
              className="text-xs font-mono mb-1 font-bold tracking-widest"
              style={{ color: s.text }}
            >
              CONVERSATION:
            </p>
            <p
              className="text-xs font-mono mb-2 break-words"
              style={{
                color: `${s.text}cc`,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displayTitle}
            </p>
            <p
              className="text-xs font-mono mb-1 font-bold tracking-widest"
              style={{ color: s.accent }}
            >
              DETAILS:
            </p>
            <p
              className="text-xs font-mono break-words"
              style={{ color: `${s.accent}99` }}
            >
              {entry.message_count ?? 0} messages &middot; {providerLabel}
            </p>
            <p
              className="text-xs font-mono mt-2 text-center tracking-wide"
              style={{ color: s.dim }}
            >
              Click to paste ID &#x2192; Enter to recall
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function ConversationPanelInner({
  sessionId,
  isOpen,
  onClose,
  onIdClick,
  theme = "matrix",
}: ConversationPanelProps) {
  const [entries, setEntries] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { resolvedMode } = useTheme();
  const { user } = useAuth();
  const mode: "dark" | "light" = resolvedMode === "light" ? "light" : "dark";
  const s = THEME_STYLES[theme][mode];

  const userId = user?.id ?? null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadConversations = useCallback(
    (didCancelRef: { value: boolean }) => {
      if (!userId) {
        setEntries([]);
        setLoadError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      getConversations(userId).then((result: GetConversationsResult) => {
        if (didCancelRef.value || !isMountedRef.current) return;
        if (result.error) {
          setLoadError(result.error);
          setEntries([]);
        } else {
          setEntries(result.data);
        }
        setIsLoading(false);
      });
    },
    [userId],
  );

  useEffect(() => {
    if (!isOpen) return;
    const didCancelRef = { value: false };
    loadConversations(didCancelRef);
    return () => {
      didCancelRef.value = true;
    };
  }, [isOpen, loadConversations]);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const handleRetry = useCallback(() => {
    if (!isMountedRef.current) return;
    const didCancelRef = { value: false };
    loadConversations(didCancelRef);
  }, [loadConversations]);

  const filteredEntries = entries.filter((e) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (e.title ?? "").toLowerCase().includes(q);
    const idMatch = e.id.toLowerCase().includes(q);
    return titleMatch || idMatch;
  });

  const sessionDisplay = sessionId.slice(0, 22);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: s.overlay }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(400px, 95vw)",
              background: s.bg,
              borderLeft: `1px solid ${s.border}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            role="complementary"
            aria-label="Conversation history panel"
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${s.border}` }}
            >
              <div>
                <h2
                  className="text-sm font-bold font-mono tracking-widest"
                  style={{ color: s.text }}
                >
                  CONVERSATIONS
                </h2>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: s.dim }}
                >
                  {filteredEntries.length} entries &middot; session active
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{
                  color: s.dim,
                  border: `1px solid ${s.border}`,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = s.text;
                  e.currentTarget.style.borderColor = `${s.glow}55`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = s.dim;
                  e.currentTarget.style.borderColor = s.border;
                }}
                aria-label="Close conversation panel"
              >
                &#x2715;
              </button>
            </div>

            <div
              className="px-4 py-2 shrink-0"
              style={{ borderBottom: `1px solid ${s.border}44` }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by title or ID\u2026"
                className="w-full px-3 py-2 text-xs font-mono rounded outline-none"
                style={{
                  background: s.hover,
                  border: `1px solid ${s.border}`,
                  color: s.text,
                  caretColor: s.glow,
                }}
                aria-label="Search conversations"
              />
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
              style={{ overscrollBehavior: "contain" }}
              aria-live="polite"
              aria-atomic="false"
            >
              {isLoading && (
                <div className="text-center py-10">
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="text-xs font-mono tracking-widest"
                    style={{ color: s.dim }}
                  >
                    LOADING CONVERSATIONS&#x2026;
                  </motion.p>
                </div>
              )}

              {!isLoading && loadError && (
                <div className="text-center py-10" role="alert">
                  <p
                    className="text-xs font-mono"
                    style={{ color: LOAD_ERROR_COLOR }}
                  >
                    &#x26A0; Failed to load: {loadError}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-mono mt-3 px-3 py-1.5 rounded border outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    style={{
                      color: s.text,
                      borderColor: s.border,
                      background: "transparent",
                    }}
                    onClick={handleRetry}
                    aria-label="Retry loading conversations"
                  >
                    RETRY
                  </button>
                </div>
              )}

              {!isLoading && !loadError && !userId && (
                <div className="text-center py-10">
                  <p
                    className="text-xs font-mono tracking-wide"
                    style={{ color: s.dim }}
                  >
                    Sign in to view your conversations
                  </p>
                </div>
              )}

              {!isLoading && !loadError && userId && filteredEntries.length === 0 && (
                <div className="text-center py-10">
                  <p
                    className="text-xs font-mono tracking-wide"
                    style={{ color: s.dim }}
                  >
                    {searchQuery ? "No matches found" : "No conversations yet"}
                  </p>
                  {!searchQuery && (
                    <p
                      className="text-xs font-mono mt-2"
                      style={{ color: `${s.dim}66` }}
                    >
                      Use # command to save conversations
                    </p>
                  )}
                </div>
              )}

              {!isLoading && !loadError && userId && filteredEntries.length > 0 && (
                <AnimatePresence mode="popLayout">
                  {filteredEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onIdClick={onIdClick}
                      themeStyle={s}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div
              className="px-4 py-2 shrink-0 text-center"
              style={{ borderTop: `1px solid ${s.border}44` }}
            >
              <p
                className="text-xs font-mono tracking-wider"
                style={{ color: `${s.dim}77` }}
              >
                session: {sessionDisplay}&#x2026;
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
export default memo(ConversationPanelInner);