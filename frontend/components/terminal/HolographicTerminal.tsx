// frontend/components/terminal/HolographicTerminal.tsx
"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  memo,
} from "react";
import NextImage from "next/image";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  TerminalTheme,
  ConversationMessage,
  TerminalLine,
  AnimationConfig,
  DeviceTier,
  ColorScheme,
} from "@/types";
import { useTerminal } from "@/hooks/useTerminal";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { isMemoryId } from "@/lib/utils/commandParser";
import TerminalOutput from "./TerminalOutput";
import TerminalInput from "./TerminalInput";
import type { TerminalInputHandle } from "./TerminalInput";
import ProviderStatusBar from "./ProviderStatusBar";
import MatrixRain from "@/components/animations/MatrixRain";
import HolographicGrid from "@/components/animations/HolographicGrid";
import ParticleField from "@/components/animations/ParticleField";
import ScanlineEffect from "@/components/animations/ScanlineEffect";
import GlitchText from "@/components/animations/GlitchText";
import ConversationPanel from "@/components/panels/ConversationPanel";
import MemoryPanel from "@/components/panels/MemoryPanel";
import AnalyticsDashboard from "@/components/panels/AnalyticsDashboard";
import AuthModal from "@/components/auth/AuthModal";
import CommandPalette from "@/components/ui/CommandPalette";
import DynamicFavicon from "@/components/ui/DynamicFavicon";
import LoadingBeam from "@/components/ui/LoadingBeam";
import AuthTransitionOverlay from "@/components/auth/AuthTransitionOverlay";
import HolographicLogoButton from "@/components/ui/HolographicLogoButton";

const Z_NAVBAR = 50;
const Z_CONTENT = 10;
const Z_DROPDOWN = 60;

type NavTier = "mobile" | "tablet" | "desktop" | "tv";

interface HolographicTerminalProps {
  initialTheme?: TerminalTheme;
}

interface ThemeConfig {
  primary: string;
  secondary: string;
  bg: string;
  border: string;
}

interface ThemeConfigPair {
  dark: ThemeConfig;
  light: ThemeConfig;
}

interface MacDotConfig {
  color: string;
  label: string;
  description: string;
  onClick: () => void;
}

interface MenuAction {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

const THEME_CONFIG: Record<TerminalTheme, ThemeConfigPair> = {
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

const THEMES: TerminalTheme[] = [
  "matrix", "cyberpunk", "holographic", "neon", "cyber",
  "plasma", "aurora", "inferno", "ghost", "crimson",
];

const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  dark: "Switch to light theme",
  light: "Switch to system theme",
  system: "Switch to dark theme",
};

function detectTier(): DeviceTier {
  if (typeof window === "undefined") return "high";
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile || cores <= 2) return "low";
  if (cores <= 4) return "mid";
  return "high";
}

function detectNavTier(): NavTier {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  const hasHover = window.matchMedia("(hover: hover)").matches;
  if (!hasHover && width >= 1280) return "tv";
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function buildAnimConfig(tier: DeviceTier): AnimationConfig {
  const configs: Record<DeviceTier, AnimationConfig> = {
    low: { tier, fps: 30, particleCount: 0, enableBloom: false, enableScanlines: false, enableGrid: false, enableMatrix: false, enableParticles: false },
    mid: { tier, fps: 60, particleCount: 25, enableBloom: false, enableScanlines: true, enableGrid: true, enableMatrix: false, enableParticles: true },
    high: { tier, fps: 60, particleCount: 60, enableBloom: true, enableScanlines: true, enableGrid: true, enableMatrix: true, enableParticles: true },
  };
  return configs[tier];
}

function messagesToTerminalLines(messages: ConversationMessage[]): TerminalLine[] {
  return messages.map((m) => ({
    id: m.id,
    type: m.role === "user" ? "input" : m.isError === true ? "error" : "output",
    role: m.role,
    content: m.content,
    command_type: m.command_type,
    memory_id: m.memory_id ?? undefined,
    provider_used: m.provider_used,
    timestamp: m.timestamp,
    isStreaming: m.isStreaming ?? false,
    tokens_used: m.tokens_used,
    latency_ms: m.latency_ms,
    session_id: m.session_id,
    is_regenerated: m.is_regenerated,
  })) as TerminalLine[];
}

function getInitials(name: string | undefined, email: string): string {
  const source = (name && name.trim()) || (email && email.trim()) || "";
  if (!source) return "AI";
  return source.slice(0, 2).toUpperCase();
}

function getDisplayName(name: string | undefined, email: string): string {
  if (name && name.trim().length > 0) return name;
  return email.split("@")[0] ?? email;
}

function getFirstName(name: string | undefined, email: string): string {
  const display =
    name && name.trim().length > 0 ? name.trim() : email.split("@")[0] ?? email;
  const parts = display.split(" ").filter(Boolean);
  if (parts.length === 0) return display;
  const first = parts[0] ?? display;
  const last = parts[parts.length - 1] ?? display;
  const lowerFirst = first.toLowerCase();
  const honorifics = ["mr", "mrs", "ms", "dr", "prof", "sir", "shaik", "sheikh", "md", "syed"];
  if (parts.length > 1 && honorifics.includes(lowerFirst)) return last;
  return first;
}

function buildPrintStyles(messages: ConversationMessage[]): string {
  const rows = messages
    .map((m) => {
      const role = m.role === "user" ? "YOU" : "ASHU AI";
      const time = m.timestamp
        ? new Date(m.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : "";
      const clean = m.content
        .replace(/[`*_~[\]()>|#]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      return `<div class="msg"><div class="msg-header"><strong>${role}</strong><span class="time">${time}</span></div><p>${clean}</p></div>`;
    })
    .join("");

  return `<html><head><title>ASHU AI \u2014 Chat Export</title><style>@page{margin:2cm}body{font-family:Georgia,serif;font-size:12pt;color:#111;line-height:1.6}h1{font-size:18pt;font-weight:bold;border-bottom:2pt solid #333;padding-bottom:6pt;margin-bottom:16pt}.meta{font-size:9pt;color:#555;margin-bottom:20pt}.msg{margin-bottom:14pt;padding:8pt 10pt;border-left:3pt solid #333;page-break-inside:avoid;text-align:justify}.msg-header{display:flex;justify-content:space-between;margin-bottom:4pt}.msg-header strong{font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5pt}.time{font-size:9pt;color:#777}p{margin:0;font-size:11pt}</style></head><body><h1>ASHU AI Assistant \u2014 Chat Export</h1><div class="meta">Exported: ${new Date().toLocaleString("en-US", { hour12: true })} &nbsp;|&nbsp; Messages: ${messages.length} &nbsp;|&nbsp; &copy; 2026 ASHU AI Assistant</div>${rows}</body></html>`;
}

function ModeIcon({ scheme }: { scheme: ColorScheme }) {
  if (scheme === "light") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
        <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
        <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
      </svg>
    );
  }
  if (scheme === "dark") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const MacDot = memo(function MacDot({ dot }: { dot: MacDotConfig }) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={dot.onClick}
        aria-label={`${dot.label}: ${dot.description}`}
        className="w-3 h-3 rounded-full transition-transform hover:scale-125 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        style={{ background: dot.color }}
      />
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-150"
        style={{
          background: "rgba(0,0,0,0.92)",
          border: `1px solid ${dot.color}55`,
          color: dot.color,
          zIndex: Z_DROPDOWN,
        }}
      >
        <span className="font-bold">{dot.label}</span>
        <span className="ml-1 opacity-70">{dot.description}</span>
      </div>
    </div>
  );
});

function AvatarShimmer({ primary }: { primary: string }) {
  return (
    <div
      className="w-9 h-9 rounded-md animate-pulse shrink-0"
      style={{ background: `${primary}22` }}
    />
  );
}

function HolographicTerminalInner({ initialTheme = "matrix" }: HolographicTerminalProps) {
  const [theme, setTheme] = useState<TerminalTheme>(initialTheme);
  const [tier, setTier] = useState<DeviceTier>("high");
  const [navTier, setNavTier] = useState<NavTier>("desktop");
  const [animConfig, setAnimConfig] = useState<AnimationConfig>(buildAnimConfig("high"));
  const [showConvPanel, setShowConvPanel] = useState(false);
  const [showMemPanel, setShowMemPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [avatarMenuIndex, setAvatarMenuIndex] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(56);

  const inputRef = useRef<TerminalInputHandle>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const headerRef = useRef<HTMLElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const { resolvedMode, colorScheme, setColorScheme } = useTheme();
  const mode: "dark" | "light" = resolvedMode === "light" ? "light" : "dark";
  const tc = THEME_CONFIG[theme][mode];

  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const speakThemeChangeRef = useRef<((theme: string, mode: string) => void) | null>(null);
  const resolvedModeRef = useRef<string>("dark");

  const handleThemeCycle = useCallback(() => {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev);
      const next = THEMES[(idx + 1) % THEMES.length] ?? prev;
      window.setTimeout(() => {
        const themeName = next.charAt(0).toUpperCase() + next.slice(1);
        speakThemeChangeRef.current?.(themeName, resolvedModeRef.current);
      }, 150);
      return next;
    });
  }, []);

  const handleLoginRequest = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleLogoutRequest = useCallback(() => {
    signOut().catch(() => undefined);
  }, [signOut]);

  const handleExportPdf = useCallback((msgs: ConversationMessage[]) => {
    if (typeof window === "undefined") return;
    const html = buildPrintStyles(msgs);
    if (printFrameRef.current) {
      document.body.removeChild(printFrameRef.current);
      printFrameRef.current = null;
    }
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none";
    document.body.appendChild(iframe);
    printFrameRef.current = iframe;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    const doPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => {
        if (printFrameRef.current) {
          document.body.removeChild(printFrameRef.current);
          printFrameRef.current = null;
        }
      }, 2000);
    };
    if (iframe.contentDocument?.readyState === "complete") {
      doPrint();
    } else {
      iframe.onload = doPrint;
    }
  }, []);

  const {
    messages,
    isLoading,
    isStreaming,
    currentProvider,
    sessionId,
    submitMessage,
    clearMessages,
  } = useTerminal(undefined, {
    onThemeToggle: handleThemeCycle,
    onLoginRequest: handleLoginRequest,
    onLogoutRequest: handleLogoutRequest,
    onExportPdf: handleExportPdf,
  });

  const {
    isEnabled: voiceEnabled,
    isSpeaking: voiceSpeaking,
    isSupported: voiceSupported,
    lastSpokenText: voiceLastSpoken,
    toggleAgent: toggleVoiceAgent,
    speakThemeChange,
    speak,
  } = useVoiceAgent();

  useEffect(() => {
    speakThemeChangeRef.current = speakThemeChange;
  }, [speakThemeChange]);

  useEffect(() => {
    resolvedModeRef.current = resolvedMode;
  }, [resolvedMode]);

  const handleColorSchemeCycle = useCallback(() => {
    const SCHEME_ORDER: Array<"dark" | "light" | "system"> = ["dark", "light", "system"];
    const current = SCHEME_ORDER.find((s) => s === colorScheme) ?? "dark";
    const next = SCHEME_ORDER[(SCHEME_ORDER.indexOf(current) + 1) % SCHEME_ORDER.length] ?? "dark";
    setColorScheme(next);
    window.setTimeout(() => {
      speakThemeChange(next, resolvedMode);
    }, 150);
  }, [colorScheme, resolvedMode, setColorScheme, speakThemeChange]);

  useEffect(() => {
    const detected = detectTier();
    setTier(detected);
    setAnimConfig(buildAnimConfig(detected));
  }, []);

  useEffect(() => {
    const update = () => setNavTier(detectNavTier());
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setNavbarHeight(entry.contentRect.height);
    });
    ro.observe(headerRef.current);
    setNavbarHeight(headerRef.current.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [isAuthenticated, navTier]);

  useEffect(() => {
    return () => {
      if (printFrameRef.current) {
        document.body.removeChild(printFrameRef.current);
        printFrameRef.current = null;
      }
    };
  }, []);

  const handleAuthRequired = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleSubmit = useCallback(
    async (input: string) => {
      await submitMessage(input, handleAuthRequired);
    },
    [submitMessage, handleAuthRequired],
  );

  const handleCommandButtonClick = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      const SLASH_COMMANDS = ["/help", "/clear", "/status", "/providers", "/history", "/export", "/theme", "/version", "/login", "/logout"];
      const isSlash = SLASH_COMMANDS.some((sc) => trimmed.startsWith(sc));
      const hasArg = /[<>]/.test(trimmed);
      if (isSlash && !hasArg) {
        window.setTimeout(() => void handleSubmit(trimmed), 0);
      } else {
        const pasteVal = hasArg ? trimmed.split(" ")[0] + " " : trimmed + " ";
        inputRef.current?.setValue(pasteVal ?? "");
        inputRef.current?.focus();
      }
    },
    [handleSubmit],
  );

  const handleIdClick = useCallback((id: string) => {
    const trimmed = id.trim();
    const formatted = isMemoryId(trimmed) ? "* " + trimmed : trimmed;
    inputRef.current?.setValue(formatted);
    inputRef.current?.focus();
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  const handleMemorySelect = useCallback(
    (memoryId: string) => {
      handleIdClick(memoryId);
    },
    [handleIdClick],
  );

  const handleLogout = useCallback(() => {
    setShowAvatarMenu(false);
    signOut().catch(() => undefined);
  }, [signOut]);

  const openConvPanel = useCallback(() => {
    setShowAvatarMenu(false);
    setShowConvPanel(true);
  }, []);

  const openMemPanel = useCallback(() => {
    setShowAvatarMenu(false);
    setShowMemPanel(true);
  }, []);

  const openAnalytics = useCallback(() => {
    setShowAvatarMenu(false);
    setShowAnalytics(true);
  }, []);

  const openCommandPalette = useCallback(() => {
    setShowAvatarMenu(false);
    setShowCommandPalette(true);
  }, []);

  const handleLogoSpeak = useCallback(
    (text: string) => {
      speak(text);
    },
    [speak],
  );

  const macDotConfig: MacDotConfig[] = useMemo(
    () => [
      { color: "#ff5f56", label: "Clear", description: "Clear terminal output", onClick: clearMessages },
      { color: "#ffbd2e", label: "Theme", description: "Cycle color theme", onClick: handleThemeCycle },
      { color: "#27c93f", label: "Fullscreen", description: "Toggle fullscreen mode", onClick: handleFullscreenToggle },
    ],
    [clearMessages, handleThemeCycle, handleFullscreenToggle],
  );

  const menuItems: MenuAction[] = useMemo(
    () => [
      { label: "CMD", ariaLabel: "Open command palette", onClick: openCommandPalette },
      { label: "MEM", ariaLabel: "Open memory panel", onClick: openMemPanel },
      { label: "LOG", ariaLabel: "Open conversation log panel", onClick: openConvPanel },
      { label: "STATS", ariaLabel: "Open analytics and statistics dashboard", onClick: openAnalytics },
    ],
    [openCommandPalette, openMemPanel, openConvPanel, openAnalytics],
  );

  const allMenuActionsLength = menuItems.length + 1;

  useEffect(() => {
    if (!showAvatarMenu) return;
    setAvatarMenuIndex(0);
    avatarMenuItemRefs.current = [];
    const focusTimer = window.setTimeout(() => {
      avatarMenuItemRefs.current[0]?.focus();
    }, 50);

    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowAvatarMenu(false); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAvatarMenuIndex((prev) => {
          const next = (prev + 1) % allMenuActionsLength;
          avatarMenuItemRefs.current[next]?.focus();
          return next;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAvatarMenuIndex((prev) => {
          const next = (prev - 1 + allMenuActionsLength) % allMenuActionsLength;
          avatarMenuItemRefs.current[next]?.focus();
          return next;
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [showAvatarMenu, allMenuActionsLength]);

  const terminalLines = useMemo(() => messagesToTerminalLines(messages), [messages]);

  const isAuthReady = !authLoading;
  const showUser = isAuthReady && isAuthenticated && user !== null;
  const showLoginBtn = isAuthReady && !isAuthenticated;

  const tvFontScale: CSSProperties = navTier === "tv" ? { fontSize: "1.15rem" } : {};

  const headerPaddingClass =
    navTier === "tv" ? "px-6 py-3" : navTier === "mobile" ? "px-3 py-2" : "px-4 py-2";

  const headerStyle = useMemo((): CSSProperties => {
    if (isAuthenticated) {
      return {
        position: "fixed",
        top: navTier === "tv" ? 16 : 8,
        left: navTier === "tv" ? 24 : 8,
        right: navTier === "tv" ? 24 : 8,
        zIndex: Z_NAVBAR,
        background: `${tc.bg}ee`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "9999px",
        border: `1px solid ${tc.border}`,
        boxShadow: `0 0 32px ${tc.primary}22`,
      };
    }
    return {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: Z_NAVBAR,
      background: `${tc.bg}ee`,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${tc.border}`,
      borderRadius: 0,
      margin: 0,
    };
  }, [isAuthenticated, navTier, tc.bg, tc.border, tc.primary]);

  const displayName = user ? getDisplayName(user.name ?? undefined, user.email) : "";
  const firstName = user ? getFirstName(user.name ?? undefined, user.email) : "";
  const initials = user ? getInitials(user.name ?? undefined, user.email) : "";

  const navTopOffset = isAuthenticated
    ? navTier === "tv" ? 16 : 8
    : 0;

  const contentPaddingTop = navbarHeight + navTopOffset + (isAuthenticated ? 8 : 0);

  return (
    <div
      className="relative w-full flex flex-col overflow-hidden"
      style={{ background: tc.bg, height: "100dvh", ...tvFontScale }}
      role="main"
      aria-label="ASHU AI Holographic Terminal"
    >
      {animConfig.enableMatrix && <MatrixRain theme={theme} tier={tier} opacity={0.12} />}
      {animConfig.enableGrid && <HolographicGrid theme={theme} tier={tier} />}
      {animConfig.enableParticles && (
        <ParticleField theme={theme} tier={tier} count={animConfig.particleCount} speed={0.8} />
      )}
      {animConfig.enableScanlines && <ScanlineEffect theme={theme} tier={tier} />}

      <header
        ref={headerRef}
        className={`relative flex items-center justify-between gap-2 shrink-0 ${headerPaddingClass}`}
        style={headerStyle}
        role="banner"
      >
        {isAuthenticated && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{ boxShadow: `0 0 28px ${tc.primary}44, inset 0 0 20px ${tc.primary}18`, willChange: "opacity" }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex gap-1.5 shrink-0" role="group" aria-label="Terminal controls">
            {macDotConfig.map((dot) => (
              <MacDot key={dot.label} dot={dot} />
            ))}
          </div>
          <GlitchText
            text="ASHU_AI"
            theme={theme}
            className="text-xs sm:text-sm font-bold tracking-widest shrink-0 font-mono"
          />
          {navTier !== "mobile" && (
            <span className="text-xs font-mono truncate" style={{ color: `${tc.primary}55` }}>
              v2.0{navTier !== "tablet" ? ` \u25c6 ${theme.toUpperCase()}` : ""}
            </span>
          )}

          {showLoginBtn && navTier !== "mobile" && (
            <HolographicLogoButton
              onSpeak={handleLogoSpeak}
              compact
              className="ml-1"
            />
          )}
        </div>

        <div className="relative flex items-center gap-2 shrink-0">
          {showLoginBtn && navTier === "mobile" && (
            <HolographicLogoButton
              onSpeak={handleLogoSpeak}
              compact
            />
          )}

          <button
            type="button"
            onClick={handleColorSchemeCycle}
            aria-label={COLOR_SCHEME_LABELS[colorScheme]}
            className="w-7 h-7 rounded flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{
              color: `${tc.primary}88`,
              border: `1px solid ${tc.border}`,
              background: "transparent",
              transition: "color 150ms ease, border-color 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = tc.primary;
              e.currentTarget.style.borderColor = `${tc.primary}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = `${tc.primary}88`;
              e.currentTarget.style.borderColor = tc.border;
            }}
            onFocus={(e) => { e.currentTarget.style.color = tc.primary; }}
            onBlur={(e) => { e.currentTarget.style.color = `${tc.primary}88`; }}
          >
            <ModeIcon scheme={colorScheme} />
          </button>

          {authLoading && <AvatarShimmer primary={tc.primary} />}

          {showUser && user && (
            <div className="relative" ref={avatarMenuRef}>
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                onClick={() => setShowAvatarMenu((prev) => !prev)}
                aria-label={`Account menu for ${firstName}`}
                aria-expanded={showAvatarMenu}
                aria-haspopup="menu"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={{
                  border: `1px solid ${tc.border}`,
                  background: `${tc.primary}08`,
                  boxShadow: showAvatarMenu ? `0 0 12px ${tc.primary}33` : "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${tc.primary}55`;
                  e.currentTarget.style.boxShadow = `0 0 12px ${tc.primary}22`;
                }}
                onMouseLeave={(e) => {
                  if (!showAvatarMenu) {
                    e.currentTarget.style.borderColor = tc.border;
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <span
                  className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center shrink-0"
                  style={{ background: `${tc.primary}22`, color: tc.primary }}
                >
                  {user.avatar_url ? (
                    <NextImage
                      src={user.avatar_url ?? ""}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      style={{ borderRadius: "4px" }}
                      width={28}
                      height={28}
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-bold font-mono">{initials}</span>
                  )}
                </span>
                {(navTier === "desktop" || navTier === "tv") && (
                  <span className="flex flex-col items-start leading-tight max-w-[8rem]">
                    <span className="text-xs font-mono truncate w-full text-left" style={{ color: tc.primary }}>
                      {firstName}
                    </span>
                    <span className="text-xs font-mono truncate w-full text-left" style={{ color: `${tc.primary}77` }}>
                      {user.email}
                    </span>
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showAvatarMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-md overflow-hidden"
                    style={{
                      background: tc.bg,
                      border: `1px solid ${tc.border}`,
                      zIndex: Z_DROPDOWN,
                      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${tc.primary}22`,
                      willChange: "transform, opacity",
                    }}
                    role="menu"
                    aria-label="Account menu"
                  >
                    <div className="px-3 py-2" style={{ borderBottom: `1px solid ${tc.border}` }}>
                      <p className="text-xs font-mono truncate font-bold" style={{ color: tc.primary }}>
                        {displayName}
                      </p>
                      <p className="text-xs font-mono truncate" style={{ color: `${tc.primary}77` }}>
                        {user.email}
                      </p>
                    </div>

                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{ borderBottom: `1px solid ${tc.border}` }}
                    >
                      <span className="text-xs font-mono" style={{ color: `${tc.primary}88` }}>
                        Logo Modulator
                      </span>
                      <HolographicLogoButton
                        onSpeak={handleLogoSpeak}
                        compact
                      />
                    </div>

                    {menuItems.map((item, idx) => {
                      const isHighlighted = avatarMenuIndex === idx;
                      return (
                        <button
                          type="button"
                          key={item.label}
                          ref={(el) => { avatarMenuItemRefs.current[idx] = el; }}
                          onClick={item.onClick}
                          onFocus={() => setAvatarMenuIndex(idx)}
                          aria-label={item.ariaLabel}
                          role="menuitem"
                          className="w-full text-left px-3 py-2 text-xs font-mono outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40"
                          style={{
                            color: isHighlighted ? tc.primary : `${tc.primary}aa`,
                            background: isHighlighted ? `${tc.primary}11` : "transparent",
                            transition: "color 100ms ease, background 100ms ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${tc.primary}11`;
                            e.currentTarget.style.color = tc.primary;
                            setAvatarMenuIndex(idx);
                          }}
                          onMouseLeave={(e) => {
                            if (avatarMenuIndex !== idx) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = `${tc.primary}aa`;
                            }
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      ref={(el) => { avatarMenuItemRefs.current[menuItems.length] = el; }}
                      onClick={handleLogout}
                      onFocus={() => setAvatarMenuIndex(menuItems.length)}
                      aria-label="Sign out of account"
                      role="menuitem"
                      className="w-full text-left px-3 py-2 text-xs font-mono outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40"
                      style={{
                        color: "#ff6666",
                        borderTop: `1px solid ${tc.border}`,
                        background: avatarMenuIndex === menuItems.length ? "#ff666622" : "transparent",
                        transition: "background 100ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ff666622";
                        setAvatarMenuIndex(menuItems.length);
                      }}
                      onMouseLeave={(e) => {
                        if (avatarMenuIndex !== menuItems.length) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      LOGOUT
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {showLoginBtn && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowAuth(true)}
              className="px-3 py-1.5 text-xs font-mono rounded outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                color: `${tc.primary}88`,
                border: `1px solid ${tc.border}`,
                background: "transparent",
                transition: "color 150ms ease, border-color 150ms ease, background 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = tc.primary;
                e.currentTarget.style.borderColor = `${tc.primary}66`;
                e.currentTarget.style.background = `${tc.primary}0d`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = `${tc.primary}88`;
                e.currentTarget.style.borderColor = tc.border;
                e.currentTarget.style.background = "transparent";
              }}
              onFocus={(e) => { e.currentTarget.style.color = tc.primary; }}
              onBlur={(e) => { e.currentTarget.style.color = `${tc.primary}88`; }}
              aria-label="Sign in to ASHU AI"
            >
              LOGIN
            </motion.button>
          )}
        </div>
      </header>

      <div
        className="relative flex flex-col min-h-0"
        style={{
          zIndex: Z_CONTENT,
          paddingTop: contentPaddingTop,
          height: `calc(100dvh - ${contentPaddingTop}px)`,
        }}
      >
        <div
          aria-label="Terminal output"
          className="flex-1 min-h-0 overflow-hidden flex flex-col"
          style={{ minHeight: 0 }}
        >
          <TerminalOutput
            onRetry={(userContent: string) => { void handleSubmit(userContent); }}
            lines={terminalLines}
            theme={theme}
            isStreaming={isStreaming}
            onMemoryIdClick={handleIdClick}
            onCommandClick={handleCommandButtonClick}
          />
        </div>
        {(isLoading || isStreaming) && <LoadingBeam theme={theme} />}
        <div
          aria-label="Terminal input"
          className="shrink-0 w-full"
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 20,
          }}
        >
          <TerminalInput
            ref={inputRef}
            theme={theme}
            onSubmit={handleSubmit}
            isLoading={isLoading || isStreaming}
            sessionId={sessionId}
            voiceAgentEnabled={voiceEnabled}
            voiceAgentSpeaking={voiceSpeaking}
            voiceAgentSupported={voiceSupported}
            voiceAgentLastSpoken={voiceLastSpoken}
            onVoiceAgentToggle={toggleVoiceAgent}
          />
        </div>
      </div>

      <ProviderStatusBar theme={theme} currentProvider={currentProvider ?? undefined} isAuthenticated={isAuthenticated} />
      <AuthTransitionOverlay theme={theme} />
      <DynamicFavicon theme={theme} />

      <ConversationPanel
        sessionId={sessionId}
        isOpen={showConvPanel}
        onClose={() => setShowConvPanel(false)}
        onIdClick={handleIdClick}
        theme={theme}
      />
      <MemoryPanel
        sessionId={sessionId}
        isOpen={showMemPanel}
        onClose={() => setShowMemPanel(false)}
        onSelectMemory={handleMemorySelect}
      />
      <AnalyticsDashboard
        sessionId={sessionId}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        theme={theme}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} theme={theme} />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        theme={theme}
        onSubmit={handleSubmit}
        onThemeChange={setTheme}
        onClear={clearMessages}
      />
    </div>
  );
}

export default memo(HolographicTerminalInner);