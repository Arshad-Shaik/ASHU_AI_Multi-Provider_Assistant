// frontend/app/page.tsx
"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTerminalStore } from "@/store/terminalStore";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useAuth } from "@/hooks/useAuth";
import HolographicTerminal from "@/components/terminal/HolographicTerminal";
import CookieBanner from "@/components/ui/CookieBanner";

type PerformanceTier = "low" | "mid" | "high";

const DEV_LINKEDIN_URL = "https://www.linkedin.com/in/arshadwasibshaik";
const DEV_GITHUB_URL = "https://github.com/Arshad-Shaik";
const APP_VERSION = "2.0";
const COPYRIGHT_YEAR = "2026";

function detectIsTV(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (min-width: 1280px)").matches;
}

function detectPerformanceTier(isTV: boolean): PerformanceTier {
  if (typeof window === "undefined") return "low";
  if (isTV) return "high";
  const cores = navigator.hardwareConcurrency ?? 2;
  if (window.matchMedia("(max-width: 768px)").matches) {
    return cores <= 4 ? "low" : "mid";
  }
  if (window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches) {
    return "mid";
  }
  return cores >= 8 ? "high" : "mid";
}

function initSpeechSynthesis(): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  const handler = () => {
    window.speechSynthesis.getVoices();
  };
  window.addEventListener("click", handler, { once: true, passive: true });
  window.addEventListener("keydown", handler, { once: true, passive: true });
  window.addEventListener("touchstart", handler, { once: true, passive: true });
}

interface GlowButtonProps {
  href: string;
  label: string;
  color: string;
  ariaLabel: string;
}

const GlowButton = memo(function GlowButton({ href, label, color, ariaLabel }: GlowButtonProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-white/40 select-none"
      style={{
        color: hovered ? "#000000" : color,
        background: hovered ? color : `${color}15`,
        border: `1px solid ${color}`,
        boxShadow: hovered ? `0 0 12px ${color}, 0 0 24px ${color}66` : `0 0 4px ${color}44`,
        transition: "color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
        willChange: "transform",
        textDecoration: "none",
      }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
    >
      {label}
    </motion.a>
  );
});

interface PrivacyModalProps {
  onClose: () => void;
}

const PrivacyModal = memo(function PrivacyModal({ onClose }: PrivacyModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Privacy Policy"
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg p-6 font-mono"
        style={{
          background: "rgba(0,4,8,0.98)",
          border: "1px solid #00ffff33",
          boxShadow: "0 0 60px rgba(0,255,255,0.08), 0 24px 64px rgba(0,0,0,0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          willChange: "transform, opacity",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close Privacy Policy"
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            color: "#00ffff88",
            background: "transparent",
            border: "1px solid #00ffff22",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          &#x2715;
        </button>

        <h2 className="font-bold tracking-widest mb-1" style={{ color: "#00ffff", fontSize: "0.8rem" }}>
          PRIVACY POLICY
        </h2>
        <p className="mb-4 tracking-widest" style={{ color: "#00ffff44", fontSize: "0.65rem" }}>
          ASHU AI ASSISTANT v{APP_VERSION} &#xB7; Effective {COPYRIGHT_YEAR}
        </p>

        <div style={{ color: "#00ffff88", fontSize: "0.7rem", lineHeight: "1.9" }}>
          <p className="mb-3 font-bold" style={{ color: "#00ffff" }}>1. Data Collection &amp; Storage</p>
          <p className="mb-3">
            ASHU AI stores your conversation data in a structured, encrypted format using unique session and memory identifiers.
            Your prompts are never stored verbatim in plain text linked directly to your identity. Each conversation is assigned
            a cryptographic memory ID — so your data is protected both from AI training misuse and from potential data breaches.
            Even if a breach were to occur, isolated memory IDs without context cannot be reverse-engineered to expose your original prompts.
          </p>

          <p className="mb-3 font-bold" style={{ color: "#00ffff" }}>2. AI Provider Processing</p>
          <p className="mb-3">
            ASHU AI routes your requests through up to 13 AI provider APIs with automatic fallback. Providers include Google Gemini,
            Groq, Mistral AI, OpenAI, xAI Grok, Anthropic Claude, Cerebras, OpenRouter, Cohere, HuggingFace, Cloudflare Workers AI,
            Together AI, and DeepSeek. Each provider operates under its own privacy policy and data retention rules. ASHU AI selects
            the best available provider at the time of your request.
          </p>

          <p className="mb-3 font-bold" style={{ color: "#00ffff" }}>3. Authentication &amp; Session Data</p>
          <p className="mb-3">
            Authentication is handled securely via Supabase with Google OAuth and GitHub OAuth. Session tokens are stored in browser
            memory and never persisted to third-party analytics platforms. Your user ID is a randomly generated UUID — not linked to
            any personally identifiable information beyond your email address for login.
          </p>

          <p className="mb-3 font-bold" style={{ color: "#00ffff" }}>4. Cookies &amp; Local Storage</p>
          <p className="mb-3">
            Essential cookies store your session token, theme preference, voice agent state, and command history locally in browser
            localStorage. No advertising cookies or cross-site tracking cookies are used. Analytics data collected is aggregated and
            anonymized — no individual user behaviour is sold or shared with third parties beyond the AI providers required to fulfill
            your requests.
          </p>

          <p className="mb-3 font-bold" style={{ color: "#00ffff" }}>5. Memory IDs — Your Privacy Shield</p>
          <p className="mb-4">
            The ASHU AI Memory System assigns each saved response a unique alphanumeric Memory ID. This means your conversation data
            exists in isolated, context-free fragments rather than as a continuous readable transcript. Users can recall specific
            responses by their ID without exposing the full conversation context to any system component. This architecture significantly
            reduces the risk surface of any data exposure event.
          </p>

          <p className="mb-3 font-bold" style={{ color: "#00ffff" }}>6. Your Rights</p>
          <p className="mb-4">
            You may delete any memory entry at any time from the Memory Panel. Deleting your account removes all associated
            conversations, messages, and analytics data permanently via cascading database deletion. You may export your chat history
            at any time using the /export command.
          </p>

          <div className="rounded p-3 mt-2 mb-3" style={{ border: "1px solid #00ffff22", background: "#00ffff06" }}>
            <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: "#00ffff" }}>DEVELOPER</p>
            <p className="mb-2" style={{ color: "#00ffff88", fontSize: "0.7rem" }}>
              Built with precision by AWS &#x2014; Arshad Wasib Shaik
            </p>
            <div className="flex flex-wrap gap-2">
              <GlowButton href={DEV_LINKEDIN_URL} label="LinkedIn" color="#0088ff" ariaLabel="Visit developer LinkedIn profile" />
              <GlowButton href={DEV_GITHUB_URL} label="GitHub" color="#00ff88" ariaLabel="Visit developer GitHub profile" />
            </div>
          </div>

          <p style={{ color: "#00ffff44", fontSize: "0.65rem" }}>
            &#169; {COPYRIGHT_YEAR} ASHU AI Assistant &#x2014; AWS &#x2014; Arshad Wasib Shaik.
            Built with integrity and passion for AI technology and human-computer interaction. All rights reserved.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
});

interface FooterProps {
  onPrivacyPolicyClick: () => void;
}

const HolographicFooter = memo(function HolographicFooter({ onPrivacyPolicyClick }: FooterProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <footer
      className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 font-mono"
      style={{
        borderTop: "1px solid #00ffff15",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        fontSize: "0.6rem",
        minHeight: "28px",
      }}
      aria-label="Application footer"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="footer-glow-text"
          style={{ color: "#00ffff88" }}
        >
          &#169; {COPYRIGHT_YEAR} ASHU AI v{APP_VERSION}
        </span>
        <span style={{ color: "#00ffff33" }}>&#x7C;</span>
        <span
          className="footer-glow-text"
          style={{ color: "#00ffff77" }}
          aria-label="Developer: AWS - Arshad Wasib Shaik"
        >
          AWS &#x2014; Arshad Wasib Shaik
        </span>
        <span style={{ color: "#00ffff33" }}>&#x7C;</span>
        <div className="flex items-center gap-2">
          <GlowButton href={DEV_LINKEDIN_URL} label="LinkedIn" color="#0088ff" ariaLabel="Visit developer LinkedIn profile" />
          <GlowButton href={DEV_GITHUB_URL} label="GitHub" color="#00ff88" ariaLabel="Visit developer GitHub profile" />
        </div>
      </div>

      <button
        type="button"
        onClick={onPrivacyPolicyClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Open Privacy Policy"
        className="outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1"
        style={{
          color: hovered ? "#00ffff" : "#00ffff66",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "0.6rem",
          transition: "color 0.15s ease",
          textShadow: hovered ? "0 0 8px #00ffff88" : "none",
        }}
      >
        Privacy Policy
      </button>
    </footer>
  );
});

export default function Page() {
  const theme = useTerminalStore((s) => s.theme);
  const { isAuthenticated } = useAuth();
  const [tier, setTier] = useState<PerformanceTier>("low");
  const [isTV, setIsTV] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const tvDetected = detectIsTV();
    setIsTV(tvDetected);
    setTier(detectPerformanceTier(tvDetected));
  }, []);

  useEffect(() => {
    initSpeechSynthesis();
  }, []);

  const handlePrivacyOpen = useCallback(() => {
    setShowPrivacy(true);
  }, []);

  const handlePrivacyClose = useCallback(() => {
    setShowPrivacy(false);
  }, []);

  return (
    <div
      data-theme={theme}
      data-tier={tier}
      data-tv={String(isTV)}
      className="flex flex-col h-[100dvh] w-full overflow-hidden"
      suppressHydrationWarning
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        <HolographicTerminal />
      </div>

      <HolographicFooter onPrivacyPolicyClick={handlePrivacyOpen} />

      <CookieBanner
        theme={theme}
        onPrivacyPolicyClick={handlePrivacyOpen}
        isAuthenticated={isAuthenticated}
      />

      <AnimatePresence>
        {showPrivacy && (
          <PrivacyModal key="privacy-modal" onClose={handlePrivacyClose} />
        )}
      </AnimatePresence>
    </div>
  );
}