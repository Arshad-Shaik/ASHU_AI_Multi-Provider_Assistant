// frontend/components/ui/HolographicLogoButton.tsx

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const LOGO_URL = "https://ashu-ai-assistant-logo.ai.studio/";

type DeviceTier = "low" | "mobile" | "tablet" | "desktop" | "tv";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface HolographicLogoButtonProps {
  onSpeak?: (text: string) => void;
  className?: string;
  compact?: boolean;
}

function detectTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const isWide = window.matchMedia("(min-width: 1280px)").matches;
  const ua = navigator.userAgent.toLowerCase();
  const isTV =
    ua.includes("smart-tv") ||
    ua.includes("smarttv") ||
    ua.includes("googletv") ||
    ua.includes("android tv") ||
    (isTouch && isWide && cores >= 4);
  if (isTV) return "tv";
  if (w < 768) return cores <= 4 ? "low" : "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getParticleCount(tier: DeviceTier): number {
  const map: Record<DeviceTier, number> = {
    low: 0,
    mobile: 10,
    tablet: 20,
    desktop: 30,
    tv: 30,
  };
  return map[tier];
}

const PARTICLE_COLORS = [
  "#00d4ff",
  "#00ff41",
  "#bf00ff",
  "#ffffff",
  "#00ffff",
  "#4fc3f7",
];

const HolographicLogoButton = React.memo(function HolographicLogoButton({
  onSpeak,
  className = "",
  compact = false,
}: HolographicLogoButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [tier, setTier] = useState<DeviceTier>("desktop");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSweep, setShowSweep] = useState(false);
  const [phase, setPhase] = useState<
    "idle" | "implode" | "spin" | "burst" | "sweep" | "settle"
  >("idle");
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isAnimatingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    setTier(detectTier());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => setTier(detectTier());
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  useEffect(() => {
    if (!canvasRef.current || !mounted) return;
    const el = canvasRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [mounted]);

  const spawnParticles = useCallback(
    (cx: number, cy: number, count: number) => {
      if (count === 0) return;
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        newParticles.push({
          id: Date.now() + i,
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: 2 + Math.random() * 3,
          color:
            PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)] ??
            "#00d4ff",
        });
      }
      particlesRef.current = newParticles;
      setParticles(newParticles);
    },
    []
  );

  useEffect(() => {
    if (!canvasRef.current || !mounted) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= 0.025;
        if (p.life > 0) {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          alive.push(p);
        }
      }
      particlesRef.current = alive;
      if (alive.length !== particles.length) {
        setParticles([...alive]);
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mounted, particles.length]);

  const handleClick = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    const speakText =
      "Launching ASHU AI Assistant Logo Modulator. Initializing holographic interface.";
    onSpeak?.(speakText);

    setPhase("implode");

    setTimeout(() => {
      setPhase("spin");
    }, 150);

    setTimeout(() => {
      setPhase("burst");
      if (canvasRef.current && tier !== "low") {
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = canvasRef.current.width / 2;
        const cy = canvasRef.current.height / 2;
        void rect;
        spawnParticles(cx, cy, getParticleCount(tier));
      }
    }, 300);

    setTimeout(() => {
      setPhase("sweep");
      if (tier !== "low" && tier !== "mobile") {
        setShowSweep(true);
      }
    }, 500);

    setTimeout(() => {
      setPhase("settle");
      setShowSweep(false);
    }, 700);

    setTimeout(() => {
      setPhase("idle");
      setIsAnimating(false);
      isAnimatingRef.current = false;
      window.open(LOGO_URL, "_blank", "noopener,noreferrer");
    }, 900);
  }, [tier, spawnParticles, onSpeak]);

  if (!mounted) return null;

  const isLow = tier === "low";
  const isCompactMode = compact;

  const ringSize = isCompactMode ? 48 : 72;
  const canvasSize = isCompactMode ? 120 : 180;

  return (
    <div className={`holographic-logo-wrapper ${className}`} style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: isCompactMode ? "4px" : "8px" }}>
      {showSweep && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, transparent 70%)",
            animation: "sweepPulse 0.4s ease-out forwards",
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={isAnimating}
        aria-label="Open ASHU AI Assistant Logo Modulator"
        style={{
          position: "relative",
          zIndex: 11,
          background: "transparent",
          border: "none",
          cursor: isAnimating ? "wait" : "pointer",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isCompactMode ? "4px" : "8px",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${ringSize}px`,
            height: `${ringSize}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={ringSize}
            height={ringSize}
            viewBox="0 0 72 72"
            style={{
              position: "absolute",
              inset: 0,
              animation: isLow
                ? "none"
                : phase === "spin"
                ? "hexSpin 0.4s linear"
                : "hexRotateSlow 8s linear infinite",
              transformOrigin: "center",
            }}
          >
            <polygon
              points="36,4 64,20 64,52 36,68 8,52 8,20"
              fill="none"
              stroke={phase === "burst" ? "#00ffff" : "#00d4ff"}
              strokeWidth={phase === "implode" ? "3" : "1.5"}
              strokeDasharray="8 4"
              opacity={phase === "implode" ? "0.4" : "0.7"}
            />
            <polygon
              points="36,10 59,23 59,49 36,62 13,49 13,23"
              fill="none"
              stroke="#bf00ff"
              strokeWidth="0.8"
              opacity="0.4"
              strokeDasharray="4 8"
              style={{
                animation: isLow
                  ? "none"
                  : "hexRotateSlow 12s linear infinite reverse",
                transformOrigin: "center",
              }}
            />
          </svg>

          <div
            style={{
              position: "relative",
              width: isCompactMode ? "32px" : "44px",
              height: isCompactMode ? "32px" : "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform:
                phase === "implode"
                  ? "scale(0.8)"
                  : phase === "settle"
                  ? "scale(1.05)"
                  : "scale(1)",
              transition: "transform 0.15s ease-out",
            }}
          >
            <svg
              width={isCompactMode ? "32" : "44"}
              height={isCompactMode ? "32" : "44"}
              viewBox="0 0 44 44"
              style={{ overflow: "visible" }}
            >
              <defs>
                <radialGradient id="logoGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#000814" stopOpacity="0.9" />
                </radialGradient>
                <filter id="logoGlow">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="22" cy="22" r="20" fill="url(#logoGrad)" />
              <circle
                cx="22"
                cy="22"
                r="20"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.5"
                opacity="0.6"
                style={{
                  animation: isLow ? "none" : "logoPulse 2s ease-in-out infinite",
                }}
              />
              <text
                x="22"
                y="16"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#00d4ff"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                filter="url(#logoGlow)"
                letterSpacing="1"
              >
                ASHU
              </text>
              <text
                x="22"
                y="26"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="5"
                fontFamily="monospace"
                opacity="0.8"
                letterSpacing="0.5"
              >
                AI
              </text>
              <text
                x="22"
                y="34"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#bf00ff"
                fontSize="4"
                fontFamily="monospace"
                opacity="0.7"
                letterSpacing="0.3"
              >
                ◈ v2.0 ◈
              </text>
            </svg>
          </div>
        </div>

        {!isCompactMode && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontFamily: "monospace",
                color: "#00d4ff",
                letterSpacing: "2px",
                textTransform: "uppercase",
                opacity: 0.9,
              }}
            >
              Logo Modulator
            </span>
            <span
              style={{
                fontSize: "7px",
                fontFamily: "monospace",
                color: "#ffffff",
                letterSpacing: "1px",
                opacity: 0.5,
              }}
            >
              click to launch ◈
            </span>
          </div>
        )}
      </button>

      <style>{`
        @keyframes hexRotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hexSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logoPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes sweepPulse {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .holographic-logo-wrapper:hover svg polygon:first-child {
          stroke: #00ffff;
          opacity: 1;
        }
        button:focus-visible .holographic-logo-wrapper {
          outline: 2px solid #00d4ff;
          outline-offset: 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
});

export default HolographicLogoButton;