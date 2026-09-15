// frontend/components/auth/AuthModal.tsx
"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  memo,
} from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { TerminalTheme } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";

interface ThemeStyle {
  bg: string;
  border: string;
  text: string;
  dim: string;
  glow: string;
  input: string;
}

interface ThemeStylePair {
  dark: ThemeStyle;
  light: ThemeStyle;
}

const THEME_STYLES: Record<TerminalTheme, ThemeStylePair> = {
  matrix: {
    dark: { bg: "rgba(0,8,0,0.97)", border: "#00ff8833", text: "#00ff88", dim: "#00ff8866", glow: "#00ff88", input: "#00ff8811" },
    light: { bg: "rgba(235,250,242,0.98)", border: "#046b3a33", text: "#046b3a", dim: "#046b3a88", glow: "#046b3a", input: "#046b3a0d" },
  },
  cyberpunk: {
    dark: { bg: "rgba(8,0,4,0.97)", border: "#ff008833", text: "#ff0088", dim: "#ff008866", glow: "#ff0088", input: "#ff008811" },
    light: { bg: "rgba(255,238,247,0.98)", border: "#99005c33", text: "#99005c", dim: "#99005c88", glow: "#99005c", input: "#99005c0d" },
  },
  holographic: {
    dark: { bg: "rgba(0,4,8,0.97)", border: "#00ffff33", text: "#00ffff", dim: "#00ffff66", glow: "#00ffff", input: "#00ffff11" },
    light: { bg: "rgba(233,250,255,0.98)", border: "#00667733", text: "#006677", dim: "#00667788", glow: "#006677", input: "#0066770d" },
  },
  neon: {
    dark: { bg: "rgba(4,0,8,0.97)", border: "#b400ff33", text: "#b400ff", dim: "#b400ff66", glow: "#b400ff", input: "#b400ff11" },
    light: { bg: "rgba(247,238,255,0.98)", border: "#6a00b333", text: "#6a00b3", dim: "#6a00b388", glow: "#6a00b3", input: "#6a00b30d" },
  },
  cyber: {
    dark: { bg: "rgba(0,2,8,0.97)", border: "#0088ff33", text: "#0088ff", dim: "#0088ff66", glow: "#0088ff", input: "#0088ff11" },
    light: { bg: "rgba(233,242,255,0.98)", border: "#004a9933", text: "#004a99", dim: "#004a9988", glow: "#004a99", input: "#004a990d" },
  },
  plasma: {
    dark: { bg: "rgba(8,2,0,0.97)", border: "#ff440033", text: "#ff4400", dim: "#ff440066", glow: "#ff4400", input: "#ff440011" },
    light: { bg: "rgba(255,242,233,0.98)", border: "#b32d0033", text: "#b32d00", dim: "#b32d0088", glow: "#b32d00", input: "#b32d000d" },
  },
  aurora: {
    dark: { bg: "rgba(0,8,6,0.97)", border: "#00ffcc33", text: "#00ffcc", dim: "#00ffcc66", glow: "#00ffcc", input: "#00ffcc11" },
    light: { bg: "rgba(233,255,250,0.98)", border: "#007a6633", text: "#007a66", dim: "#007a6688", glow: "#007a66", input: "#007a660d" },
  },
  inferno: {
    dark: { bg: "rgba(8,4,0,0.97)", border: "#ff880033", text: "#ff8800", dim: "#ff880066", glow: "#ff8800", input: "#ff880011" },
    light: { bg: "rgba(255,247,233,0.98)", border: "#b35f0033", text: "#b35f00", dim: "#b35f0088", glow: "#b35f00", input: "#b35f000d" },
  },
  ghost: {
    dark: { bg: "rgba(2,2,8,0.97)", border: "#aaaaff33", text: "#aaaaff", dim: "#aaaaff66", glow: "#aaaaff", input: "#aaaaff11" },
    light: { bg: "rgba(242,242,255,0.98)", border: "#4c4c9933", text: "#4c4c99", dim: "#4c4c9988", glow: "#4c4c99", input: "#4c4c990d" },
  },
  crimson: {
    dark: { bg: "rgba(8,0,2,0.97)", border: "#ff224433", text: "#ff2244", dim: "#ff224466", glow: "#ff2244", input: "#ff224411" },
    light: { bg: "rgba(255,235,238,0.98)", border: "#99001a33", text: "#99001a", dim: "#99001a88", glow: "#99001a", input: "#99001a0d" },
  },
};

type AuthMode = "signin" | "signup";
type DeviceTier = "mobile" | "tablet" | "desktop" | "tv";

interface TierConfig {
  cardWidth: string;
  padding: string;
  fontSize: string;
  buttonHeight: string;
  gap: string;
  radius: string;
  focusRingWidth: string;
}

const TIER_CONFIG: Record<DeviceTier, TierConfig> = {
  mobile: {
    cardWidth: "100%",
    padding: "1.5rem",
    fontSize: "0.8rem",
    buttonHeight: "3rem",
    gap: "0.85rem",
    radius: "1.25rem 1.25rem 0 0",
    focusRingWidth: "2px",
  },
  tablet: {
    cardWidth: "26rem",
    padding: "1.75rem",
    fontSize: "0.8rem",
    buttonHeight: "2.75rem",
    gap: "1rem",
    radius: "0.75rem",
    focusRingWidth: "2px",
  },
  desktop: {
    cardWidth: "24rem",
    padding: "1.5rem",
    fontSize: "0.75rem",
    buttonHeight: "2.5rem",
    gap: "1rem",
    radius: "0.5rem",
    focusRingWidth: "2px",
  },
  tv: {
    cardWidth: "34rem",
    padding: "2.75rem",
    fontSize: "1.1rem",
    buttonHeight: "3.75rem",
    gap: "1.4rem",
    radius: "1rem",
    focusRingWidth: "4px",
  },
};

const CLOSE_BUTTON_SIZE: Record<DeviceTier, string> = {
  mobile: "2.5rem",
  tablet: "2.5rem",
  desktop: "2.25rem",
  tv: "3.25rem",
};

const CONTAINER_VARIANTS: Record<DeviceTier, Variants> = {
  mobile: {
    hidden: { opacity: 0, y: "100%" },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 30, stiffness: 320 },
    },
    exit: { opacity: 0, y: "100%", transition: { duration: 0.2 } },
  },
  tablet: {
    hidden: { opacity: 0, scale: 0.94, y: -16 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 26, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.94, y: -16, transition: { duration: 0.2 } },
  },
  desktop: {
    hidden: { opacity: 0, scale: 0.92, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 24, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.92, y: -20, transition: { duration: 0.2 } },
  },
  tv: {
    hidden: { opacity: 0, scale: 0.88 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 22, stiffness: 260 },
    },
    exit: { opacity: 0, scale: 0.88, transition: { duration: 0.2 } },
  },
};

const SWEEP_VARIANTS: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.8, ease: "easeInOut", delay: 0.2 },
  },
  exit: { pathLength: 0, opacity: 0, transition: { duration: 0.3 } },
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ERROR_BG = "rgba(255,0,0,0.07)";
const ERROR_BORDER = "rgba(255,68,68,0.2)";
const ERROR_TEXT = "rgba(255,102,102,1)";

const OVERLAY_Z = 9000;
const MODAL_Z = 9001;

function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  const hasHover = window.matchMedia("(hover: hover)").matches;
  if (!hasHover && width >= 1280) return "tv";
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: TerminalTheme;
}

function AuthModalInner({ isOpen, onClose, theme = "holographic" }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [tier, setTier] = useState<DeviceTier>("desktop");

  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const { resolvedMode } = useTheme();
  const { speakAuthEvent } = useVoiceAgent();
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const descId = "auth-modal-desc";
  const errorId = "auth-modal-error";

  const s: ThemeStyle =
    THEME_STYLES[theme][resolvedMode === "light" ? "light" : "dark"];
  const t: TierConfig = TIER_CONFIG[tier];

  useEffect(() => {
    const update = () => setTier(detectDeviceTier());
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      setEmail("");
      setPassword("");
      setFormError(null);
      setConfirmationSent(false);
      clearError();
    }
  }, [isOpen, clearError]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => emailInputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (tier === "tv" && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        const activeEl =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const idx = activeEl ? focusable.indexOf(activeEl) : -1;
        const next =
          (idx + (e.key === "ArrowDown" ? 1 : -1) + focusable.length) %
          focusable.length;
        focusable[next]?.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose, tier]);

  const getFocusRing = useCallback(
    (active: boolean): string => {
      if (!active) return "none";
      return `0 0 0 ${t.focusRingWidth} ${s.glow}99`;
    },
    [t.focusRingWidth, s.glow],
  );

  const applyFocus = useCallback(
    (el: HTMLElement, active: boolean) => {
      el.style.boxShadow = getFocusRing(active);
    },
    [getFocusRing],
  );

  const toggleMode = useCallback(() => {
    setMode((prev: AuthMode) => (prev === "signin" ? "signup" : "signin"));
    setFormError(null);
    setConfirmationSent(false);
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      clearError();

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setFormError("Email and password are required.");
        return;
      }
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        return;
      }

      if (mode === "signin") {
        const ok = await signIn(trimmedEmail, password);
        if (ok) {
          const userName = trimmedEmail.split("@")[0] ?? "";
          speakAuthEvent("login", userName);
          onClose();
        }
      } else {
        const result = await signUp(trimmedEmail, password);
        if (result.success) {
          if (result.needsConfirmation) {
            setConfirmationSent(true);
            speakAuthEvent("login", trimmedEmail.split("@")[0] ?? "");
          } else {
            speakAuthEvent("login", trimmedEmail.split("@")[0] ?? "");
            onClose();
          }
        }
      }
    },
    [mode, email, password, signIn, signUp, onClose, clearError, speakAuthEvent],
  );

  const handleGoogleSignIn = useCallback(() => {
    clearError();
    speakAuthEvent("login");
    signInWithGoogle().catch(() => undefined);
  }, [signInWithGoogle, clearError, speakAuthEvent]);

  const handleGithubSignIn = useCallback(() => {
    clearError();
    speakAuthEvent("login");
    signInWithGitHub().catch(() => undefined);
  }, [signInWithGitHub, clearError, speakAuthEvent]);

  const displayError = formError ?? error;

  const outerPositionClass =
    tier === "mobile"
      ? "fixed inset-x-0 bottom-0 flex justify-center"
      : "fixed inset-0 flex items-center justify-center p-4";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="auth-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.75)", zIndex: OVERLAY_Z }}
            onClick={onClose}
            aria-hidden="true"
          />

          <div
            className={outerPositionClass}
            style={{ zIndex: MODAL_Z }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key="auth-card"
              variants={CONTAINER_VARIANTS[tier]}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                width: tier === "mobile" ? "100%" : t.cardWidth,
                maxWidth: tier === "mobile" ? "100%" : t.cardWidth,
              }}
            >
              <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label={
                  mode === "signin"
                    ? "Sign in to ASHU AI"
                    : "Create ASHU AI account"
                }
                aria-describedby={descId}
                className="relative w-full border overflow-hidden"
                style={{
                  padding: t.padding,
                  paddingBottom:
                    tier === "mobile"
                      ? `calc(${t.padding} + env(safe-area-inset-bottom, 0px))`
                      : t.padding,
                  background: s.bg,
                  borderColor: s.border,
                  borderRadius: t.radius,
                  maxHeight: "92dvh",
                  overflowY: "auto",
                }}
              >
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  style={{ opacity: 0.5 }}
                >
                  <motion.path
                    d="M 0.5,0.5 L 99.5,0.5 L 99.5,99.5 L 0.5,99.5 Z"
                    fill="none"
                    stroke={s.glow}
                    strokeWidth="0.5"
                    variants={SWEEP_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  />
                </svg>

                <div className="relative flex items-center justify-between mb-5">
                  <div>
                    <h2
                      id={descId}
                      className="font-bold font-mono tracking-widest"
                      style={{
                        color: s.text,
                        fontSize: `calc(${t.fontSize} + 0.15rem)`,
                      }}
                    >
                      {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
                    </h2>
                    <p
                      className="font-mono mt-0.5 tracking-wider"
                      style={{ color: s.dim, fontSize: t.fontSize }}
                    >
                      ASHU_AI_ASSISTANT
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close authentication modal"
                    className="rounded flex items-center justify-center outline-none shrink-0"
                    style={{
                      width: CLOSE_BUTTON_SIZE[tier],
                      height: CLOSE_BUTTON_SIZE[tier],
                      minWidth: "2.25rem",
                      color: s.dim,
                      border: `1px solid ${s.border}`,
                      fontSize: t.fontSize,
                      background: "transparent",
                      transition: "color 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = s.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = s.dim;
                    }}
                    onFocus={(e) => {
                      applyFocus(e.currentTarget, true);
                      e.currentTarget.style.color = s.text;
                    }}
                    onBlur={(e) => {
                      applyFocus(e.currentTarget, false);
                      e.currentTarget.style.color = s.dim;
                    }}
                  >
                    &#x2715;
                  </button>
                </div>

                {confirmationSent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative py-6 text-center flex flex-col gap-3"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <div
                      className="text-2xl"
                      aria-hidden="true"
                      style={{ color: s.glow }}
                    >
                      &#x2713;
                    </div>
                    <p
                      className="font-mono font-bold tracking-widest"
                      style={{ color: s.text, fontSize: t.fontSize }}
                    >
                      CHECK YOUR EMAIL
                    </p>
                    <p
                      className="font-mono"
                      style={{ color: s.dim, fontSize: t.fontSize }}
                    >
                      Confirmation link sent to{" "}
                      <span style={{ color: s.text }}>{email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-2 font-mono font-bold rounded outline-none"
                      style={{
                        height: t.buttonHeight,
                        fontSize: t.fontSize,
                        background: `${s.glow}22`,
                        border: `1px solid ${s.border}`,
                        color: s.text,
                      }}
                      onFocus={(e) => applyFocus(e.currentTarget, true)}
                      onBlur={(e) => applyFocus(e.currentTarget, false)}
                    >
                      CLOSE
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div
                      className="relative flex flex-col"
                      style={{ gap: t.gap }}
                    >
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        aria-label="Continue with Google"
                        className="w-full flex items-center justify-center gap-2 rounded font-mono font-bold outline-none disabled:opacity-50"
                        style={{
                          height: t.buttonHeight,
                          fontSize: t.fontSize,
                          background: `${s.text}0d`,
                          border: `1px solid ${s.border}`,
                          color: s.text,
                          transition: "opacity 150ms ease",
                        }}
                        onFocus={(e) => applyFocus(e.currentTarget, true)}
                        onBlur={(e) => applyFocus(e.currentTarget, false)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M22 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.6c-.24 1.3-1 2.4-2.1 3.14v2.6h3.4c2-1.85 3.1-4.57 3.1-7.54z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 22c2.8 0 5.16-.92 6.9-2.5l-3.4-2.6c-.94.63-2.15 1-3.5 1-2.7 0-5-1.83-5.8-4.3H2.7v2.7C4.44 19.7 7.96 22 12 22z"
                            fill="#34A853"
                          />
                          <path
                            d="M6.2 13.6a6 6 0 0 1 0-3.2v-2.7H2.7a10 10 0 0 0 0 8.6l3.5-2.7z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 6.4c1.5 0 2.9.52 4 1.53l3-3C17.15 3.1 14.8 2 12 2 7.96 2 4.44 4.3 2.7 7.7l3.5 2.7c.8-2.47 3.1-4 5.8-4z"
                            fill="#EA4335"
                          />
                        </svg>
                        CONTINUE WITH GOOGLE
                      </button>

                      <button
                        type="button"
                        onClick={handleGithubSignIn}
                        disabled={isLoading}
                        aria-label="Continue with GitHub"
                        className="w-full flex items-center justify-center gap-2 rounded font-mono font-bold outline-none disabled:opacity-50"
                        style={{
                          height: t.buttonHeight,
                          fontSize: t.fontSize,
                          background: `${s.text}0d`,
                          border: `1px solid ${s.border}`,
                          color: s.text,
                          transition: "opacity 150ms ease",
                        }}
                        onFocus={(e) => applyFocus(e.currentTarget, true)}
                        onBlur={(e) => applyFocus(e.currentTarget, false)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
                        </svg>
                        CONTINUE WITH GITHUB
                      </button>
                    </div>

                    <div className="relative flex items-center gap-3 my-5">
                      <div
                        className="flex-1 h-px"
                        style={{ background: s.border }}
                      />
                      <span
                        className="font-mono"
                        style={{ color: s.dim, fontSize: t.fontSize }}
                      >
                        OR
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ background: s.border }}
                      />
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="relative flex flex-col"
                      style={{ gap: t.gap }}
                      noValidate
                    >
                      <div>
                        <label
                          htmlFor="auth-email"
                          className="block font-mono mb-1 tracking-wider"
                          style={{ color: s.dim, fontSize: t.fontSize }}
                        >
                          EMAIL
                        </label>
                        <input
                          ref={emailInputRef}
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          autoComplete="email"
                          required
                          aria-label="Email address"
                          aria-required="true"
                          aria-describedby={displayError ? errorId : undefined}
                          className="w-full rounded outline-none font-mono"
                          style={{
                            height: t.buttonHeight,
                            padding: "0 0.75rem",
                            fontSize: t.fontSize,
                            background: s.input,
                            border: `1px solid ${s.border}`,
                            color: s.text,
                          }}
                          onFocus={(e) => applyFocus(e.currentTarget, true)}
                          onBlur={(e) => applyFocus(e.currentTarget, false)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="auth-password"
                          className="block font-mono mb-1 tracking-wider"
                          style={{ color: s.dim, fontSize: t.fontSize }}
                        >
                          PASSWORD
                        </label>
                        <input
                          id="auth-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="????????"
                          autoComplete={
                            mode === "signin" ? "current-password" : "new-password"
                          }
                          required
                          aria-label="Password"
                          aria-required="true"
                          aria-describedby={displayError ? errorId : undefined}
                          className="w-full rounded outline-none font-mono"
                          style={{
                            height: t.buttonHeight,
                            padding: "0 0.75rem",
                            fontSize: t.fontSize,
                            background: s.input,
                            border: `1px solid ${s.border}`,
                            color: s.text,
                          }}
                          onFocus={(e) => applyFocus(e.currentTarget, true)}
                          onBlur={(e) => applyFocus(e.currentTarget, false)}
                        />
                      </div>

                      <AnimatePresence>
                        {displayError && (
                          <motion.div
                            key="auth-error"
                            id={errorId}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            role="alert"
                            aria-live="assertive"
                            className="rounded font-mono px-3 py-2"
                            style={{
                              background: ERROR_BG,
                              border: `1px solid ${ERROR_BORDER}`,
                              color: ERROR_TEXT,
                              fontSize: t.fontSize,
                              willChange: "transform, opacity",
                            }}
                          >
                            {displayError}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={isLoading}
                        aria-label={
                          mode === "signin"
                            ? "Sign in to ASHU AI"
                            : "Create ASHU AI account"
                        }
                        aria-busy={isLoading}
                        className="w-full rounded font-mono font-bold outline-none disabled:opacity-60 tracking-widest"
                        style={{
                          height: t.buttonHeight,
                          fontSize: t.fontSize,
                          background: `${s.glow}22`,
                          border: `1px solid ${s.border}`,
                          color: s.text,
                          transition: "opacity 150ms ease",
                        }}
                        onFocus={(e) => applyFocus(e.currentTarget, true)}
                        onBlur={(e) => applyFocus(e.currentTarget, false)}
                      >
                        {isLoading
                          ? "PROCESSING..."
                          : mode === "signin"
                          ? "SIGN IN"
                          : "CREATE ACCOUNT"}
                      </button>
                    </form>

                    <div className="relative mt-4 text-center">
                      <button
                        type="button"
                        onClick={toggleMode}
                        aria-label={
                          mode === "signin"
                            ? "Switch to create account"
                            : "Switch to sign in"
                        }
                        className="font-mono outline-none opacity-70 hover:opacity-100"
                        style={{
                          color: s.dim,
                          fontSize: t.fontSize,
                          transition: "opacity 150ms ease",
                        }}
                        onFocus={(e) => applyFocus(e.currentTarget, true)}
                        onBlur={(e) => applyFocus(e.currentTarget, false)}
                      >
                        {mode === "signin"
                          ? "Need an account? Sign up"
                          : "Have an account? Sign in"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(AuthModalInner);
