// frontend/components/animations/ParticleField.tsx
"use client";
import { useEffect, useRef, useCallback, memo } from "react";
import { TerminalTheme, DeviceTier } from "@/types";
interface ParticleThemeColor {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  pulseOffset: number;
}

interface ParticleFieldProps {
  theme?: TerminalTheme;
  tier?: DeviceTier;
  count?: number;
  speed?: number;
}

const THEME_COLORS: Record<TerminalTheme, ParticleThemeColor> = {
  matrix: { primary: "#00ff88", secondary: "#00cc66", tertiary: "#009944", background: "#000800" },
  cyberpunk: { primary: "#ff0088", secondary: "#ff44aa", tertiary: "#cc0066", background: "#080008" },
  holographic: { primary: "#00ffff", secondary: "#44ddff", tertiary: "#0099cc", background: "#000808" },
  neon: { primary: "#b400ff", secondary: "#cc44ff", tertiary: "#8800cc", background: "#040008" },
  cyber: { primary: "#0088ff", secondary: "#44aaff", tertiary: "#0055cc", background: "#000408" },
  plasma: { primary: "#ff4400", secondary: "#ff6633", tertiary: "#cc3300", background: "#080200" },
  aurora: { primary: "#00ffcc", secondary: "#33ffdd", tertiary: "#00ccaa", background: "#000807" },
  inferno: { primary: "#ff8800", secondary: "#ffaa33", tertiary: "#cc6600", background: "#080400" },
  ghost: { primary: "#aaaaff", secondary: "#ccccff", tertiary: "#8888cc", background: "#040408" },
  crimson: { primary: "#ff2244", secondary: "#ff4466", tertiary: "#cc1133", background: "#080002" },
};

const COUNT_BY_TIER: Record<DeviceTier, number> = { low: 0, mid: 25, high: 60 };

function createParticle(w: number, h: number, colors: ParticleThemeColor, speed: number): Particle {
  const colorOptions = [colors.primary, colors.secondary, colors.tertiary];
  const chosenColor = colorOptions[Math.floor(Math.random() * colorOptions.length)] ?? colors.primary;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * speed * 0.4,
    vy: (Math.random() - 0.5) * speed * 0.4,
    radius: 0.8 + Math.random() * 1.6,
    opacity: 0.2 + Math.random() * 0.6,
    color: chosenColor,
    pulseOffset: Math.random() * Math.PI * 2,
  };
}

function ParticleField({ theme = "matrix", tier = "high", count, speed = 1 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const colorsRef = useRef(THEME_COLORS[theme]);

  useEffect(() => {
    colorsRef.current = THEME_COLORS[theme];
  }, [theme]);

  const getCount = useCallback(() => {
    return count !== undefined ? count : COUNT_BY_TIER[tier];
  }, [count, tier]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w;
    canvas.height = h;
    const n = getCount();
    particlesRef.current = Array.from({ length: n }, () =>
      createParticle(w, h, colorsRef.current, speed)
    );
  }, [getCount, speed]);

  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      ctx.clearRect(0, 0, w, h);
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        const pulse = 0.7 + 0.3 * Math.sin(time * 0.001 + p.pulseOffset);
        ctx.globalAlpha = p.opacity * pulse;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame((t) => animate(ctx, w, h, t));
    },
    []
  );

  useEffect(() => {
    if (tier === "low" || getCount() === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setupCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stopAnimation = () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = 0;
      }
    };

    const startAnimation = () => {
      stopAnimation();
      animRef.current = requestAnimationFrame((t) => animate(ctx, canvas.width, canvas.height, t));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new ResizeObserver(() => {
      setupCanvas();
    });
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAnimation();
    };
  }, [tier, getCount, setupCanvas, animate]);

  if (tier === "low" || getCount() === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        willChange: "transform",
      }}
      aria-hidden="true"
    />
  );
}
export default memo(ParticleField);