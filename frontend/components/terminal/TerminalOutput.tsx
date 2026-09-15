// frontend/components/terminal/TerminalOutput.tsx
"use client";

import {
  useEffect,
  useRef,
  useCallback,
  memo,
  useState,
} from "react";
import type { FocusEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { TerminalLine, TerminalTheme, CommandType } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { stripThinkingTags } from "@/lib/utils/sanitizer";

interface TerminalOutputProps {
  lines: TerminalLine[];
  theme?: TerminalTheme;
  isStreaming?: boolean;
  onMemoryIdClick?: (id: string) => void;
  onCommandClick?: (cmd: string) => void;
  onRetry?: (content: string) => void;
}

interface ThemeStyle {
  text: string;
  dim: string;
  glow: string;
  border: string;
  userBg: string;
  errorColor: string;
  systemColor: string;
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
    dark: { text: "#00ff41", dim: "#00aa2a", glow: "#00ff4133", border: "#00ff4122", userBg: "#00ff4108", errorColor: "#ff4444", systemColor: "#00aa2a" },
    light: { text: "#046b3a", dim: "#035c30", glow: "#046b3a33", border: "#046b3a22", userBg: "#046b3a08", errorColor: "#cc2222", systemColor: "#035c30" },
  },
  cyberpunk: {
    dark: { text: "#ff0088", dim: "#aa0055", glow: "#ff008833", border: "#ff008822", userBg: "#ff008808", errorColor: "#ff4444", systemColor: "#aa0055" },
    light: { text: "#99005c", dim: "#7a004a", glow: "#99005c33", border: "#99005c22", userBg: "#99005c08", errorColor: "#cc2222", systemColor: "#7a004a" },
  },
  holographic: {
    dark: { text: "#00ffff", dim: "#0099aa", glow: "#00ffff33", border: "#00ffff22", userBg: "#00ffff08", errorColor: "#ff4444", systemColor: "#0099aa" },
    light: { text: "#006677", dim: "#00505c", glow: "#00667733", border: "#00667722", userBg: "#00667708", errorColor: "#cc2222", systemColor: "#00505c" },
  },
  neon: {
    dark: { text: "#b400ff", dim: "#7700aa", glow: "#b400ff33", border: "#b400ff22", userBg: "#b400ff08", errorColor: "#ff4444", systemColor: "#7700aa" },
    light: { text: "#6a00b3", dim: "#55008f", glow: "#6a00b333", border: "#6a00b322", userBg: "#6a00b308", errorColor: "#cc2222", systemColor: "#55008f" },
  },
  cyber: {
    dark: { text: "#00d4ff", dim: "#0088aa", glow: "#00d4ff33", border: "#00d4ff22", userBg: "#00d4ff08", errorColor: "#ff4444", systemColor: "#0088aa" },
    light: { text: "#004a99", dim: "#003b7a", glow: "#004a9933", border: "#004a9922", userBg: "#004a9908", errorColor: "#cc2222", systemColor: "#003b7a" },
  },
  plasma: {
    dark: { text: "#ff4400", dim: "#aa2200", glow: "#ff440033", border: "#ff440022", userBg: "#ff440008", errorColor: "#ff6666", systemColor: "#aa2200" },
    light: { text: "#b32d00", dim: "#8f2400", glow: "#b32d0033", border: "#b32d0022", userBg: "#b32d0008", errorColor: "#cc2222", systemColor: "#8f2400" },
  },
  aurora: {
    dark: { text: "#00ffcc", dim: "#00aaaa", glow: "#00ffcc33", border: "#00ffcc22", userBg: "#00ffcc08", errorColor: "#ff4444", systemColor: "#00aaaa" },
    light: { text: "#007a66", dim: "#006352", glow: "#007a6633", border: "#007a6622", userBg: "#007a6608", errorColor: "#cc2222", systemColor: "#006352" },
  },
  inferno: {
    dark: { text: "#ff8800", dim: "#aa5500", glow: "#ff880033", border: "#ff880022", userBg: "#ff880008", errorColor: "#ff4444", systemColor: "#aa5500" },
    light: { text: "#b35f00", dim: "#8f4c00", glow: "#b35f0033", border: "#b35f0022", userBg: "#b35f0008", errorColor: "#cc2222", systemColor: "#8f4c00" },
  },
  ghost: {
    dark: { text: "#aaaaff", dim: "#7777aa", glow: "#aaaaff33", border: "#aaaaff22", userBg: "#aaaaff08", errorColor: "#ff4444", systemColor: "#7777aa" },
    light: { text: "#4c4c99", dim: "#3d3d7a", glow: "#4c4c9933", border: "#4c4c9922", userBg: "#4c4c9908", errorColor: "#cc2222", systemColor: "#3d3d7a" },
  },
  crimson: {
    dark: { text: "#ff2244", dim: "#aa1122", glow: "#ff224433", border: "#ff224422", userBg: "#ff224408", errorColor: "#ff6666", systemColor: "#aa1122" },
    light: { text: "#99001a", dim: "#7a0015", glow: "#99001a33", border: "#99001a22", userBg: "#99001a08", errorColor: "#cc2222", systemColor: "#7a0015" },
  },
};

const COMMAND_COLORS: Record<CommandType, { dark: string; light: string }> = {
  "@": { dark: "#00d4ff", light: "#004a99" },
  $: { dark: "#00ff41", light: "#046b3a" },
  "#": { dark: "#b400ff", light: "#6a00b3" },
  "*": { dark: "#ff8800", light: "#b35f00" },
  "\u2731": { dark: "#ff8800", light: "#b35f00" },
  default: { dark: "#7090b0", light: "#3d5670" },
  slash: { dark: "#00d4ff", light: "#004a99" },
};

const HELP_COMMANDS = [
  { cmd: "@ <topic>", desc: "Expert PhD-level explanation", color: "#00d4ff" },
  { cmd: "$ <code>", desc: "Code analysis with line-by-line breakdown", color: "#00ff41" },
  { cmd: "# <prompt>", desc: "Save response to memory with unique ID", color: "#b400ff" },
  { cmd: "* <memory_id>", desc: "Regenerate or extend a saved response", color: "#ff8800" },
  { cmd: "\u2731 <memory_id>", desc: "Same as * command", color: "#ff8800" },
  { cmd: "/help", desc: "Show this help message", color: "#00d4ff" },
  { cmd: "/clear", desc: "Clear terminal", color: "#00d4ff" },
  { cmd: "/status", desc: "Show provider status", color: "#00d4ff" },
  { cmd: "/providers", desc: "List all AI providers", color: "#00d4ff" },
  { cmd: "/history", desc: "Show conversation history", color: "#00d4ff" },
  { cmd: "/export", desc: "Export chat history as PDF", color: "#00d4ff" },
  { cmd: "/theme", desc: "Cycle terminal theme", color: "#00d4ff" },
  { cmd: "/version", desc: "Show version info", color: "#00d4ff" },
  { cmd: "/login", desc: "Sign in or create an account", color: "#00d4ff" },
  { cmd: "/logout", desc: "Sign out", color: "#00d4ff" },
];

function formatTime12h(ts: string | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function isHelpOutput(content: string): boolean {
  return (
    content.includes("/help") ||
    content.includes("/clear") ||
    (content.includes("@ <") && content.includes("$ <"))
  );
}

function getCommandColor(
  cmdType: CommandType | undefined,
  mode: "dark" | "light",
): string {
  if (!cmdType) return COMMAND_COLORS.default[mode];
  return COMMAND_COLORS[cmdType]?.[mode] ?? COMMAND_COLORS.default[mode];
}

interface HelpOutputProps {
  ts: ThemeStyle;
  onCommandClick?: (cmd: string) => void;
}

const HelpOutput = memo(function HelpOutput({
  ts,
  onCommandClick,
}: HelpOutputProps) {
  return (
    <div
      className="flex flex-col gap-1 py-2"
      role="list"
      aria-label="Available commands"
    >
      <p
        className="text-xs font-bold mb-2 tracking-widest uppercase"
        style={{ color: ts.dim }}
      >
        ASHU AI ? Available Commands
      </p>
      {HELP_COMMANDS.map((item) => (
        <button
          type="button"
          key={item.cmd}
          role="listitem"
          onClick={() => onCommandClick?.(item.cmd)}
          className="flex items-start gap-3 text-left w-full px-2 py-1.5 rounded transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-white/40 group"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${item.color}11`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          aria-label={`Run command: ${item.cmd} ? ${item.desc}`}
        >
          <span
            className="text-xs font-mono font-bold shrink-0 w-36 truncate"
            style={{ color: item.color }}
          >
            {item.cmd}
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: ts.dim }}
          >
            {item.desc}
          </span>
        </button>
      ))}
    </div>
  );
});

interface MarkdownContentProps {
  content: string;
  ts: ThemeStyle;
}

const MarkdownContent = memo(function MarkdownContent({
  content,
  ts,
}: MarkdownContentProps) {
  const safeContent = stripThinkingTags(content);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? "");
          const isInline = !match;
          if (isInline) {
            return (
              <code
                className="px-1 py-0.5 rounded text-xs font-mono"
                style={{
                  background: `${ts.glow}`,
                  color: ts.text,
                  border: `1px solid ${ts.border}`,
                }}
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <div className="my-2 rounded overflow-hidden" style={{ border: `1px solid ${ts.border}` }}>
              <div
                className="flex items-center justify-between px-3 py-1"
                style={{
                  background: `${ts.border}`,
                  borderBottom: `1px solid ${ts.border}`,
                }}
              >
                <span
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: ts.dim }}
                >
                  {match[1]}
                </span>
              </div>
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: "0.75rem",
                  background: "rgba(0,0,0,0.6)",
                  fontSize: "0.75rem",
                  lineHeight: "1.5",
                }}
                codeTagProps={{
                  style: { fontFamily: "JetBrains Mono, Fira Code, monospace" },
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          );
        },
        p({ children }) {
          return (
            <p
              className="mb-2 last:mb-0 text-sm leading-relaxed"
              style={{ color: ts.text }}
            >
              {children}
            </p>
          );
        },
        h1({ children }) {
          return (
            <h1
              className="text-base font-bold mb-2 mt-3 first:mt-0"
              style={{ color: ts.text, borderBottom: `1px solid ${ts.border}`, paddingBottom: "0.25rem" }}
            >
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2
              className="text-sm font-bold mb-2 mt-3 first:mt-0"
              style={{ color: ts.text }}
            >
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3
              className="text-xs font-bold mb-1 mt-2 first:mt-0 uppercase tracking-wider"
              style={{ color: ts.dim }}
            >
              {children}
            </h3>
          );
        },
        ul({ children }) {
          return (
            <ul
              className="mb-2 pl-4 flex flex-col gap-0.5 list-none"
              style={{ color: ts.text }}
            >
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol
              className="mb-2 pl-4 flex flex-col gap-0.5 list-decimal"
              style={{ color: ts.text }}
            >
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li className="text-sm flex gap-2 items-start">
              <span style={{ color: ts.dim, flexShrink: 0 }}>&rsaquo;</span>
              <span>{children}</span>
            </li>
          );
        },
        strong({ children }) {
          return (
            <strong
              className="font-bold"
              style={{ color: ts.text }}
            >
              {children}
            </strong>
          );
        },
        em({ children }) {
          return (
            <em
              className="italic"
              style={{ color: ts.dim }}
            >
              {children}
            </em>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote
              className="pl-3 my-2 text-sm"
              style={{
                borderLeft: `2px solid ${ts.text}`,
                color: ts.dim,
              }}
            >
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table
                className="text-xs w-full border-collapse"
                style={{ borderColor: ts.border }}
              >
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th
              className="px-2 py-1 text-left font-bold text-xs"
              style={{
                color: ts.text,
                borderBottom: `1px solid ${ts.border}`,
                background: `${ts.border}`,
              }}
            >
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td
              className="px-2 py-1 text-xs"
              style={{
                color: ts.dim,
                borderBottom: `1px solid ${ts.border}22`,
              }}
            >
              {children}
            </td>
          );
        },
        a({ href, children }) {
          const hrefStr = href ?? "";
          const childStr = typeof children === "string" ? children.toLowerCase() : "";
          const isLinkedIn = hrefStr.includes("linkedin.com") || childStr.includes("linkedin");
          const isGitHub = hrefStr.includes("github.com") || childStr.includes("github");
          const isPortfolio = hrefStr.includes("portfolio") || childStr.includes("portfolio") || hrefStr.includes("tinyurl");
          const isDevLink = isLinkedIn || isGitHub || isPortfolio;
          if (isDevLink) {
            const glowColor = isLinkedIn ? "#0a66c2" : isGitHub ? "#6e40c9" : "#00d4aa";
            const label = isLinkedIn ? "LinkedIn" : isGitHub ? "GitHub" : "Portfolio";
            const icon = isLinkedIn ? "🔗" : isGitHub ? "💻" : "🌐";
            return (
              <a
                href={hrefStr}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${glowColor}88`,
                  background: `${glowColor}14`,
                  color: glowColor,
                  fontSize: "11px",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  textDecoration: "none",
                  cursor: "pointer",
                  boxShadow: `0 0 8px ${glowColor}55, inset 0 0 8px ${glowColor}11`,
                  animation: "ashu-glow-pulse 2s ease-in-out infinite",
                  transition: "box-shadow 0.2s ease, background 0.2s ease",
                  margin: "0 2px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 16px ${glowColor}99, inset 0 0 12px ${glowColor}22`;
                  e.currentTarget.style.background = `${glowColor}28`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 8px ${glowColor}55, inset 0 0 8px ${glowColor}11`;
                  e.currentTarget.style.background = `${glowColor}14`;
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </a>
            );
          }
          return (
            <a
              href={hrefStr}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-xs"
              style={{ color: ts.text }}
            >
              {children}
            </a>
          );
        },
        hr() {
          return (
            <hr
              className="my-3"
              style={{ borderColor: ts.border }}
            />
          );
        },
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
});

interface StreamingCursorProps {
  color: string;
}

const StreamingCursor = memo(function StreamingCursor({
  color,
}: StreamingCursorProps) {
  return (
    <motion.span
      className="inline-block w-2 h-4 ml-0.5 align-middle"
      style={{ background: color }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    />
  );
});

interface MemoryBadgeProps {
  memoryId: string;
  color: string;
  border: string;
  onMemoryIdClick?: (id: string) => void;
}

const MemoryBadge = memo(function MemoryBadge({
  memoryId,
  color,
  border,
  onMemoryIdClick,
}: MemoryBadgeProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      className="id-badge"
      onClick={() => onMemoryIdClick?.(memoryId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e: FocusEvent<HTMLButtonElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setHovered(false);
        }
      }}
      style={{
        color: hovered ? color : `${color}88`,
        borderColor: hovered ? color : border,
        background: hovered ? `${color}11` : "transparent",
      }}
      aria-label={`Click to use memory ID ${memoryId}`}
      title={`Memory ID: ${memoryId} ? Click to paste`}
    >
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {memoryId}
    </button>
  );
});

interface HashMemoryHintProps {
  memoryId: string | undefined;
  color: string;
  border: string;
  dim: string;
  onMemoryIdClick?: (id: string) => void;
}

const HashMemoryHint = memo(function HashMemoryHint({
  memoryId,
  color,
  dim,
  onMemoryIdClick,
}: HashMemoryHintProps) {
  if (!memoryId) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-2 px-3 py-2 rounded text-xs font-mono flex flex-col gap-1.5"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}33`,
      }}
      role="note"
      aria-label="Memory saved hint"
    >
      <div className="flex items-center gap-1.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: color }} className="font-bold tracking-wide">Response saved to memory</span>
      </div>
      <p style={{ color: dim }} className="leading-relaxed">
        This response is stored with ID{" "}
        <button
          type="button"
          onClick={() => onMemoryIdClick?.(memoryId)}
          className="font-bold underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: color, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
          aria-label={`Paste memory ID ${memoryId}`}
        >
          {memoryId}
        </button>
        . Use{" "}
        <button
          type="button"
          onClick={() => onMemoryIdClick?.(memoryId)}
          className="font-bold cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: color, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
          aria-label="Use star command with this ID"
        >
          * {memoryId}
        </button>
        {" "}or{" "}
        <button
          type="button"
          onClick={() => onMemoryIdClick?.(memoryId)}
          className="font-bold cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: color, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
          aria-label="Use star glyph command with this ID"
        >
          \u2731 {memoryId}
        </button>
        {" "}to regenerate or extend this response later. Tap the ID to paste it instantly.
      </p>
    </motion.div>
  );
});

interface SpeakButtonProps {
  content: string;
  color: string;
  border: string;
}

const SpeakButton = memo(function SpeakButton({
  content,
  color,
  border,
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const plain = content.replace(/[#*`_~[\]()>|]/g, " ").trim();
    const utt = new SpeechSynthesisUtterance(plain);
    utt.rate = 0.92;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        /female|woman|girl|zira|samantha|victoria|karen|moira|fiona|tessa/i.test(v.name),
    );
    if (female) utt.voice = female;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [content, speaking]);

  return (
    <button
      type="button"
      className={`speak-btn${speaking ? " speaking" : ""}`}
      onClick={handleSpeak}
      style={{
        color: speaking ? color : undefined,
        borderColor: speaking ? color : border,
      }}
      aria-label={speaking ? "Stop speaking" : "Speak this message"}
      title={speaking ? "Stop" : "Speak"}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        {speaking ? (
          <rect x="6" y="4" width="4" height="16" />
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </>
        )}
      </svg>
    </button>
  );
});

interface RetryButtonProps {
  onRetry: () => void;
  color: string;
  border: string;
}

const RetryButton = memo(function RetryButton({
  onRetry,
  color,
}: RetryButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    setPressed(true);
    onRetry();
    window.setTimeout(() => setPressed(false), 1200);
  }, [onRetry]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={handleClick}
      disabled={pressed}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-all duration-150 outline-none focus-visible:ring-2"
      style={{
        color: pressed ? `${color}66` : color,
        border: `1px solid ${pressed ? `${color}33` : color}`,
        background: pressed ? `${color}05` : `${color}11`,
        minHeight: "2rem",
        minWidth: "4.5rem",
        cursor: pressed ? "not-allowed" : "pointer",
      }}
      aria-label="Retry this message"
      title="Retry ? resend the same prompt"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
        style={{
          transform: pressed ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.4s ease",
        }}
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
      {pressed ? "Retrying?" : "Retry"}
    </motion.button>
  );
});

function TerminalOutputInner({
  lines,
  theme = "cyber",
  isStreaming = false,
  onMemoryIdClick,
  onCommandClick,
  onRetry,
}: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedMode } = useTheme();
  const mode = resolveMode(resolvedMode);
  const ts = THEME_STYLES[theme]?.[mode] ?? THEME_STYLES.cyber[mode];

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [lines, scrollToBottom]);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom("smooth");
    }
  }, [isStreaming, scrollToBottom]);

  if (lines.length === 0) {
    return (
      <div
        ref={containerRef}
        className="terminal-output scrollbar-terminal flex flex-col items-center justify-center"
        role="log"
        aria-label="Terminal output"
        aria-live="polite"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center px-4"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `${ts.glow}`,
              border: `1px solid ${ts.border}`,
              boxShadow: `0 0 20px ${ts.glow}`,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={ts.text}
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <p
            className="text-sm font-mono"
            style={{ color: ts.dim }}
          >
            ASHU AI ready. Type a message or{" "}
            <span style={{ color: ts.text }}>/help</span> to begin.
          </p>
        </motion.div>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="terminal-output scrollbar-terminal"
      role="log"
      aria-label="Terminal output"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {lines.map((line, idx) => {
          const isLast = idx === lines.length - 1;
          const showCursor = isLast && isStreaming && line.role === "assistant";
          const showHelp = !line.isStreaming && isHelpOutput(line.content);
          const cmdColor = getCommandColor(line.command_type, mode);
          const isHashCommand = line.command_type === "#";

          if (line.type === "input" || line.role === "user") {
            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bubble-user group"
              >
                <SpeakButton
                  content={line.content}
                  color={ts.text}
                  border={ts.border}
                />
                <div className="bubble-user-inner">
                  {line.command_type && line.command_type !== "default" && (
                    <span
                      className="command-badge mr-1.5 mb-1 inline-flex"
                      style={{ color: cmdColor, borderColor: `${cmdColor}55` }}
                    >
                      {line.command_type === "\u2731" ? "\u2731" : line.command_type}
                    </span>
                  )}
                  <p
                    className="text-sm font-mono break-words"
                    style={{ color: ts.text }}
                  >
                    {line.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="text-xs font-mono"
                      style={{ color: `${ts.dim}88` }}
                    >
                      {formatTime12h(line.timestamp)}
                    </span>
                    {onRetry && (
                      <span
                        className="text-xs font-mono flex items-center gap-1 md:hidden"
                        style={{ color: `${ts.dim}66` }}
                        title="Tap to resend this message"
                      >
                        <button
                          type="button"
                          onClick={() => onRetry(line.content)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                          style={{
                            color: `${ts.dim}88`,
                            border: `1px solid ${ts.border}`,
                            background: "transparent",
                            fontSize: "0.65rem",
                            minHeight: "1.5rem",
                          }}
                          aria-label="Resend this message"
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                          Resend
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }

          if (line.type === "error") {
            const lastUserLine = lines
              .slice(0, idx)
              .reverse()
              .find((l) => l.role === "user" || l.type === "input");

            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bubble-ai group"
              >
                <div
                  className="bubble-ai-inner"
                  style={{
                    borderColor: `${ts.errorColor}44`,
                    background: `${ts.errorColor}08`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={ts.errorColor}
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{ color: ts.errorColor }}
                    >
                      Error
                    </span>
                  </div>
                  <p
                    className="text-sm font-mono break-words"
                    style={{ color: ts.errorColor }}
                  >
                    {line.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className="text-xs font-mono"
                      style={{ color: `${ts.dim}88` }}
                    >
                      {formatTime12h(line.timestamp)}
                    </span>
                    {onRetry && lastUserLine?.content && (
                      <RetryButton
                        onRetry={() => onRetry(lastUserLine.content)}
                        color={ts.errorColor}
                        border={`${ts.errorColor}44`}
                      />
                    )}
                    <span
                      className="text-xs font-mono hidden md:inline"
                      style={{ color: `${ts.dim}55` }}
                    >
                      Press ↑ to recall prompt
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          }

          if (line.role === "system" || line.type === "system") {
            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="bubble-system"
              >
                <div className="bubble-system-inner">
                  <span style={{ color: ts.systemColor }}>
                    {line.content}
                  </span>
                  {line.timestamp && (
                    <span
                      className="ml-2"
                      style={{ color: `${ts.dim}66` }}
                    >
                      {formatTime12h(line.timestamp)}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bubble-ai group"
            >
              <div className="bubble-ai-inner">
                {line.command_type && line.command_type !== "default" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="command-badge"
                      style={{ color: cmdColor, borderColor: `${cmdColor}55` }}
                    >
                      {line.command_type === "\u2731" ? "\u2731" : line.command_type}
                    </span>
                    {line.provider_used && (
                      <span
                        className="provider-badge"
                        style={{ color: cmdColor, borderColor: `${cmdColor}44` }}
                      >
                        {line.provider_used}
                      </span>
                    )}
                  </div>
                )}

                {showHelp ? (
                  <HelpOutput ts={ts} onCommandClick={onCommandClick} />
                ) : (
                  <div className="prose-terminal">
                    <MarkdownContent content={line.content} ts={ts} />
                    {showCursor && <StreamingCursor color={ts.text} />}
                  </div>
                )}

                {isHashCommand && (
                  <HashMemoryHint
                    memoryId={line.memory_id}
                    color={COMMAND_COLORS["#"][mode]}
                    border={ts.border}
                    dim={ts.dim}
                    onMemoryIdClick={onMemoryIdClick}
                  />
                )}

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {line.memory_id && !isHashCommand && (
                    <MemoryBadge
                      memoryId={line.memory_id}
                      color={ts.text}
                      border={ts.border}
                      onMemoryIdClick={onMemoryIdClick}
                    />
                  )}
                  {line.provider_used && !line.command_type && (
                    <span
                      className="provider-badge"
                      style={{ color: `${ts.dim}`, borderColor: ts.border }}
                    >
                      {line.provider_used}
                    </span>
                  )}
                  {line.tokens_used !== undefined && line.tokens_used > 0 && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: `${ts.dim}66` }}
                    >
                      {line.tokens_used}t
                    </span>
                  )}
                  {line.latency_ms !== undefined && line.latency_ms > 0 && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: `${ts.dim}66` }}
                    >
                      {Math.round(line.latency_ms)}ms
                    </span>
                  )}
                  <span
                    className="text-xs font-mono ml-auto"
                    style={{ color: `${ts.dim}66` }}
                  >
                    {formatTime12h(line.timestamp)}
                  </span>
                  <SpeakButton
                    content={line.content}
                    color={ts.text}
                    border={ts.border}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

export default memo(TerminalOutputInner);
