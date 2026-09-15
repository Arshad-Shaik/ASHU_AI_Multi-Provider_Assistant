// frontend/components/animations/HolographicGrid.tsx
"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import { TerminalTheme, DeviceTier } from "@/types";

export interface HolographicGridProps {
  theme?: TerminalTheme;
  tier?: DeviceTier;
  opacity?: number;
}

interface ThemeColor {
  primary: string;
  secondary: string;
}

const THEME_COLORS: Record<TerminalTheme, ThemeColor> = {
  matrix: { primary: "#00ff88", secondary: "#00cc66" },
  cyberpunk: { primary: "#ff0088", secondary: "#cc0066" },
  holographic: { primary: "#00ffff", secondary: "#0099cc" },
  neon: { primary: "#b400ff", secondary: "#8800cc" },
  cyber: { primary: "#0088ff", secondary: "#0055cc" },
  plasma: { primary: "#ff4400", secondary: "#cc3300" },
  aurora: { primary: "#00ffcc", secondary: "#00ccaa" },
  inferno: { primary: "#ff8800", secondary: "#cc6600" },
  ghost: { primary: "#aaaaff", secondary: "#8888cc" },
  crimson: { primary: "#ff2244", secondary: "#cc1133" },
};

const GRID_SIZE = 60;
const FRAME_INTERVAL_HIGH = 0;
const FRAME_INTERVAL_MID = 45;

function HolographicGrid({ theme = "matrix", tier = "high", opacity = 0.07 }: HolographicGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const drawArgsRef = useRef<{ ctx: CanvasRenderingContext2D; width: number; height: number } | null>(null);
  const colors = THEME_COLORS[theme];

  const getInterval = useCallback(() => {
    return tier === "mid" ? FRAME_INTERVAL_MID : FRAME_INTERVAL_HIGH;
  }, [tier]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (isPausedRef.current) return;
      const interval = getInterval();
      if (interval > 0 && time - lastFrameRef.current < interval) {
        animRef.current = requestAnimationFrame((t) => draw(ctx, w, h, t));
        return;
      }
      lastFrameRef.current = time;

      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / GRID_SIZE) + 1;
      const rows = Math.ceil(h / GRID_SIZE) + 1;
      const offsetX = (time * 0.3) % GRID_SIZE;
      const offsetY = (time * 0.15) % GRID_SIZE;

      ctx.lineWidth = 0.5;

      for (let i = 0; i < cols; i++) {
        const x = i * GRID_SIZE - offsetX;
        const wave = Math.sin(time * 0.001 + i * 0.3) * 0.4 + 0.6;
        ctx.strokeStyle = `${colors.primary}${Math.round(wave * 40).toString(16).padStart(2, "0")}`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let j = 0; j < rows; j++) {
        const y = j * GRID_SIZE - offsetY;
        const wave = Math.sin(time * 0.001 + j * 0.4) * 0.4 + 0.6;
        ctx.strokeStyle = `${colors.secondary}${Math.round(wave * 30).toString(16).padStart(2, "0")}`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GRID_SIZE - offsetX;
          const y = j * GRID_SIZE - offsetY;
          const pulse = Math.sin(time * 0.002 + i * 0.5 + j * 0.3) * 0.5 + 0.5;
          if (pulse > 0.8) {
            ctx.fillStyle = `${colors.primary}${Math.round(pulse * 60).toString(16).padStart(2, "0")}`;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animRef.current = requestAnimationFrame((t) => draw(ctx, w, h, t));
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
    drawArgsRef.current = { ctx, width: w, height: h };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame((t) => draw(ctx, w, h, t));
  }, [draw]);

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
    if (canvasRef.current?.parentElement) observer.observe(canvasRef.current.parentElement);

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

export default memo(HolographicGrid);