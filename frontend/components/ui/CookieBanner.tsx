// frontend/components/ui/CookieBanner.tsx
"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalTheme } from "@/types";

type CookieConsent = "all" | "essential" | null;
type DeviceTier = "mobile" | "tablet" | "desktop" | "tv";

interface CookieBannerProps {
  theme?: TerminalTheme;
  onPrivacyPolicyClick?: () => void;
  isAuthenticated?: boolean;
}

interface ThemeStyle {
  bg: string;
  border: string;
  text: string;
  dim: string;
  glow: string;
  accent: string;
  scanline: string;
}

const STORAGE_KEY = "ashu-cookie-consent";

const THEME_STYLES: Record<TerminalTheme, ThemeStyle> = {
  matrix: { bg: "rgba(0,8,0,0.97)", border: "#00ff8833", text: "#00ff88", dim: "#00ff8866", glow: "#00ff88", accent: "#00cc66", scanline: "#00ff880a" },
  cyberpunk: { bg: "rgba(8,0,4,0.97)", border: "#ff008833", text: "#ff0088", dim: "#ff008866", glow: "#ff0088", accent: "#cc0066", scanline: "#ff00880a" },
  holographic: { bg: "rgba(0,4,8,0.97)", border: "#00ffff33", text: "#00ffff", dim: "#00ffff66", glow: "#00ffff", accent: "#0099cc", scanline: "#00ffff0a" },
  neon: { bg: "rgba(4,0,8,0.97)", border: "#b400ff33", text: "#b400ff", dim: "#b400ff66", glow: "#b400ff", accent: "#8800cc", scanline: "#b400ff0a" },
  cyber: { bg: "rgba(0,2,8,0.97)", border: "#0088ff33", text: "#0088ff", dim: "#0088ff66", glow: "#0088ff", accent: "#0055cc", scanline: "#0088ff0a" },
  plasma: { bg: "rgba(8,2,0,0.97)", border: "#ff440033", text: "#ff4400", dim: "#ff440066", glow: "#ff4400", accent: "#cc3300", scanline: "#ff44000a" },
  aurora: { bg: "rgba(0,8,6,0.97)", border: "#00ffcc33", text: "#00ffcc", dim: "#00ffcc66", glow: "#00ffcc", accent: "#00ccaa", scanline: "#00ffcc0a" },
  inferno: { bg: "rgba(8,4,0,0.97)", border: "#ff880033", text: "#ff8800", dim: "#ff880066", glow: "#ff8800", accent: "#cc6600", scanline: "#ff88000a" },
  ghost: { bg: "rgba(2,2,8,0.97)", border: "#aaaaff33", text: "#aaaaff", dim: "#aaaaff66", glow: "#aaaaff", accent: "#8888cc", scanline: "#aaaaff0a" },
  crimson: { bg: "rgba(8,0,2,0.97)", border: "#ff224433", text: "#ff2244", dim: "#ff224466", glow: "#ff2244", accent: "#cc1133", scanline: "#ff22440a" },
};

const FOCUSABLE = 'button:not([disabled]),[tabindex]:not([tabindex="-1"])';

const LLM_PROVIDERS = [
  "Google Gemini", "Groq", "Mistral AI", "OpenAI", "xAI Grok",
  "Anthropic Claude", "Cerebras", "OpenRouter", "Cohere",
  "HuggingFace", "Cloudflare Workers AI", "Together AI", "DeepSeek",
] as const;

function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const hasHover = window.matchMedia("(hover: hover)").matches;
  if (!hasHover && w >= 1280) return "tv";
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function readStoredConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  if (stored === "all" || stored === "essential") return stored;
  return null;
}

function writeConsent(value: CookieConsent): void {
  if (typeof window === "undefined" || value === null) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    return;
  }
}

function CookieBannerInner({
  theme = "holographic",
  onPrivacyPolicyClick,
  isAuthenticated = false,
}: CookieBannerProps) {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [visible, setVisible] = useState(false);
  const [tier, setTier] = useState<DeviceTier>("desktop");
  const [showDetails, setShowDetails] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const s = THEME_STYLES[theme];

  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = readStoredConsent();
    if (stored !== null) {
      setConsent(stored);
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    const update = () => setTier(detectDeviceTier());
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handleKey = (e: KeyboardEvent): void => {
      if (!bannerRef.current) return;
      const items = Array.from(
        bannerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
          return;
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
          return;
        }
        return;
      }

      if (tier === "tv") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const current = items.indexOf(document.activeElement as HTMLElement);
          const next = (current + 1) % items.length;
          items[next]?.focus();
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          const current = items.indexOf(document.activeElement as HTMLElement);
          const next = (current - 1 + items.length) % items.length;
          items[next]?.focus();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, tier]);

  const handleAcceptAll = useCallback(() => {
    writeConsent("all");
    setConsent("all");
    setVisible(false);
  }, []);

  const handleEssentialOnly = useCallback(() => {
    writeConsent("essential");
    setConsent("essential");
    setVisible(false);
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  const positionClass: Record<DeviceTier, string> = {
    mobile: "fixed inset-x-0 bottom-0 z-[8000]",
    tablet: "fixed bottom-6 left-1/2 -translate-x-1/2 z-[8000] w-[90vw] max-w-[30rem]",
    desktop: "fixed bottom-6 right-6 z-[8000] w-[22rem]",
    tv: "fixed bottom-10 right-10 z-[8000] w-[32rem]",
  };

  const fontSize: Record<DeviceTier, string> = {
    mobile: "0.72rem",
    tablet: "0.75rem",
    desktop: "0.72rem",
    tv: "1rem",
  };

  const btnHeight: Record<DeviceTier, string> = {
    mobile: "2.75rem",
    tablet: "2.5rem",
    desktop: "2.25rem",
    tv: "3.25rem",
  };

  const padding: Record<DeviceTier, string> = {
    mobile: "1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))",
    tablet: "1.25rem",
    desktop: "1.1rem",
    tv: "2rem",
  };

  const radius: Record<DeviceTier, string> = {
    mobile: "1rem 1rem 0 0",
    tablet: "0.75rem",
    desktop: "0.5rem",
    tv: "0.875rem",
  };

  const containerVariants = {
    mobile: {
      hidden: { opacity: 0, y: "100%" },
      visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 28, stiffness: 300 } },
      exit: { opacity: 0, y: "100%", transition: { duration: 0.22 } },
    },
    tablet: {
      hidden: { opacity: 0, scale: 0.94, y: 16 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, damping: 26, stiffness: 300 } },
      exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
    },
    desktop: {
      hidden: { opacity: 0, x: 40, y: 16 },
      visible: { opacity: 1, x: 0, y: 0, transition: { type: "spring" as const, damping: 24, stiffness: 280 } },
      exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
    },
    tv: {
      hidden: { opacity: 0, scale: 0.88 },
      visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 22, stiffness: 260 } },
      exit: { opacity: 0, scale: 0.88, transition: { duration: 0.2 } },
    },
  };

  if (!isAuthenticated) return null;
  if (consent !== null && !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {tier === "mobile" && (
            <motion.div
              key="cookie-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[7999]"
              style={{ background: "rgba(0,0,0,0.5)" }}
              aria-hidden="true"
            />
          )}

          <div className={positionClass[tier]}>
            <motion.div
              key="cookie-banner"
              ref={bannerRef}
              variants={containerVariants[tier]}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="false"
              aria-label="Cookie consent banner"
              aria-describedby="cookie-desc"
              className="relative overflow-hidden"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: radius[tier],
                padding: padding[tier],
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                willChange: "transform, opacity",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, ${s.scanline} 0px, ${s.scanline} 1px, transparent 1px, transparent 4px)`,
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ border: `1px solid ${s.glow}`, willChange: "opacity" }}
                animate={{ opacity: [0.15, 0.5, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex flex-col" style={{ gap: tier === "tv" ? "1.25rem" : "0.85rem" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      id="cookie-desc"
                      className="font-mono font-bold tracking-widest"
                      style={{ color: s.text, fontSize: `calc(${fontSize[tier]} + 0.1rem)` }}
                    >
                      COOKIE PREFERENCES
                    </p>
                    <p
                      className="font-mono mt-1 leading-relaxed"
                      style={{ color: s.dim, fontSize: fontSize[tier] }}
                    >
                      ASHU AI uses cookies and AI provider APIs to deliver responses.
                      Your prompts may be processed by up to 13 AI providers.
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="shrink-0 font-mono font-bold"
                    style={{ color: s.glow, fontSize: "1.2rem" }}
                  >
                    ◈
                  </div>
                </div>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      key="cookie-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                      style={{ willChange: "opacity" }}
                    >
                      <div
                        className="rounded p-3 font-mono"
                        style={{
                          background: `${s.glow}08`,
                          border: `1px solid ${s.border}`,
                          fontSize: fontSize[tier],
                        }}
                      >
                        <p style={{ color: s.text }} className="font-bold mb-2 tracking-wider">
                          AI PROVIDERS USED
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {LLM_PROVIDERS.map((name) => (
                            <span
                              key={name}
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                background: `${s.accent}22`,
                                border: `1px solid ${s.border}`,
                                color: s.dim,
                                fontSize: `calc(${fontSize[tier]} - 0.05rem)`,
                              }}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 leading-relaxed" style={{ color: s.dim }}>
                          Essential cookies store your session, theme preference, and command history locally.
                          No personal data is sold. Prompts are sent to AI providers only to generate responses.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="flex flex-wrap gap-2"
                  style={{ flexDirection: tier === "mobile" ? "column" : "row" }}
                >
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    aria-label="Accept all cookies"
                    className="flex-1 font-mono font-bold rounded outline-none focus-visible:ring-2 focus-visible:ring-white/50 tracking-widest"
                    style={{
                      height: btnHeight[tier],
                      fontSize: fontSize[tier],
                      background: `${s.glow}22`,
                      border: `1px solid ${s.glow}66`,
                      color: s.text,
                      transition: "background 150ms ease, border-color 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${s.glow}33`;
                      e.currentTarget.style.borderColor = s.glow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${s.glow}22`;
                      e.currentTarget.style.borderColor = `${s.glow}66`;
                    }}
                  >
                    ACCEPT ALL
                  </button>

                  <button
                    type="button"
                    onClick={handleEssentialOnly}
                    aria-label="Accept essential cookies only"
                    className="flex-1 font-mono font-bold rounded outline-none focus-visible:ring-2 focus-visible:ring-white/50 tracking-widest"
                    style={{
                      height: btnHeight[tier],
                      fontSize: fontSize[tier],
                      background: "transparent",
                      border: `1px solid ${s.border}`,
                      color: s.dim,
                      transition: "color 150ms ease, border-color 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = s.text;
                      e.currentTarget.style.borderColor = `${s.glow}55`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = s.dim;
                      e.currentTarget.style.borderColor = s.border;
                    }}
                  >
                    ESSENTIAL ONLY
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={toggleDetails}
                    aria-label={showDetails ? "Hide cookie details" : "Show cookie details"}
                    aria-expanded={showDetails}
                    className="font-mono outline-none focus-visible:underline"
                    style={{
                      color: s.dim,
                      fontSize: `calc(${fontSize[tier]} - 0.02rem)`,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      transition: "color 150ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = s.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = s.dim; }}
                  >
                    {showDetails ? "▲ HIDE DETAILS" : "▼ SHOW DETAILS"}
                  </button>

                  {onPrivacyPolicyClick ? (
                    <button
                      type="button"
                      onClick={onPrivacyPolicyClick}
                      aria-label="Open Privacy Policy"
                      className="font-mono outline-none focus-visible:underline"
                      style={{
                        color: s.dim,
                        fontSize: `calc(${fontSize[tier]} - 0.02rem)`,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        transition: "color 150ms ease",
                        textDecoration: "underline",
                        textDecorationColor: `${s.dim}55`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = s.text; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = s.dim; }}
                    >
                      PRIVACY POLICY
                    </button>
                  ) : (
                    <span
                      className="font-mono"
                      style={{ color: `${s.dim}55`, fontSize: `calc(${fontSize[tier]} - 0.02rem)` }}
                    >
                      ASHU AI v2.0
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(CookieBannerInner);