// frontend/components/auth/AuthTransitionOverlay.tsx
"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { TerminalTheme } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { useVoice } from "@/hooks/useVoice";
import { useTheme } from "@/hooks/useTheme";

export interface AuthTransitionOverlayProps {
  theme?: TerminalTheme;
}

type OverlayPhase = "login" | "logout";
type NavTier = "mobile" | "tablet" | "desktop" | "tv";

interface ThemeAccent {
  primary: string;
  secondary: string;
  bg: string;
}

interface ThemeAccentPair {
  dark: ThemeAccent;
  light: ThemeAccent;
}

const THEME_ACCENTS: Record<TerminalTheme, ThemeAccentPair> = {
  matrix: { dark: { primary: "#00ff88", secondary: "#00cc66", bg: "#000800" }, light: { primary: "#046b3a", secondary: "#035c30", bg: "#eef8f2" } },
  cyberpunk: { dark: { primary: "#ff0088", secondary: "#cc0066", bg: "#080004" }, light: { primary: "#99005c", secondary: "#7a004a", bg: "#fff0f7" } },
  holographic: { dark: { primary: "#00ffff", secondary: "#0099cc", bg: "#000408" }, light: { primary: "#006677", secondary: "#00505c", bg: "#eafcff" } },
  neon: { dark: { primary: "#b400ff", secondary: "#8800cc", bg: "#040008" }, light: { primary: "#6a00b3", secondary: "#55008f", bg: "#f7eeff" } },
  cyber: { dark: { primary: "#0088ff", secondary: "#0055cc", bg: "#000208" }, light: { primary: "#004a99", secondary: "#003b7a", bg: "#eef4ff" } },
  plasma: { dark: { primary: "#ff4400", secondary: "#cc3300", bg: "#080200" }, light: { primary: "#b32d00", secondary: "#8f2400", bg: "#fff3ec" } },
  aurora: { dark: { primary: "#00ffcc", secondary: "#00ccaa", bg: "#000807" }, light: { primary: "#007a66", secondary: "#006352", bg: "#eafff9" } },
  inferno: { dark: { primary: "#ff8800", secondary: "#cc6600", bg: "#080400" }, light: { primary: "#b35f00", secondary: "#8f4c00", bg: "#fff6ec" } },
  ghost: { dark: { primary: "#aaaaff", secondary: "#8888cc", bg: "#020208" }, light: { primary: "#4c4c99", secondary: "#3d3d7a", bg: "#f1f1fb" } },
  crimson: { dark: { primary: "#ff2244", secondary: "#cc1133", bg: "#080002" }, light: { primary: "#99001a", secondary: "#7a0015", bg: "#fff0f2" } },
};

interface TierConfig {
  ringCount: number;
  autoHideMs: number;
  titleSize: string;
  subtitleSize: string;
  ringMaxScale: number;
}

const TIER_CONFIG: Record<NavTier, TierConfig> = {
  mobile: { ringCount: 2, autoHideMs: 2600, titleSize: "text-lg", subtitleSize: "text-xs", ringMaxScale: 5 },
  tablet: { ringCount: 3, autoHideMs: 3000, titleSize: "text-xl", subtitleSize: "text-sm", ringMaxScale: 6 },
  desktop: { ringCount: 4, autoHideMs: 3400, titleSize: "text-2xl", subtitleSize: "text-sm", ringMaxScale: 7 },
  tv: { ringCount: 5, autoHideMs: 4200, titleSize: "text-4xl", subtitleSize: "text-lg", ringMaxScale: 8 },
};

const OVERLAY_Z = 9999;
const APP_FULL_NAME = "Advanced System Holographic Unified Artificial Intelligence Assistant";
const APP_SHORT_NAME = "ASHU_AI_Assistant";

function detectNavTier(): NavTier {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  const hasHover = window.matchMedia("(hover: hover)").matches;
  if (!hasHover && width >= 1280) return "tv";
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function deriveDisplayName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const nameCandidate =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    (typeof metadata.user_name === "string" && metadata.user_name.trim()) ||
    "";
  if (nameCandidate.length > 0) return nameCandidate;
  if (user.email && user.email.length > 0) {
    const localPart = user.email.split("@")[0];
    if (localPart && localPart.length > 0) return localPart;
  }
  return "Operator";
}

function buildWelcomeSpeech(name: string): string {
  return `Welcome, ${name}. ${APP_SHORT_NAME} is now online. All systems synchronized.`;
}

function buildFarewellSpeech(name: string): string {
  return `Goodbye, ${name}. ${APP_SHORT_NAME} session terminated.`;
}

function AuthTransitionOverlay({ theme = "holographic" }: AuthTransitionOverlayProps) {
  const { resolvedMode } = useTheme();
  const { speak, isSupported, stopSpeaking } = useVoice();
  const accent: ThemeAccent = THEME_ACCENTS[theme][resolvedMode === "light" ? "light" : "dark"];

  const [phase, setPhase] = useState<OverlayPhase | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [navTier, setNavTier] = useState<NavTier>("desktop");
  const [reducedMotion, setReducedMotion] = useState(false);

  const lastNameRef = useRef<string>("Operator");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setNavTier(detectNavTier());
    const handleResize = () => {
      if (isMountedRef.current) setNavTier(detectNavTier());
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handleChange = (e: MediaQueryListEvent) => {
      if (isMountedRef.current) setReducedMotion(e.matches);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearHideTimer();
    stopSpeaking();
    if (isMountedRef.current) setPhase(null);
  }, [clearHideTimer, stopSpeaking]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMountedRef.current) return;
      if (event === "SIGNED_IN" && session?.user) {
        const name = deriveDisplayName(session.user);
        lastNameRef.current = name;
        setDisplayName(name);
        setPhase("login");
        if (isSupported) speak(buildWelcomeSpeech(name), true);
      } else if (event === "INITIAL_SESSION" && session?.user) {
        lastNameRef.current = deriveDisplayName(session.user);
      } else if (event === "SIGNED_OUT") {
        const name = lastNameRef.current;
        setDisplayName(name);
        setPhase("logout");
        if (isSupported) speak(buildFarewellSpeech(name), true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [isSupported, speak]);

  useEffect(() => {
    if (!phase) return;
    clearHideTimer();
    const ms = TIER_CONFIG[navTier].autoHideMs;
    hideTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setPhase(null);
    }, ms);
    return clearHideTimer;
  }, [phase, navTier, clearHideTimer]);

  useEffect(() => {
    if (!phase) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, dismiss]);

  const tierConfig: TierConfig = TIER_CONFIG[navTier];
  const ringIndices = Array.from({ length: tierConfig.ringCount }, (_, i) => i);
  const isLogin = phase === "login";

  return (
    <AnimatePresence>
      {phase && (
        <motion.div
          key="auth-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={dismiss}
          role="status"
          aria-live="polite"
          aria-label={
            isLogin
              ? `Signed in as ${displayName}`
              : `Signed out, goodbye ${displayName}`
          }
          className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accent.bg}f2 0%, ${accent.bg}fa 60%, ${accent.bg}ff 100%)`,
            zIndex: OVERLAY_Z,
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ width: "min(80vw, 480px)", height: "min(80vw, 480px)" }}
          >
            {!reducedMotion &&
              ringIndices.map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: "18%",
                    height: "18%",
                    border: `1px solid ${isLogin ? accent.primary : accent.secondary}`,
                    willChange: "transform, opacity",
                  }}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{
                    scale: isLogin
                      ? [1, tierConfig.ringMaxScale]
                      : [tierConfig.ringMaxScale * 0.6, 0.4],
                    opacity: isLogin ? [0.9, 0] : [0.7, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    delay: i * 0.28,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: "34%",
                height: "34%",
                border: `2px solid ${accent.primary}`,
                background: `${accent.bg}cc`,
                willChange: "transform, opacity",
              }}
            >
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: `0 0 24px ${accent.primary}55, inset 0 0 24px ${accent.primary}22`,
                }}
                aria-hidden="true"
              />
              <motion.div
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: [0.5, 1, 0.5] }
                }
                transition={
                  reducedMotion
                    ? undefined
                    : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                }
                className="rounded-full"
                style={{
                  width: "38%",
                  height: "38%",
                  background: accent.primary,
                  willChange: "opacity",
                }}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute left-0 right-0 flex flex-col items-center gap-2 px-6 text-center"
            style={{ bottom: "12%", willChange: "transform, opacity" }}
          >
            <p
              className={`font-mono font-bold tracking-widest ${tierConfig.titleSize}`}
              style={{ color: accent.primary }}
            >
              {isLogin ? "SYSTEMS ONLINE" : "SESSION TERMINATED"}
            </p>
            <p
              className={`font-mono ${tierConfig.subtitleSize}`}
              style={{ color: `${accent.primary}aa` }}
            >
              {isLogin
                ? `Welcome, ${displayName}. ${APP_FULL_NAME}.`
                : `Goodbye, ${displayName}.`}
            </p>
            <p
              className="font-mono text-xs mt-2 opacity-50"
              style={{ color: accent.primary }}
            >
              {navTier === "tv" ? "Press OK to continue" : "Click or press any key to continue"}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(AuthTransitionOverlay);
