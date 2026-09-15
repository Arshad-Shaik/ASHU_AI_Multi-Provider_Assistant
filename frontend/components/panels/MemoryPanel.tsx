// frontend/components/panels/MemoryPanel.tsx
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import type {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandType, MemoryEntry } from "@/types";
import { getMemoryEntries, deleteMemoryEntry } from "@/lib/api/client";
import { useTheme } from "@/hooks/useTheme";

const STAR_GLYPH = "\u2731";

interface MemoryPanelProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectMemory: (memoryId: string) => void;
}

interface CommandMeta {
  label: string;
  color: string;
}

interface CommandMetaPair {
  dark: CommandMeta;
  light: CommandMeta;
}

const COMMAND_META: Record<string, CommandMetaPair> = {
  "@": {
    dark: { label: "Expert", color: "#00ff88" },
    light: { label: "Expert", color: "#046b3a" },
  },
  "$": {
    dark: { label: "Code", color: "#0088ff" },
    light: { label: "Code", color: "#004a99" },
  },
  "#": {
    dark: { label: "Memory", color: "#ff8800" },
    light: { label: "Memory", color: "#b35f00" },
  },
  "*": {
    dark: { label: "Regen", color: "#b400ff" },
    light: { label: "Regen", color: "#6a00b3" },
  },
  [STAR_GLYPH]: {
    dark: { label: "Regen", color: "#b400ff" },
    light: { label: "Regen", color: "#6a00b3" },
  },
  "default": {
    dark: { label: "Chat", color: "#00ffff" },
    light: { label: "Chat", color: "#006677" },
  },
  "slash": {
    dark: { label: "Slash", color: "#ff0088" },
    light: { label: "Slash", color: "#99005c" },
  },
};

interface PanelChrome {
  bg: string;
  border: string;
  borderStrong: string;
  text: string;
  dim: string;
  faint: string;
  inputBg: string;
  responseColor: string;
  errorColor: string;
  errorBorder: string;
  deleteColor: string;
  deleteHoverColor: string;
  previewBg: string;
  caretColor: string;
}

const PANEL_CHROME: Record<"dark" | "light", PanelChrome> = {
  dark: {
    bg: "rgba(0,8,0,0.97)",
    border: "#ff880022",
    borderStrong: "#ff880033",
    text: "#ff8800",
    dim: "#ff880066",
    faint: "#ff880044",
    inputBg: "#ff880011",
    responseColor: "#00ffff",
    errorColor: "rgba(255,102,102,1)",
    errorBorder: "rgba(255,68,68,0.2)",
    deleteColor: "rgba(255,68,68,0.4)",
    deleteHoverColor: "rgba(255,68,68,1)",
    previewBg: "rgba(0,8,0,0.98)",
    caretColor: "#ff8800",
  },
  light: {
    bg: "rgba(255,247,235,0.98)",
    border: "#b35f0022",
    borderStrong: "#b35f0033",
    text: "#b35f00",
    dim: "#b35f0088",
    faint: "#b35f0055",
    inputBg: "#b35f000d",
    responseColor: "#006677",
    errorColor: "rgba(179,0,0,1)",
    errorBorder: "rgba(179,0,0,0.2)",
    deleteColor: "rgba(179,0,0,0.4)",
    deleteHoverColor: "rgba(179,0,0,1)",
    previewBg: "rgba(255,247,235,0.99)",
    caretColor: "#b35f00",
  },
};

const Z_PANEL_OVERLAY = 40;
const Z_PANEL = 50;
const Z_DROPDOWN = 60;

const DEFAULT_META_PAIR: CommandMetaPair = {
  dark: { label: "Chat", color: "#00ffff" },
  light: { label: "Chat", color: "#006677" },
};

function resolveMode(raw: string): "dark" | "light" {
  return raw === "light" ? "light" : "dark";
}

function getCommandMeta(commandType: string, mode: "dark" | "light"): CommandMeta {
  const pair: CommandMetaPair = COMMAND_META[commandType] ?? DEFAULT_META_PAIR;
  return pair[mode];
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

function usePointerFine(): boolean {
  const [isFine, setIsFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setIsFine(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsFine(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isFine;
}

interface MemoryCardProps {
  entry: MemoryEntry;
  mode: "dark" | "light";
  chrome: PanelChrome;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isPointerFine: boolean;
}

const MemoryCard = memo(function MemoryCard({
  entry,
  mode,
  chrome,
  onSelect,
  onDelete,
  isPointerFine,
}: MemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meta = getCommandMeta(entry.command_type, mode);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
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
      clearHoverTimer();
      clearTouchDismiss();
    };
  }, [clearHoverTimer, clearTouchDismiss]);

  const handleMouseEnter = useCallback(() => {
    if (!isPointerFine) return;
    setIsHovered(true);
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setShowPreview(true), 400);
  }, [isPointerFine, clearHoverTimer]);

  const handleMouseLeave = useCallback(() => {
    if (!isPointerFine) return;
    setIsHovered(false);
    setShowPreview(false);
    clearHoverTimer();
  }, [isPointerFine, clearHoverTimer]);

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

  const handleDelete = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setIsDeleting(true);
      try {
        await onDelete(entry.memory_id);
      } finally {
        setIsDeleting(false);
      }
    },
    [entry.memory_id, onDelete]
  );

  const handleClick = useCallback(() => {
    onSelect(entry.memory_id);
  }, [entry.memory_id, onSelect]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const isActive = isHovered || isTouchActive;

  return (
    <div className="relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        {...(isPointerFine ? { whileHover: { scale: 1.01 } } : {})}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className="relative rounded border p-3 cursor-pointer overflow-hidden select-none"
        style={{
          borderColor: isActive ? `${meta.color}66` : `${meta.color}22`,
          background: isActive ? `${meta.color}0d` : `${meta.color}06`,
          transition: "border-color 0.2s, background 0.2s",
          willChange: "transform, opacity",
        }}
        role="button"
        tabIndex={0}
        aria-label={`Memory entry: ${entry.user_prompt.slice(0, 50)}`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
              style={{
                color: meta.color,
                background: `${meta.color}18`,
                border: `1px solid ${meta.color}33`,
              }}
            >
              {entry.command_type}
            </span>
            <span
              className="text-xs font-mono shrink-0"
              style={{ color: `${meta.color}77` }}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-mono" style={{ color: chrome.faint }}>
              {formatRelativeTime(entry.created_at)}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete memory entry"
              className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors duration-150 outline-none"
              style={{
                color: chrome.deleteColor,
                background: "transparent",
                border: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = chrome.deleteHoverColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = chrome.deleteColor;
              }}
            >
              {isDeleting ? "\u2026" : "\u2715"}
            </button>
          </div>
        </div>

        <p
          className="text-xs font-mono truncate mb-1"
          style={{ color: `${meta.color}cc` }}
        >
          {entry.user_prompt}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs font-mono font-bold tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: meta.color,
              background: `${meta.color}15`,
              border: `1px solid ${meta.color}33`,
            }}
          >
            {entry.memory_id}
          </span>
          <span
            className="text-xs font-mono truncate"
            style={{ color: chrome.faint }}
          >
            {entry.provider_used}
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
            className="absolute left-0 right-0 rounded border p-3 shadow-2xl"
            style={{
              top: "calc(100% + 4px)",
              background: chrome.previewBg,
              borderColor: `${meta.color}44`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.85), 0 0 20px ${meta.color}22`,
              maxHeight: "240px",
              overflow: "hidden",
              zIndex: Z_DROPDOWN,
              willChange: "transform, opacity",
            }}
          >
            <p
              className="text-xs font-mono mb-1 font-bold tracking-widest"
              style={{ color: meta.color }}
            >
              PROMPT:
            </p>
            <p
              className="text-xs font-mono mb-2 break-words"
              style={{
                color: `${meta.color}cc`,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {entry.user_prompt}
            </p>
            <p
              className="text-xs font-mono mb-1 font-bold tracking-widest"
              style={{ color: chrome.responseColor }}
            >
              RESPONSE:
            </p>
            <p
              className="text-xs font-mono break-words"
              style={{
                color: `${chrome.responseColor}99`,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {entry.ai_response}
            </p>
            <p
              className="text-xs font-mono mt-2 text-center tracking-wide"
              style={{ color: `${meta.color}66` }}
            >
              Click to paste ID &#x2192; press Enter to recall
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function MemoryPanelInner({
  sessionId,
  isOpen,
  onClose,
  onSelectMemory,
}: MemoryPanelProps) {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CommandType | "all">("all");
  const isMountedRef = useRef(true);

  const { resolvedMode } = useTheme();
  const mode = resolveMode(resolvedMode);
  const chrome = PANEL_CHROME[mode];
  const isPointerFine = usePointerFine();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMemoryEntries();
      if (!isMountedRef.current) return;
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load memory");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchEntries();
  }, [isOpen, fetchEntries]);

  const handleDelete = useCallback(async (memoryId: string) => {
    try {
      await deleteMemoryEntry(memoryId);
      if (!isMountedRef.current) return;
      setEntries((prev) => prev.filter((e) => e.memory_id !== memoryId));
    } catch {
      if (!isMountedRef.current) return;
      setError("Failed to delete entry. Please try again.");
    }
  }, []);

  const handleSelect = useCallback(
    (memoryId: string) => {
      onSelectMemory(memoryId);
      onClose();
    },
    [onSelectMemory, onClose]
  );

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleDismissError = useCallback(() => setError(null), []);

  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      entry.user_prompt.toLowerCase().includes(q) ||
      entry.memory_id.toLowerCase().includes(q) ||
      entry.ai_response.toLowerCase().includes(q);
    const matchesFilter =
      activeFilter === "all" || entry.command_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: Array<{ value: CommandType | "all"; label: string }> = [
    { value: "all", label: "ALL" },
    { value: "@" as CommandType, label: "@" },
    { value: "$" as CommandType, label: "$" },
    { value: "#" as CommandType, label: "#" },
    { value: STAR_GLYPH as CommandType, label: STAR_GLYPH },
    { value: "default" as CommandType, label: "CHAT" },
  ];

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
            className="fixed inset-0"
            style={{
              background: "rgba(0,0,0,0.6)",
              zIndex: Z_PANEL_OVERLAY,
            }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 h-full flex flex-col overflow-hidden"
            style={{
              width: "min(380px, 95vw)",
              background: chrome.bg,
              borderRight: `1px solid ${chrome.borderStrong}`,
              zIndex: Z_PANEL,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            role="complementary"
            aria-label="Memory panel"
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${chrome.border}` }}
            >
              <div>
                <h2
                  className="text-sm font-bold font-mono tracking-widest"
                  style={{ color: chrome.text }}
                >
                  MEMORY PANEL
                </h2>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: chrome.dim }}
                >
                  {entries.length} saved &#xB7; {filteredEntries.length} visible
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fetchEntries}
                  disabled={isLoading}
                  aria-label="Refresh memory entries"
                  className="w-8 h-8 rounded flex items-center justify-center text-xs transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  style={{
                    color: isLoading ? chrome.faint : chrome.dim,
                    border: `1px solid ${chrome.border}`,
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.color = chrome.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isLoading
                      ? chrome.faint
                      : chrome.dim;
                  }}
                >
                  {isLoading ? "\u2026" : "\u21ba"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close memory panel"
                  className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  style={{
                    color: chrome.dim,
                    border: `1px solid ${chrome.border}`,
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = chrome.text;
                    e.currentTarget.style.borderColor = chrome.borderStrong;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = chrome.dim;
                    e.currentTarget.style.borderColor = chrome.border;
                  }}
                >
                  &#x2715;
                </button>
              </div>
            </div>

            <div
              className="px-4 py-2 shrink-0 space-y-2"
              style={{ borderBottom: `1px solid ${chrome.border}` }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by prompt, ID, or response\u2026"
                aria-label="Search memory entries"
                className="w-full px-3 py-2 text-xs font-mono rounded outline-none"
                style={{
                  background: chrome.inputBg,
                  border: `1px solid ${chrome.borderStrong}`,
                  color: chrome.text,
                  caretColor: chrome.caretColor,
                }}
              />
              <div
                className="flex gap-1 flex-wrap"
                role="group"
                aria-label="Filter by command type"
              >
                {filterOptions.map((opt) => {
                  const isActive = activeFilter === opt.value;
                  const color =
                    opt.value === "all"
                      ? chrome.text
                      : getCommandMeta(opt.value, mode).color;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() =>
                        setActiveFilter(opt.value as CommandType | "all")
                      }
                      aria-label={`Filter by ${opt.label}`}
                      aria-pressed={isActive}
                      className="px-2 py-1 text-xs font-mono rounded transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      style={{
                        background: isActive ? `${color}22` : "transparent",
                        color: isActive ? color : `${color}55`,
                        border: `1px solid ${
                          isActive ? `${color}66` : `${color}22`
                        }`,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
              style={{ overscrollBehavior: "contain" }}
              aria-live="polite"
              aria-atomic="false"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded border p-3 text-xs font-mono flex items-start justify-between gap-2"
                  style={{
                    borderColor: chrome.errorBorder,
                    color: chrome.errorColor,
                    background: `${chrome.errorColor}08`,
                  }}
                  role="alert"
                >
                  <span className="break-words">{error}</span>
                  <button
                    type="button"
                    onClick={handleDismissError}
                    aria-label="Dismiss error"
                    className="shrink-0 text-xs outline-none"
                    style={{
                      color: chrome.errorColor,
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    &#x2715;
                  </button>
                </motion.div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-6 h-6 rounded-full"
                    style={{
                      border: `2px solid ${chrome.borderStrong}`,
                      borderTopColor: chrome.text,
                      willChange: "transform",
                    }}
                  />
                  <p
                    className="text-xs font-mono tracking-widest"
                    style={{ color: chrome.faint }}
                  >
                    LOADING MEMORIES&#x2026;
                  </p>
                </div>
              )}

              {!isLoading && filteredEntries.length === 0 && (
                <div className="text-center py-10">
                  <p
                    className="text-xs font-mono tracking-wide"
                    style={{ color: chrome.faint }}
                  >
                    {searchQuery || activeFilter !== "all"
                      ? "No matches found"
                      : "No memories saved yet"}
                  </p>
                  {!searchQuery && activeFilter === "all" && (
                    <p
                      className="text-xs font-mono mt-2"
                      style={{ color: `${chrome.faint}88` }}
                    >
                      Use # command to save memories
                    </p>
                  )}
                </div>
              )}

              {!isLoading && filteredEntries.length > 0 && (
                <AnimatePresence mode="popLayout">
                  {filteredEntries.map((entry) => (
                    <MemoryCard
                      key={entry.memory_id}
                      entry={entry}
                      mode={mode}
                      chrome={chrome}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      isPointerFine={isPointerFine}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div
              className="px-4 py-2 shrink-0 text-center space-y-1"
              style={{ borderTop: `1px solid ${chrome.border}` }}
            >
              <p className="text-xs font-mono" style={{ color: chrome.faint }}>
                Hover &#x2192; preview &#xB7; Click &#x2192; paste ID &#xB7;
                Enter &#x2192; recall
              </p>
              <p
                className="text-xs font-mono tracking-wider"
                style={{ color: `${chrome.faint}77` }}
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

export default memo(MemoryPanelInner);