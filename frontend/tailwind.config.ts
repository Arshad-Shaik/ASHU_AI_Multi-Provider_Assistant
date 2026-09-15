// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",

  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        terminal: [
          "var(--font-jetbrains)",
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Courier New",
          "monospace",
        ],
        display: [
          "var(--font-orbitron)",
          "Orbitron",
          "Share Tech Mono",
          "monospace",
        ],
        ui: [
          "var(--font-inter)",
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains)",
          "JetBrains Mono",
          "monospace",
        ],
      },

      colors: {
        terminal: {
          bg: {
            primary: "var(--color-bg-primary)",
            secondary: "var(--color-bg-secondary)",
            tertiary: "var(--color-bg-tertiary, var(--color-bg-terminal))",
            panel: "var(--color-bg-panel, var(--color-bg-card))",
            glass: "var(--color-bg-glass, var(--color-bubble-ai-bg))",
          },
          primary: "var(--color-primary)",
          "primary-dim": "var(--color-primary-dim, var(--color-primary))",
          "primary-ghost": "var(--color-primary-ghost, var(--color-glow))",
          "primary-border": "var(--color-primary-border, var(--color-border))",
          secondary: "var(--color-secondary)",
          "secondary-dim": "var(--color-secondary-dim, var(--color-secondary))",
          "secondary-ghost": "var(--color-secondary-ghost, var(--color-secondary))",
          green: "var(--color-accent-green)",
          "green-dim": "var(--color-accent-green-dim, var(--color-accent-green))",
          "green-ghost": "var(--color-accent-green-ghost, var(--color-accent-green))",
          violet: "var(--color-accent-violet)",
          "violet-dim": "var(--color-accent-violet-dim, var(--color-accent-violet))",
          "violet-ghost": "var(--color-accent-violet-ghost, var(--color-accent-violet))",
          orange: "var(--color-accent-orange)",
          "orange-dim": "var(--color-accent-orange-dim, var(--color-accent-orange))",
          "orange-ghost": "var(--color-accent-orange-ghost, var(--color-accent-orange))",
          red: "var(--color-accent-red)",
          "red-dim": "var(--color-accent-red-dim, var(--color-accent-red))",
          text: "var(--color-text-primary)",
          "text-secondary": "var(--color-text-secondary)",
          "text-muted": "var(--color-text-muted)",
          "text-terminal": "var(--color-text-terminal, var(--color-text-primary))",
          "text-dim": "var(--color-text-dim, var(--color-text-muted))",
        },
      },

      boxShadow: {
        "glow-cyan": "0 0 12px var(--color-glow, rgba(0,212,255,0.4))",
        "glow-cyan-sm": "0 0 6px var(--color-glow, rgba(0,212,255,0.4))",
        "glow-green": "0 0 12px rgba(0,255,65,0.4)",
        "glow-green-sm": "0 0 6px rgba(0,255,65,0.4)",
        "glow-violet": "0 0 12px rgba(124,58,237,0.4)",
        "glow-blue": "0 0 12px rgba(0,136,255,0.4)",
        "glow-orange": "0 0 12px rgba(255,107,0,0.4)",
        "glow-red": "0 0 12px rgba(255,0,64,0.4)",
      },

      borderRadius: {
        terminal: "var(--radius-md, var(--bubble-radius, 1rem))",
        "terminal-sm": "var(--radius-sm, 0.5rem)",
        "terminal-lg": "var(--radius-lg, 1.5rem)",
        "terminal-xl": "var(--radius-xl, 2rem)",
      },

      zIndex: {
        canvas: "var(--z-canvas, 0)",
        base: "var(--z-base, 1)",
        panel: "var(--z-panel, 40)",
        overlay: "var(--z-overlay, 45)",
        modal: "var(--z-modal, 50)",
        toast: "var(--z-toast, 60)",
        cursor: "var(--z-cursor, 70)",
      },

      transitionTimingFunction: {
        terminal: "cubic-bezier(0.4, 0, 0.2, 1)",
        glitch: "steps(1)",
      },

      transitionDuration: {
        fast: "80ms",
        base: "150ms",
        slow: "300ms",
      },

      keyframes: {
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "beam-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(280%)" },
        },
        "response-appear": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "panel-slide-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "panel-slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "glitch-shift-1": {
          "0%, 90%, 100%": { transform: "translate(0)", opacity: "0" },
          "92%": { transform: "translate(-3px, 1px)", opacity: "0.8" },
          "94%": { transform: "translate(3px, -1px)", opacity: "0.8" },
          "96%": { transform: "translate(-2px, 0)", opacity: "0.8" },
          "98%": { transform: "translate(0)", opacity: "0" },
        },
        "glitch-shift-2": {
          "0%, 88%, 100%": { transform: "translate(0)", opacity: "0" },
          "90%": { transform: "translate(3px, 2px)", opacity: "0.8" },
          "93%": { transform: "translate(-3px, -1px)", opacity: "0.8" },
          "96%": { transform: "translate(2px, 0)", opacity: "0.8" },
          "98%": { transform: "translate(0)", opacity: "0" },
        },
        "voice-ring": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "provider-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        "dot-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "holographic-shimmer": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(150%)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.8" },
          "100%": {
            transform: "translateY(-120px) scale(0.6)",
            opacity: "0",
          },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "data-stream": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        "neon-flicker": {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { opacity: "1" },
          "20%, 24%, 55%": { opacity: "0.4" },
        },
        "matrix-fade": {
          "0%": { opacity: "0.07" },
          "50%": { opacity: "0.12" },
          "100%": { opacity: "0.07" },
        },
        "scanline-drift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "border-scan": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },

      animation: {
        "cursor-blink": "cursor-blink 1.1s step-end infinite",
        "beam-sweep": "beam-sweep 1.4s ease-in-out infinite",
        "response-appear": "response-appear 250ms ease-out forwards",
        "panel-slide-right":
          "panel-slide-right 300ms cubic-bezier(0.4,0,0.2,1) forwards",
        "panel-slide-up":
          "panel-slide-up 300ms cubic-bezier(0.4,0,0.2,1) forwards",
        "fade-in": "fade-in 150ms ease forwards",
        "glitch-shift-1": "glitch-shift-1 4s steps(1) infinite",
        "glitch-shift-2": "glitch-shift-2 4s steps(1) infinite",
        "voice-ring": "voice-ring 1.2s ease-out infinite",
        "provider-pulse": "provider-pulse 2.5s ease-in-out infinite",
        "dot-pulse": "dot-pulse 2s ease-in-out infinite",
        "holographic-shimmer":
          "holographic-shimmer 3s linear infinite",
        "float-up": "float-up 2s ease-out forwards",
        "spin-slow": "spin-slow 8s linear infinite",
        "data-stream": "data-stream 4s linear infinite",
        "neon-flicker": "neon-flicker 3s linear infinite",
        "matrix-fade": "matrix-fade 4s ease-in-out infinite",
        "scanline-drift": "scanline-drift 12s linear infinite",
        "border-scan": "border-scan 2s ease-in-out infinite",
      },

      backdropBlur: {
        terminal: "12px",
        "terminal-heavy": "24px",
      },

      screens: {
        "xs": "375px",
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px",
        "3xl": "1920px",
        "4xl": "2560px",
        "tv": { raw: "(hover: none) and (min-width: 1280px)" },
      },

      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
    },
  },

  plugins: [],
};

export default config;