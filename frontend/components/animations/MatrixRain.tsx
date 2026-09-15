// frontend/components/animations/MatrixRain.tsx
"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import { TerminalTheme, DeviceTier } from "@/types";

interface ThemeColor {
  primary: string;
  secondary: string;
  lead: string;
}

interface MatrixRainProps {
  theme?: TerminalTheme;
  tier?: DeviceTier;
  opacity?: number;
}

const THEME_COLORS: Record<TerminalTheme, ThemeColor> = {
  matrix: { primary: "#00ff88", secondary: "#00cc66", lead: "#ccffe8" },
  cyberpunk: { primary: "#ff0088", secondary: "#cc0066", lead: "#ffccdd" },
  holographic: { primary: "#00ffff", secondary: "#0099cc", lead: "#ccffff" },
  neon: { primary: "#b400ff", secondary: "#8800cc", lead: "#eeccff" },
  cyber: { primary: "#0088ff", secondary: "#0055cc", lead: "#cce4ff" },
  plasma: { primary: "#ff4400", secondary: "#cc3300", lead: "#ffd0c0" },
  aurora: { primary: "#00ffcc", secondary: "#00ccaa", lead: "#ccfff5" },
  inferno: { primary: "#ff8800", secondary: "#cc6600", lead: "#ffe0c0" },
  ghost: { primary: "#aaaaff", secondary: "#8888cc", lead: "#eeeeff" },
  crimson: { primary: "#ff2244", secondary: "#cc1133", lead: "#ffc0cc" },
};

const MATRIX_CHARS = "01アイウエオカキクケコサシスセソタチツテト";
const FONT_SIZE = 13;
const FRAME_INTERVAL_HIGH = 50;
const FRAME_INTERVAL_MID = 80;
const FRAME_INTERVAL_LOW = 150;

function MatrixRain({ theme = "matrix", tier = "high", opacity = 0.18 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<number[]>([]);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const drawArgsRef = useRef<{ ctx: CanvasRenderingContext2D; width: number; height: number } | null>(null);
  const colors = THEME_COLORS[theme];

  const getInterval = useCallback(() => {
    if (tier === "high") return FRAME_INTERVAL_HIGH;
    if (tier === "mid") return FRAME_INTERVAL_MID;
    return FRAME_INTERVAL_LOW;
  }, [tier]);

  const initDrops = useCallback((cols: number) => {
    dropsRef.current = Array.from({ length: cols }, () => Math.floor(Math.random() * -50));
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, now: number) => {
      if (isPausedRef.current) return;
      const interval = getInterval();
      if (now - lastFrameRef.current < interval) {
        animRef.current = requestAnimationFrame((t) => draw(ctx, width, height, t));
        return;
      }
      lastFrameRef.current = now;
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(0, 0, width, height);
      const cols = dropsRef.current.length;
      for (let i = 0; i < cols; i++) {
        const y = dropsRef.current[i];
        if (y === undefined) continue;
        if (y < 0) { dropsRef.current[i] = y + 1; continue; }
        const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] ?? "0";
        ctx.fillStyle = y === 0 ? colors.lead : (Math.random() > 0.9 ? colors.secondary : colors.primary);
        ctx.fillText(ch, i * FONT_SIZE, y * FONT_SIZE);
        if (y * FONT_SIZE > height && Math.random() > 0.975) {
          dropsRef.current[i] = 0;
        } else {
          dropsRef.current[i] = y + 1;
        }
      }
      animRef.current = requestAnimationFrame((t) => draw(ctx, width, height, t));
    },
    [colors, getInterval]
  );

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = `${FONT_SIZE}px monospace`;
    const cols = Math.floor(w / FONT_SIZE);
    initDrops(cols);
    drawArgsRef.current = { ctx, width: w, height: h };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame((t) => draw(ctx, w, h, t));
  }, [draw, initDrops]);

  useEffect(() => {
    if (tier === "low") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
          animRef.current = 0;
        }
      } else {
        isPausedRef.current = false;
        const args = drawArgsRef.current;
        if (args && !animRef.current) {
          animRef.current = requestAnimationFrame((t) => draw(args.ctx, args.width, args.height, t));
        }
      }
    };

    setupCanvas();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const observer = new ResizeObserver(setupCanvas);
    if (canvasRef.current?.parentElement) {
      observer.observe(canvasRef.current.parentElement);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [tier, setupCanvas, draw]);

  if (tier === "low") return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
        willChange: "transform",
      }}
      aria-hidden="true"
    />
  );
}
export default memo(MatrixRain);