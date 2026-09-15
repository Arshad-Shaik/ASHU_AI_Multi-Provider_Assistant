// frontend/components/ui/CommandPalette.tsx
"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  memo,
} from "react";
import type {
  FocusEvent,
  ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TerminalTheme } from "@/types";
import { useTheme } from "@/hooks/useTheme";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: TerminalTheme;
  onSubmit: (input: string) => Promise<void>;
  onThemeChange: (theme: TerminalTheme) => void;
  onClear: () => void;
}

interface PaletteCommand {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  action: () => void;
  color: string;
}

interface ThemeInk {
  primary: string;
  bg: string;
  border: string;
}

interface ThemeInkPair {
  dark: ThemeInk;
  light: ThemeInk;
}

interface DualColor {
  dark: string;
  light: string;
}

type PaletteTab = "commands" | "privacy" | "about";

function resolveMode(raw: string): "dark" | "light" {
  return raw === "light" ? "light" : "dark";
}

const THEME_INK: Record<TerminalTheme, ThemeInkPair> = {
  matrix: {
    dark: { primary: "#00ff88", bg: "#000800", border: "#00ff8833" },
    light: { primary: "#046b3a", bg: "#eef8f2", border: "#046b3a33" },
  },
  cyberpunk: {
    dark: { primary: "#ff0088", bg: "#080004", border: "#ff008833" },
    light: { primary: "#99005c", bg: "#fff0f7", border: "#99005c33" },
  },
  holographic: {
    dark: { primary: "#00ffff", bg: "#000408", border: "#00ffff33" },
    light: { primary: "#006677", bg: "#eafcff", border: "#00667733" },
  },
  neon: {
    dark: { primary: "#b400ff", bg: "#040008", border: "#b400ff33" },
    light: { primary: "#6a00b3", bg: "#f7eeff", border: "#6a00b333" },
  },
  cyber: {
    dark: { primary: "#0088ff", bg: "#000208", border: "#0088ff33" },
    light: { primary: "#004a99", bg: "#eef4ff", border: "#004a9933" },
  },
  plasma: {
    dark: { primary: "#ff4400", bg: "#080200", border: "#ff440033" },
    light: { primary: "#b32d00", bg: "#fff3ec", border: "#b32d0033" },
  },
  aurora: {
    dark: { primary: "#00ffcc", bg: "#000807", border: "#00ffcc33" },
    light: { primary: "#007a66", bg: "#eafff9", border: "#007a6633" },
  },
  inferno: {
    dark: { primary: "#ff8800", bg: "#080400", border: "#ff880033" },
    light: { primary: "#b35f00", bg: "#fff6ec", border: "#b35f0033" },
  },
  ghost: {
    dark: { primary: "#aaaaff", bg: "#020208", border: "#aaaaff33" },
    light: { primary: "#4c4c99", bg: "#f1f1fb", border: "#4c4c9933" },
  },
  crimson: {
    dark: { primary: "#ff2244", bg: "#080002", border: "#ff224433" },
    light: { primary: "#99001a", bg: "#fff0f2", border: "#99001a33" },
  },
};

const THEMES: TerminalTheme[] = [
  "matrix", "cyberpunk", "holographic", "neon", "cyber",
  "plasma", "aurora", "inferno", "ghost", "crimson",
];

const SYSTEM_COLORS: Record<string, DualColor> = {
  clear: { dark: "#ff2244", light: "#99001a" },
  help: { dark: "#00ff88", light: "#046b3a" },
  status: { dark: "#0088ff", light: "#004a99" },
  history: { dark: "#ff8800", light: "#b35f00" },
  export: { dark: "#b400ff", light: "#6a00b3" },
};

const DEVELOPER_LINKS = {
  linkedin: "https://www.linkedin.com/in/arshadwasibshaik",
  github: "https://github.com/Arshad-Shaik",
} as const;

const PRIVACY_SECTIONS = [
  {
    title: "Data Storage & Privacy",
    content:
      "Your conversations are never stored as raw text in our database. Every prompt and AI response is assigned a unique cryptographic Memory ID. Only these IDs and anonymized metadata are retained — your actual words remain private and are not exposed to third parties or used for AI training.",
  },
  {
    title: "Memory ID System",
    content:
      "When you use the # command to save a response, ASHU AI generates a unique identifier such as MEM-XXXXXXXX. This ID references your conversation without storing personally identifiable content. You can retrieve, regenerate, or delete any saved response at any time using its ID.",
  },
  {
    title: "Authentication",
    content:
      "Authentication is handled entirely by Supabase with industry-standard JWT tokens. ASHU AI never stores your password. OAuth sign-in via Google and GitHub means your credentials never touch our servers directly.",
  },
  {
    title: "AI Provider Routing",
    content:
      "Your prompts are forwarded to AI providers (Gemini, Groq, Mistral, and others) only to generate responses. No provider retains your data beyond the immediate request. The multi-provider fallback system ensures continuity without exposing your data to additional parties unnecessarily.",
  },
  {
    title: "Cookies & Local Storage",
    content:
      "We use essential cookies for session authentication only. Voice agent preferences and terminal theme settings are stored in your browser's local storage and never transmitted to our servers. You may clear these at any time through your browser settings.",
  },
  {
    title: "Data Deletion",
    content:
      "You may request complete deletion of all your data at any time by contacting the developer. Deleting your account removes all associated Memory IDs, conversation metadata, and analytics data from our Supabase database permanently.",
  },
  {
    title: "Security",
    content:
      "All communications between your browser, our backend, and Supabase are encrypted using TLS. API endpoints require valid JWT authentication — unauthenticated requests are rejected at the server level. Circuit breakers and rate limiting protect the system from abuse.",
  },
] as const;

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const NAV_UP = "\u2191";
const NAV_DOWN = "\u2193";
const NAV_ENTER = "\u21b5";

const LINKEDIN_COLOR: DualColor = { dark: "#0a66c2", light: "#0a66c2" };
const GITHUB_COLOR: DualColor = { dark: "#e6edf3", light: "#24292f" };

interface HolographicLinkButtonProps {
  href: string;
  label: string;
  ariaLabel: string;
  primaryColor: string;
  glowColor: string;
  icon: "linkedin" | "github";
  fontSize: string;
}

const HolographicLinkButton = memo(function HolographicLinkButton({
  href,
  label,
  ariaLabel,
  primaryColor,
  glowColor,
  icon,
}: HolographicLinkButtonProps) {
  const handleClick = useCallback(() => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, [href]);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono font-bold text-xs outline-none overflow-hidden w-full sm:w-auto"
      style={{
        background: `${primaryColor}18`,
        border: `1px solid ${primaryColor}55`,
        color: primaryColor,
        willChange: "transform",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${primaryColor}28`;
        e.currentTarget.style.borderColor = `${primaryColor}99`;
        e.currentTarget.style.boxShadow = `0 0 16px ${glowColor}44, 0 0 32px ${glowColor}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${primaryColor}18`;
        e.currentTarget.style.borderColor = `${primaryColor}55`;
        e.currentTarget.style.boxShadow = "none";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${glowColor}88, 0 0 16px ${glowColor}44`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `linear-gradient(135deg, ${glowColor}, transparent 60%)`,
          willChange: "opacity",
        }}
        aria-hidden="true"
      />
      <span className="relative flex items-center gap-2">
        {icon === "linkedin" ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
          </svg>
        )}
        {label}
      </span>
    </motion.button>
  );
});

function CommandPaletteInner({
  isOpen,
  onClose,
  theme = "matrix",
  onSubmit,
  onThemeChange,
  onClear,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<PaletteTab>("commands");

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const filteredRef = useRef<PaletteCommand[]>([]);
  const highlightedIndexRef = useRef(0);

  const { resolvedMode } = useTheme();
  const mode = resolveMode(resolvedMode);
  const ink = THEME_INK[theme][mode];
  const color = ink.primary;
  const panelBg = `${ink.bg}fa`;
  const overlay =
    mode === "light" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.7)";

  const linkedinColor = LINKEDIN_COLOR[mode];
  const githubColor = GITHUB_COLOR[mode];

  const runSubmit = useCallback(
    (input: string) => {
      void onSubmit(input);
    },
    [onSubmit],
  );

  const getSystemColor = useCallback(
    (key: string): string => {
      return SYSTEM_COLORS[key]?.[mode] ?? color;
    },
    [mode, color],
  );

  const commands: PaletteCommand[] = useMemo(
    () => [
      {
        id: "clear",
        label: "Clear Terminal",
        description: "Clear all messages from the terminal",
        shortcut: "Ctrl+L",
        color: getSystemColor("clear"),
        action: () => {
          onClear();
          onClose();
        },
      },
      {
        id: "help",
        label: "Help",
        description: "Show all available commands and usage",
        shortcut: "/help",
        color: getSystemColor("help"),
        action: () => {
          runSubmit("/help");
          onClose();
        },
      },
      {
        id: "status",
        label: "Provider Status",
        description: "Check AI provider health and availability",
        shortcut: "/status",
        color: getSystemColor("status"),
        action: () => {
          runSubmit("/status");
          onClose();
        },
      },
      {
        id: "history",
        label: "History",
        description: "Show recent conversation history",
        shortcut: "/history",
        color: getSystemColor("history"),
        action: () => {
          runSubmit("/history");
          onClose();
        },
      },
      {
        id: "export",
        label: "Export Chat",
        description: "Export current chat as plain text",
        shortcut: "/export",
        color: getSystemColor("export"),
        action: () => {
          runSubmit("/export");
          onClose();
        },
      },
      ...THEMES.map((th) => ({
        id: `theme_${th}`,
        label: `Theme: ${th.charAt(0).toUpperCase()}${th.slice(1)}`,
        description: `Switch terminal to ${th} color theme`,
        color: THEME_INK[th][mode].primary,
        action: () => {
          onThemeChange(th);
          onClose();
        },
      })),
    ],
    [getSystemColor, onClear, onClose, onThemeChange, runSubmit, mode],
  );

  const filtered = useMemo(() => {
    if (search === "") return commands;
    const q = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q),
    );
  }, [commands, search]);

  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  const handleClose = useCallback(() => {
    setSearch("");
    setHighlightedIndex(0);
    setActiveTab("commands");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setHighlightedIndex(0);
      setActiveTab("commands");
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (activeTab !== "commands") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredRef.current.length === 0
            ? 0
            : (prev + 1) % filteredRef.current.length,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredRef.current.length === 0
            ? 0
            : (prev - 1 + filteredRef.current.length) %
              filteredRef.current.length,
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        filteredRef.current[highlightedIndexRef.current]?.action();
        return;
      }
      if (e.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;
        const focusables =
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose, activeTab]);

  const handleItemFocus = useCallback(
    (e: FocusEvent<HTMLButtonElement>, cmdColor: string) => {
      e.currentTarget.style.outline = `2px solid ${cmdColor}88`;
      e.currentTarget.style.outlineOffset = "2px";
    },
    [],
  );

  const handleItemBlur = useCallback(
    (e: FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.outline = "none";
    },
    [],
  );

  const handleInputFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.outline = `2px solid ${color}66`;
      e.currentTarget.style.outlineOffset = "2px";
    },
    [color],
  );

  const handleInputBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.outline = "none";
    },
    [],
  );

  const handleCloseButtonFocus = useCallback(
    (e: FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.outline = `2px solid ${color}66`;
      e.currentTarget.style.outlineOffset = "2px";
    },
    [color],
  );

  const handleCloseButtonBlur = useCallback(
    (e: FocusEvent<HTMLButtonElement>) => {
      e.currentTarget.style.outline = "none";
    },
    [],
  );

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [],
  );

  const TABS: Array<{ id: PaletteTab; label: string }> = [
    { id: "commands", label: "COMMANDS" },
    { id: "privacy", label: "PRIVACY" },
    { id: "about", label: "ABOUT" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: overlay, willChange: "opacity" }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-16 sm:top-24 z-50 w-full max-w-lg -translate-x-1/2 rounded-lg overflow-hidden"
            style={{
              background: panelBg,
              border: `1px solid ${color}44`,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              willChange: "transform, opacity",
              boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 24px ${color}22`,
              maxHeight: "88dvh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${color}22` }}
            >
              <span
                className="text-xs font-mono font-bold shrink-0"
                style={{ color }}
              >
                CMD
              </span>
              {activeTab === "commands" ? (
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Search commands\u2026"
                  autoFocus
                  aria-label="Search commands"
                  aria-autocomplete="list"
                  aria-controls="command-palette-list"
                  aria-activedescendant={
                    filtered[highlightedIndex]
                      ? `cp-item-${filtered[highlightedIndex]!.id}`
                      : undefined
                  }
                  className="flex-1 bg-transparent outline-none text-xs font-mono"
                  style={{ color, caretColor: color }}
                  autoComplete="off"
                  spellCheck={false}
                />
              ) : (
                <span
                  className="flex-1 text-xs font-mono"
                  style={{ color: `${color}88` }}
                >
                  {activeTab === "privacy"
                    ? "Privacy Policy"
                    : "About & Developer"}
                </span>
              )}
              <button
                type="button"
                onClick={handleClose}
                onFocus={handleCloseButtonFocus}
                onBlur={handleCloseButtonBlur}
                className="text-xs font-mono shrink-0 px-1.5 py-0.5 rounded outline-none"
                style={{
                  color: `${color}66`,
                  border: `1px solid ${color}22`,
                  background: "transparent",
                  transition: "color 150ms ease, border-color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = color;
                  e.currentTarget.style.borderColor = `${color}55`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${color}66`;
                  e.currentTarget.style.borderColor = `${color}22`;
                }}
                aria-label="Close command palette"
              >
                ESC
              </button>
            </div>

            <div
              className="flex shrink-0"
              style={{ borderBottom: `1px solid ${color}22` }}
              role="tablist"
              aria-label="Palette sections"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`palette-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 py-2 text-xs font-mono font-bold tracking-wider outline-none transition-all duration-150"
                    style={{
                      color: isActive ? color : `${color}44`,
                      borderBottom: isActive
                        ? `2px solid ${color}`
                        : "2px solid transparent",
                      background: isActive
                        ? `${color}08`
                        : "transparent",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${color}44`;
                      e.currentTarget.style.outlineOffset = "-2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "commands" && (
              <div
                id="palette-panel-commands"
                role="tabpanel"
                aria-label="Commands panel"
                className="flex flex-col overflow-hidden"
                style={{ maxHeight: "60dvh" }}
              >
                <div
                  id="command-palette-list"
                  role="listbox"
                  aria-label="Available commands"
                  className="flex-1 overflow-y-auto"
                  style={{ overscrollBehavior: "contain" }}
                >
                  {filtered.length === 0 && (
                    <p
                      className="text-xs font-mono text-center py-6"
                      style={{ color: `${color}44` }}
                    >
                      No commands found
                    </p>
                  )}
                  {filtered.map((cmd, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <button
                        type="button"
                        key={cmd.id}
                        id={`cp-item-${cmd.id}`}
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        role="option"
                        aria-selected={isHighlighted}
                        onClick={cmd.action}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onFocus={(e) => {
                          handleItemFocus(e, cmd.color);
                          setHighlightedIndex(idx);
                        }}
                        onBlur={handleItemBlur}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 outline-none"
                        style={{
                          borderBottom: `1px solid ${color}11`,
                          background: isHighlighted
                            ? `${cmd.color}11`
                            : "transparent",
                        }}
                        aria-label={`${cmd.label}: ${cmd.description}`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: cmd.color,
                            boxShadow: isHighlighted
                              ? `0 0 6px ${cmd.color}`
                              : "none",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-mono font-bold truncate"
                            style={{ color: cmd.color }}
                          >
                            {cmd.label}
                          </p>
                          <p
                            className="text-xs font-mono truncate"
                            style={{ color: `${cmd.color}88` }}
                          >
                            {cmd.description}
                          </p>
                        </div>
                        {cmd.shortcut && (
                          <span
                            className="text-xs font-mono shrink-0 px-1.5 py-0.5 rounded"
                            style={{
                              color: `${cmd.color}88`,
                              border: `1px solid ${cmd.color}33`,
                            }}
                          >
                            {cmd.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="px-4 py-2 flex items-center justify-between shrink-0"
                  style={{ borderTop: `1px solid ${color}11` }}
                >
                  <span
                    className="text-xs font-mono"
                    style={{ color: `${color}44` }}
                  >
                    {NAV_UP}{NAV_DOWN} navigate
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: `${color}44` }}
                  >
                    {NAV_ENTER} select
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: `${color}44` }}
                  >
                    esc close
                  </span>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div
                id="palette-panel-privacy"
                role="tabpanel"
                aria-label="Privacy policy panel"
                className="overflow-y-auto px-4 py-4 space-y-4"
                style={{
                  maxHeight: "60dvh",
                  overscrollBehavior: "contain",
                }}
              >
                <div className="space-y-1">
                  <p
                    className="text-xs font-mono font-bold tracking-widest"
                    style={{ color }}
                  >
                    ASHU AI ASSISTANT — PRIVACY POLICY
                  </p>
                  <p
                    className="text-xs font-mono"
                    style={{ color: `${color}66` }}
                  >
                    Last updated: 2026 &mdash; Your data is protected by design.
                  </p>
                </div>

                {PRIVACY_SECTIONS.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-lg p-3"
                    style={{
                      background: `${color}08`,
                      border: `1px solid ${color}22`,
                    }}
                  >
                    <p
                      className="text-xs font-mono font-bold mb-1.5 tracking-wider"
                      style={{ color }}
                    >
                      {section.title}
                    </p>
                    <p
                      className="text-xs font-mono leading-relaxed"
                      style={{
                        color: `${color}cc`,
                        textAlign: "justify",
                      }}
                    >
                      {section.content}
                    </p>
                  </div>
                ))}

                <div
                  className="rounded-lg p-3 mt-2"
                  style={{
                    background: `${color}05`,
                    border: `1px solid ${color}18`,
                  }}
                >
                  <p
                    className="text-xs font-mono text-center"
                    style={{ color: `${color}66` }}
                  >
                    &copy; 2026 ASHU AI Assistant &mdash; Built with integrity
                    by AWS &mdash; Arshad Wasib Shaik
                  </p>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div
                id="palette-panel-about"
                role="tabpanel"
                aria-label="About and developer panel"
                className="overflow-y-auto px-4 py-4 space-y-4"
                style={{
                  maxHeight: "60dvh",
                  overscrollBehavior: "contain",
                }}
              >
                <div className="space-y-1">
                  <p
                    className="text-xs font-mono font-bold tracking-widest"
                    style={{ color }}
                  >
                    ASHU AI ASSISTANT v2.0
                  </p>
                  <p
                    className="text-xs font-mono leading-relaxed"
                    style={{ color: `${color}88` }}
                  >
                    Advanced System Holographic Unified Artificial Intelligence
                    Assistant — a multi-provider AI terminal with holographic UI,
                    memory system, voice agent, and intelligent fallback routing.
                  </p>
                </div>

                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}22`,
                  }}
                >
                  <p
                    className="text-xs font-mono font-bold tracking-wider"
                    style={{ color }}
                  >
                    TECH STACK
                  </p>
                  {[
                    ["Frontend", "Next.js 15 + TypeScript + Framer Motion"],
                    ["Backend", "FastAPI + Python 3.14 + Uvicorn"],
                    ["Database", "Supabase PostgreSQL + Auth"],
                    ["AI Providers", "Gemini, Groq, Mistral, OpenAI, Claude, Grok + 7 more"],
                    ["Deployment", "Vercel + Hugging Face Spaces"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start gap-2 flex-wrap"
                    >
                      <span
                        className="text-xs font-mono shrink-0 w-24"
                        style={{ color: `${color}66` }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: `${color}cc` }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-lg p-3 space-y-3"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}22`,
                  }}
                >
                  <div>
                    <p
                      className="text-xs font-mono font-bold tracking-wider mb-0.5"
                      style={{ color }}
                    >
                      DEVELOPER
                    </p>
                    <p
                      className="text-xs font-mono"
                      style={{ color: `${color}cc` }}
                    >
                      AWS &mdash; Arshad Wasib Shaik
                    </p>
                    <p
                      className="text-xs font-mono"
                      style={{ color: `${color}66` }}
                    >
                      Full-Stack AI Engineer &mdash; Open to opportunities
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <HolographicLinkButton
                      href={DEVELOPER_LINKS.linkedin}
                      label="LinkedIn"
                      ariaLabel="Visit developer LinkedIn profile of Arshad Wasib Shaik"
                      primaryColor={linkedinColor}
                      glowColor={linkedinColor}
                      icon="linkedin"
                      fontSize="0.75rem"
                    />
                    <HolographicLinkButton
                      href={DEVELOPER_LINKS.github}
                      label="GitHub"
                      ariaLabel="Visit developer GitHub repository of Arshad Wasib Shaik"
                      primaryColor={githubColor}
                      glowColor={color}
                      icon="github"
                      fontSize="0.75rem"
                    />
                  </div>
                </div>

                <div
                  className="rounded-lg p-3"
                  style={{
                    background: `${color}05`,
                    border: `1px solid ${color}18`,
                  }}
                >
                  <p
                    className="text-xs font-mono text-center"
                    style={{ color: `${color}66` }}
                  >
                    &copy; 2026 ASHU AI Assistant &mdash; AWS - Arshad Wasib
                    Shaik &mdash; Built with integrity and passion for AI technology and human-computer interaction. All rights reserved. 
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(CommandPaletteInner);