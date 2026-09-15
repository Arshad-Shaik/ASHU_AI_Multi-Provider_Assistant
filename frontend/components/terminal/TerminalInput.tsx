// frontend/components/terminal/TerminalInput.tsx
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  memo,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalTheme, CommandType } from "@/types";
import { parseCommand } from "@/lib/utils/commandParser";
import { useTheme } from "@/hooks/useTheme";
import VoiceController from "@/components/voice/VoiceController";

const STAR_GLYPH = "\u2731";
const Z_SUGGESTIONS = 55;

export interface TerminalInputHandle {
  focus: () => void;
  setValue: (text: string) => void;
}

export interface TerminalInputProps {
  theme?: TerminalTheme;
  onSubmit: (input: string) => Promise<void>;
  isLoading?: boolean;
  sessionId?: string;
  voiceAgentEnabled?: boolean;
  voiceAgentSpeaking?: boolean;
  voiceAgentSupported?: boolean;
  voiceAgentLastSpoken?: string | null;
  onVoiceAgentToggle?: () => void;
}

interface ThemeStyle {
  bg: string;
  border: string;
  borderActive: string;
  text: string;
  glow: string;
  dim: string;
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
    dark: { bg: "rgba(0,8,0,0.9)", border: "#00ff8822", borderActive: "#00ff8866", text: "#00ff88", glow: "#00ff88", dim: "#00ff8866" },
    light: { bg: "rgba(230,250,240,0.92)", border: "#046b3a33", borderActive: "#046b3a66", text: "#046b3a", glow: "#046b3a", dim: "#046b3a88" },
  },
  cyberpunk: {
    dark: { bg: "rgba(8,0,4,0.9)", border: "#ff008822", borderActive: "#ff008866", text: "#ff0088", glow: "#ff0088", dim: "#ff008866" },
    light: { bg: "rgba(255,235,245,0.92)", border: "#99005c33", borderActive: "#99005c66", text: "#99005c", glow: "#99005c", dim: "#99005c88" },
  },
  holographic: {
    dark: { bg: "rgba(0,4,8,0.9)", border: "#00ffff22", borderActive: "#00ffff66", text: "#00ffff", glow: "#00ffff", dim: "#00ffff66" },
    light: { bg: "rgba(230,250,255,0.92)", border: "#00667733", borderActive: "#00667766", text: "#006677", glow: "#006677", dim: "#00667788" },
  },
  neon: {
    dark: { bg: "rgba(4,0,8,0.9)", border: "#b400ff22", borderActive: "#b400ff66", text: "#b400ff", glow: "#b400ff", dim: "#b400ff66" },
    light: { bg: "rgba(245,235,255,0.92)", border: "#6a00b333", borderActive: "#6a00b366", text: "#6a00b3", glow: "#6a00b3", dim: "#6a00b388" },
  },
  cyber: {
    dark: { bg: "rgba(0,2,8,0.9)", border: "#0088ff22", borderActive: "#0088ff66", text: "#0088ff", glow: "#0088ff", dim: "#0088ff66" },
    light: { bg: "rgba(230,240,255,0.92)", border: "#004a9933", borderActive: "#004a9966", text: "#004a99", glow: "#004a99", dim: "#004a9988" },
  },
  plasma: {
    dark: { bg: "rgba(8,2,0,0.9)", border: "#ff440022", borderActive: "#ff440066", text: "#ff4400", glow: "#ff4400", dim: "#ff440066" },
    light: { bg: "rgba(255,240,230,0.92)", border: "#b32d0033", borderActive: "#b32d0066", text: "#b32d00", glow: "#b32d00", dim: "#b32d0088" },
  },
  aurora: {
    dark: { bg: "rgba(0,8,6,0.9)", border: "#00ffcc22", borderActive: "#00ffcc66", text: "#00ffcc", glow: "#00ffcc", dim: "#00ffcc66" },
    light: { bg: "rgba(230,255,250,0.92)", border: "#007a6633", borderActive: "#007a6666", text: "#007a66", glow: "#007a66", dim: "#007a6688" },
  },
  inferno: {
    dark: { bg: "rgba(8,4,0,0.9)", border: "#ff880022", borderActive: "#ff880066", text: "#ff8800", glow: "#ff8800", dim: "#ff880066" },
    light: { bg: "rgba(255,245,230,0.92)", border: "#b35f0033", borderActive: "#b35f0066", text: "#b35f00", glow: "#b35f00", dim: "#b35f0088" },
  },
  ghost: {
    dark: { bg: "rgba(2,2,8,0.9)", border: "#aaaaff22", borderActive: "#aaaaff66", text: "#aaaaff", glow: "#aaaaff", dim: "#aaaaff66" },
    light: { bg: "rgba(240,240,255,0.92)", border: "#4c4c9933", borderActive: "#4c4c9966", text: "#4c4c99", glow: "#4c4c99", dim: "#4c4c9988" },
  },
  crimson: {
    dark: { bg: "rgba(8,0,2,0.9)", border: "#ff224422", borderActive: "#ff224466", text: "#ff2244", glow: "#ff2244", dim: "#ff224466" },
    light: { bg: "rgba(255,230,235,0.92)", border: "#99001a33", borderActive: "#99001a66", text: "#99001a", glow: "#99001a", dim: "#99001a88" },
  },
};

interface CommandHint {
  color: string;
  label: string;
  placeholder: string;
}

interface CommandHintPair {
  dark: CommandHint;
  light: CommandHint;
}

const COMMAND_HINTS: Record<CommandType, CommandHintPair> = {
  "@": {
    dark: { color: "#00ff88", label: "EXPERT", placeholder: "Ask for PhD-level explanation..." },
    light: { color: "#00a35c", label: "EXPERT", placeholder: "Ask for PhD-level explanation..." },
  },
  "$": {
    dark: { color: "#0088ff", label: "CODE", placeholder: "Paste code to analyze..." },
    light: { color: "#0056b3", label: "CODE", placeholder: "Paste code to analyze..." },
  },
  "#": {
    dark: { color: "#ff8800", label: "MEMORY", placeholder: "Type prompt — AI response saved with unique ID..." },
    light: { color: "#b35f00", label: "MEMORY", placeholder: "Type prompt — AI response saved with unique ID..." },
  },
  "*": {
    dark: { color: "#b400ff", label: "REGEN", placeholder: "Paste memory ID to regenerate response..." },
    light: { color: "#7a00b3", label: "REGEN", placeholder: "Paste memory ID to regenerate response..." },
  },
  [STAR_GLYPH]: {
    dark: { color: "#b400ff", label: "REGEN", placeholder: "Paste memory ID to regenerate response..." },
    light: { color: "#7a00b3", label: "REGEN", placeholder: "Paste memory ID to regenerate response..." },
  },
  "default": {
    dark: { color: "#00ffff", label: "CHAT", placeholder: "Type a message or use @, $, #, * commands..." },
    light: { color: "#007a8c", label: "CHAT", placeholder: "Type a message or use @, $, #, * commands..." },
  },
  "slash": {
    dark: { color: "#ff0088", label: "CMD", placeholder: "Enter /help, /clear, /status, /export..." },
    light: { color: "#b3005c", label: "CMD", placeholder: "Enter /help, /clear, /status, /export..." },
  },
};

const SUGGESTIONS: string[] = [
  "@ explain machine learning from scratch",
  "@ what is quantum computing",
  "$ analyze this code",
  "# explain recursion",
  "# how does async await work",
  "/help",
  "/status",
  "/clear",
  "/export",
];

const SendIcon = memo(function SendIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
});

const TerminalInput = forwardRef<TerminalInputHandle, TerminalInputProps>(
  function TerminalInputInner(
    {
      theme = "matrix",
      onSubmit,
      isLoading = false,
      voiceAgentEnabled = false,
      voiceAgentSpeaking = false,
      voiceAgentSupported = false,
      voiceAgentLastSpoken = null,
      onVoiceAgentToggle,
    },
    ref,
  ) {
    const [mounted, setMounted] = useState(false);
    const [inputValue, setInputValue] = useState<string>(() => {
      if (typeof window === "undefined") return "";
      try { return window.localStorage.getItem("ashu-terminal-draft") ?? ""; }
      catch { return ""; }
    });
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const domInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    const { resolvedMode } = useTheme();
    const mode = resolveMode(resolvedMode);
    const s = THEME_STYLES[theme][mode];

    const parsed = useMemo(() => parseCommand(inputValue), [inputValue]);

    const hint = useMemo<CommandHint>(() => {
      const pair = COMMAND_HINTS[parsed.type] ?? COMMAND_HINTS["default"];
      return pair[mode];
    }, [parsed.type, mode]);

    const filteredSuggestions = useMemo(
      () =>
        inputValue.length > 0
          ? SUGGESTIONS.filter(
              (sg) =>
                sg.toLowerCase().includes(inputValue.toLowerCase()) &&
                sg !== inputValue,
            ).slice(0, 5)
          : [],
      [inputValue],
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          domInputRef.current?.focus();
        },
        setValue: (text: string) => {
          setInputValue(text);
          try { window.localStorage.setItem("ashu-terminal-draft", text); } catch { return; }
          domInputRef.current?.focus();
        },
      }),
      [],
    );

    const handleSubmit = useCallback(async () => {
      const trimmed = inputValue.trim();
      if (!trimmed || isLoading) return;
      historyRef.current = [trimmed, ...historyRef.current.slice(0, 49)];
      historyIndexRef.current = -1;
      setInputValue("");
      setShowSuggestions(false);
      try { window.localStorage.removeItem("ashu-terminal-draft"); } catch { return; }
      await onSubmit(trimmed);
    }, [inputValue, isLoading, onSubmit]);

    const handleKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          void handleSubmit();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const nextIdx = Math.min(
            historyIndexRef.current + 1,
            historyRef.current.length - 1,
          );
          historyIndexRef.current = nextIdx;
          const histVal = historyRef.current[nextIdx];
          if (histVal !== undefined) setInputValue(histVal);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIdx = Math.max(historyIndexRef.current - 1, -1);
          historyIndexRef.current = nextIdx;
          setInputValue(
            nextIdx === -1 ? "" : (historyRef.current[nextIdx] ?? ""),
          );
          return;
        }
        if (e.key === "Escape") {
          setShowSuggestions(false);
          return;
        }
        if (e.key === "Tab" && filteredSuggestions.length > 0) {
          e.preventDefault();
          const first = filteredSuggestions[0];
          if (first !== undefined) {
            setInputValue(first);
            setShowSuggestions(false);
          }
        }
      },
      [handleSubmit, filteredSuggestions],
    );

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(val.length > 0);
    historyIndexRef.current = -1;
    try { window.localStorage.setItem("ashu-terminal-draft", val); } catch { return; }
  }, []);

    const handleSuggestionClick = useCallback((sg: string) => {
      setInputValue(sg);
      setShowSuggestions(false);
      domInputRef.current?.focus();
    }, []);

    const handleFocus = useCallback(() => setIsFocused(true), []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      window.setTimeout(() => setShowSuggestions(false), 160);
    }, []);

    const canSend = inputValue.trim().length > 0 && !isLoading;

    return (
      <div
        className="relative shrink-0 w-full"
        style={{
          background: s.bg,
          borderTop: `1px solid ${s.border}`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          minHeight: "3.5rem",
          zIndex: 20,
        }}
      >
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full left-0 right-0 border rounded-t overflow-hidden"
              style={{
                background: s.bg,
                borderColor: s.borderActive,
                zIndex: Z_SUGGESTIONS,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              role="listbox"
              aria-label="Command suggestions"
            >
              {filteredSuggestions.map((sg) => (
                <button
                  type="button"
                  key={sg}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(sg);
                  }}
                  aria-label={`Use suggestion: ${sg}`}
                  role="option"
                  aria-selected={false}
                  className="w-full text-left px-4 py-2 text-xs font-mono transition-colors duration-100 outline-none"
                  style={{ color: s.dim, background: "transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${s.glow}11`;
                    e.currentTarget.style.color = s.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = s.dim;
                  }}
                >
                  {sg}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-3 py-2.5 min-w-0 w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.div
              animate={
                isFocused
                  ? { opacity: [1, 0.3, 1] }
                  : { opacity: 0.5 }
              }
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-4 rounded-sm"
              style={{ background: hint.color, willChange: "opacity" }}
            />
            <span
              className="text-xs font-mono font-bold whitespace-nowrap hidden sm:inline"
              style={{ color: hint.color, minWidth: "3rem" }}
            >
              {hint.label}
            </span>
          </div>

          <input
            ref={domInputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={hint.placeholder}
            disabled={isLoading}
            className="flex-1 min-w-0 bg-transparent outline-none text-xs font-mono placeholder:opacity-40"
            style={{
              color: s.text,
              caretColor: hint.color,
              fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
              minHeight: "2.5rem",
              WebkitAppearance: "none",
            }}
            aria-label="Terminal input — type a message or command"
            aria-autocomplete="list"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
          />

          {voiceAgentSupported && onVoiceAgentToggle && (
            <VoiceController
              isEnabled={voiceAgentEnabled}
              isSpeaking={voiceAgentSpeaking}
              isSupported={voiceAgentSupported}
              lastSpokenText={voiceAgentLastSpoken}
              theme={theme}
              onToggle={onVoiceAgentToggle}
            />
          )}

          <motion.button
            type="button"
            whileTap={mounted && canSend ? { scale: 0.88 } : {}}
            onClick={() => void handleSubmit()}
            disabled={!mounted || !canSend}
            aria-label="Send message"
            className="w-9 h-9 rounded flex items-center justify-center shrink-0 transition-all duration-150 outline-none"
            style={{
              background: mounted && canSend ? `${hint.color}22` : "transparent",
              border: `1px solid ${mounted && canSend ? hint.color : s.border}`,
              color: mounted && canSend ? hint.color : s.dim,
              minWidth: "2.25rem",
              minHeight: "2.25rem",
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${hint.color}88`;
              e.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
            }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 rounded-full"
                style={{
                  border: `1.5px solid ${s.dim}44`,
                  borderTopColor: s.glow,
                  willChange: "transform",
                }}
              />
            ) : (
              <SendIcon />
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${s.glow}cc, transparent)`,
                transformOrigin: "center",
                willChange: "transform",
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  },
);

export default memo(TerminalInput);