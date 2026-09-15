// frontend/components/ui/DynamicFavicon.tsx
"use client";

import { useEffect, useRef } from "react";
import type { TerminalTheme } from "@/types";

interface DynamicFaviconProps {
  theme: TerminalTheme;
}

const THEME_COLORS: Record<TerminalTheme, { primary: string; secondary: string }> = {
  matrix: { primary: "#00ff88", secondary: "#003311" },
  cyberpunk: { primary: "#ff0088", secondary: "#330011" },
  holographic: { primary: "#00ffff", secondary: "#001133" },
  neon: { primary: "#b400ff", secondary: "#1a0033" },
  cyber: { primary: "#0088ff", secondary: "#001133" },
  plasma: { primary: "#ff4400", secondary: "#331100" },
  aurora: { primary: "#00ffcc", secondary: "#003322" },
  inferno: { primary: "#ff8800", secondary: "#331a00" },
  ghost: { primary: "#aaaaff", secondary: "#111133" },
  crimson: { primary: "#ff2244", secondary: "#330011" },
};

function drawFavicon(
  canvas: HTMLCanvasElement,
  primary: string,
  secondary: string,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = 32;
  canvas.width = size;
  canvas.height = size;

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, secondary);
  grad.addColorStop(1, "#000408");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 6);
  ctx.fill();

  ctx.strokeStyle = primary;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = primary;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.roundRect(1.5, 1.5, size - 3, size - 3, 5);
  ctx.stroke();

  ctx.shadowBlur = 8;
  ctx.fillStyle = primary;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", size / 2, size / 2 + 1);

  ctx.shadowBlur = 0;
  ctx.fillStyle = primary;
  ctx.globalAlpha = 0.7;
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("AI", size - 3, size - 2);
  ctx.globalAlpha = 1.0;
}

export default function DynamicFavicon({ theme }: DynamicFaviconProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const colors = THEME_COLORS[theme] ?? THEME_COLORS.holographic;
    drawFavicon(canvasRef.current, colors.primary, colors.secondary);

    const dataUrl = canvasRef.current.toDataURL("image/png");

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = dataUrl;

    let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }
    appleLink.href = dataUrl;

    document.title = `ASHU AI — ${theme.toUpperCase()}`;
  }, [theme]);

  return null;
}