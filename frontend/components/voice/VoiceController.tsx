// frontend/components/voice/VoiceController.tsx
"use client";

import { memo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalTheme } from "@/types";

type ThemeColor = {
  readonly primary: string;
  readonly glow: string;
  readonly bar: string;
  readonly ring: string;
};

const THEME_COLORS: Record<TerminalTheme, ThemeColor> = {
  holographic: { primary: "#00d4ff", glow: "rgba(0,212,255,0.6)",   bar: "#00d4ff", ring: "rgba(0,212,255,0.3)"   },
  matrix:      { primary: "#00ff41", glow: "rgba(0,255,65,0.6)",    bar: "#00ff41", ring: "rgba(0,255,65,0.3)"    },
  cyberpunk:   { primary: "#ff006e", glow: "rgba(255,0,110,0.6)",   bar: "#ff006e", ring: "rgba(255,0,110,0.3)"   },
  neon:        { primary: "#b400ff", glow: "rgba(180,0,255,0.6)",   bar: "#b400ff", ring: "rgba(180,0,255,0.3)"   },
  cyber:       { primary: "#0088ff", glow: "rgba(0,136,255,0.6)",   bar: "#0088ff", ring: "rgba(0,136,255,0.3)"   },
  plasma:      { primary: "#ff4400", glow: "rgba(255,68,0,0.6)",    bar: "#ff4400", ring: "rgba(255,68,0,0.3)"    },
  aurora:      { primary: "#00ffcc", glow: "rgba(0,255,204,0.6)",   bar: "#00ffcc", ring: "rgba(0,255,204,0.3)"   },
  inferno:     { primary: "#ff8800", glow: "rgba(255,136,0,0.6)",   bar: "#ff8800", ring: "rgba(255,136,0,0.3)"   },
  ghost:       { primary: "#aaaaff", glow: "rgba(170,170,255,0.6)", bar: "#aaaaff", ring: "rgba(170,170,255,0.3)" },
  crimson:     { primary: "#ff2244", glow: "rgba(255,34,68,0.6)",   bar: "#ff2244", ring: "rgba(255,34,68,0.3)"   },
};

const EQUALIZER_OFFSETS = [0, 1, 2] as const;

export interface VoiceControllerProps {
  isEnabled: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  lastSpokenText: string | null;
  theme?: TerminalTheme;
  onToggle: () => void;
}

function VoiceControllerInner({
  isEnabled,
  isSpeaking,
  isSupported,
  lastSpokenText,
  theme = "holographic",
  onToggle,
}: VoiceControllerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const colors = THEME_COLORS[theme];

  const handleFocus = useCallback(() => {
    if (!buttonRef.current) return;
    buttonRef.current.style.outline = `2px solid ${colors.primary}`;
    buttonRef.current.style.outlineOffset = "2px";
  }, [colors.primary]);

  const handleBlur = useCallback(() => {
    if (!buttonRef.current) return;
    buttonRef.current.style.outline = "none";
    buttonRef.current.style.outlineOffset = "0px";
  }, []);

  if (!isSupported) return null;

  const stateLabel = isEnabled
    ? isSpeaking
      ? "Voice agent speaking ? click to disable"
      : "Voice agent enabled ? click to disable"
    : "Voice agent disabled ? click to enable";

  return (
    <div
      className="relative shrink-0 flex items-center gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {isSpeaking && lastSpokenText && (
          <motion.div
            key="tooltip-desktop"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded max-w-[16rem] overflow-hidden font-mono"
            style={{
              background: "rgba(0,0,0,0.95)",
              border: `1px solid ${colors.ring}`,
              color: colors.primary,
              fontSize: "10px",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              willChange: "transform, opacity",
            }}
            aria-label="speaking tooltip"
          >
            {lastSpokenText}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSpeaking && lastSpokenText && (
          <motion.span
            key="tooltip-mobile"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="sm:hidden max-w-[6rem] overflow-hidden whitespace-nowrap font-mono"
            style={{
              color: colors.primary,
              fontSize: "9px",
              textOverflow: "ellipsis",
              display: "block",
              willChange: "transform, opacity",
            }}
          >
            {lastSpokenText}
          </motion.span>
        )}
      </AnimatePresence>

      <div className="relative shrink-0">
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: isEnabled ? `0 0 10px ${colors.ring}` : "none",
          }}
          aria-hidden="true"
        />

        <motion.button
          ref={buttonRef}
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={onToggle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-pressed={isEnabled}
          aria-label={stateLabel}
          className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 outline-none"
          style={{
            background: isEnabled ? `${colors.primary}22` : "transparent",
            border: `1px solid ${isEnabled ? colors.primary : colors.ring}`,
            color: isEnabled ? colors.primary : `${colors.primary}66`,
            willChange: "transform",
            transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
          }}
        >
          {isEnabled && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `1px solid ${colors.primary}` }}
              animate={{
                scale: isSpeaking ? [1, 1.45, 1] : [1, 1.2, 1],
                opacity: isSpeaking ? [0.7, 0, 0.7] : [0.5, 0, 0.5],
              }}
              transition={{
                duration: isSpeaking ? 0.85 : 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
              aria-hidden="true"
            />
          )}

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9.5"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.35"
            />

            <motion.circle
              cx="12"
              cy="12"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              animate={
                isSpeaking
                  ? { scale: [1, 1.18, 1], opacity: [0.9, 0.3, 0.9] }
                  : { scale: 1, opacity: 0.7 }
              }
              transition={
                isSpeaking
                  ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            />

            {isSpeaking ? (
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {EQUALIZER_OFFSETS.map((offset) => (
                  <motion.line
                    key={offset}
                    x1={9 + offset * 3}
                    x2={9 + offset * 3}
                    y1={7}
                    y2={17}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
                    animate={{ scaleY: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 0.55,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: offset * 0.14,
                    }}
                  />
                ))}
              </g>
            ) : (
              <circle
                cx="12"
                cy="12"
                r="2"
                fill="currentColor"
                opacity={isEnabled ? 0.95 : 0.6}
              />
            )}
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

export default memo(VoiceControllerInner);
