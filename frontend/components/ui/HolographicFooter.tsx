// frontend/components/ui/HolographicFooter.tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
  useMemo,
} from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { TerminalTheme } from "@/types";

type DeviceTier = "mobile" | "tablet" | "desktop" | "tv";

interface FooterLink {
  label: string;
  href: string;
  external: boolean;
}

interface FooterProps {
  theme?: TerminalTheme;
  developerName?: string;
  developerLinkedIn?: string;
  developerGitHub?: string;
  developerPortfolio?: string;
  onPrivacyPolicyClick?: () => void;
}

interface ThemeColors {
  bg: string;
  border: string;
  text: string;
  dim: string;
  glow: string;
  accent: string;
  scanline: string;
  node: string;
}

const THEME_COLORS: Record<TerminalTheme, ThemeColors> = {
  matrix: {
    bg: "rgba(0,6,0,0.98)",
    border: "#00ff8820",
    text: "#00ff88",
    dim: "#00ff8855",
    glow: "#00ff88",
    accent: "#00cc66",
    scanline: "#00ff8806",
    node: "#00ff4488",
  },
  cyberpunk: {
    bg: "rgba(6,0,3,0.98)",
    border: "#ff008820",
    text: "#ff0088",
    dim: "#ff008855",
    glow: "#ff0088",
    accent: "#cc0066",
    scanline: "#ff008806",
    node: "#ff004488",
  },
  holographic: {
    bg: "rgba(0,3,8,0.98)",
    border: "#00ffff20",
    text: "#00ffff",
    dim: "#00ffff55",
    glow: "#00ffff",
    accent: "#0099cc",
    scanline: "#00ffff06",
    node: "#00ccff88",
  },
  neon: {
    bg: "rgba(3,0,8,0.98)",
    border: "#b400ff20",
    text: "#b400ff",
    dim: "#b400ff55",
    glow: "#b400ff",
    accent: "#8800cc",
    scanline: "#b400ff06",
    node: "#8800ff88",
  },
  cyber: {
    bg: "rgba(0,2,8,0.98)",
    border: "#0088ff20",
    text: "#0088ff",
    dim: "#0088ff55",
    glow: "#0088ff",
    accent: "#0055cc",
    scanline: "#0088ff06",
    node: "#0066ff88",
  },
  plasma: {
    bg: "rgba(6,2,0,0.98)",
    border: "#ff440020",
    text: "#ff4400",
    dim: "#ff440055",
    glow: "#ff4400",
    accent: "#cc3300",
    scanline: "#ff440006",
    node: "#ff220088",
  },
  aurora: {
    bg: "rgba(0,6,5,0.98)",
    border: "#00ffcc20",
    text: "#00ffcc",
    dim: "#00ffcc55",
    glow: "#00ffcc",
    accent: "#00ccaa",
    scanline: "#00ffcc06",
    node: "#00ddaa88",
  },
  inferno: {
    bg: "rgba(6,3,0,0.98)",
    border: "#ff880020",
    text: "#ff8800",
    dim: "#ff880055",
    glow: "#ff8800",
    accent: "#cc6600",
    scanline: "#ff880006",
    node: "#ff660088",
  },
  ghost: {
    bg: "rgba(2,2,6,0.98)",
    border: "#aaaaff20",
    text: "#aaaaff",
    dim: "#aaaaff55",
    glow: "#aaaaff",
    accent: "#8888cc",
    scanline: "#aaaaff06",
    node: "#9999ff88",
  },
  crimson: {
    bg: "rgba(6,0,2,0.98)",
    border: "#ff224420",
    text: "#ff2244",
    dim: "#ff224455",
    glow: "#ff2244",
    accent: "#cc1133",
    scanline: "#ff224406",
    node: "#ff003388",
  },
};

const YEAR = new Date().getFullYear();

function detectTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const hasHover = window.matchMedia("(hover: hover)").matches;
  if (!hasHover && w >= 1280) return "tv";
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function speakLabel(label: string): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(label);
  utt.rate = 1.1;
  utt.pitch = 0.9;
  utt.volume = 0.85;
  window.speechSynthesis.speak(utt);
}

interface WebNode {
  x: number;
  y: number;
  r: number;
  phase: number;
}

interface WebStrand {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  delay: number;
  duration: number;
}

function buildWebGeometry(w: number, h: number): { nodes: WebNode[]; strands: WebStrand[] } {
  const cols = 8;
  const rows = 3;
  const nodes: WebNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({
        x: (c / (cols - 1)) * w,
        y: (r / (rows - 1)) * h,
        r: 2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  const strands: WebStrand[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const ni = nodes[i];
      const nj = nodes[j];
      if (!ni || !nj) continue;
      const dx = nj.x - ni.x;
      const dy = nj.y - ni.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > w * 0.35) continue;
      const mx = (ni.x + nj.x) / 2;
      const my = (ni.y + nj.y) / 2;
      const bend = (Math.random() - 0.5) * h * 0.4;
      const perpX = -dy / dist;
      const perpY = dx / dist;
      strands.push({
        x1: ni.x,
        y1: ni.y,
        x2: nj.x,
        y2: nj.y,
        cx1: mx + perpX * bend * 0.5,
        cy1: my + perpY * bend * 0.5,
        cx2: mx + perpX * bend,
        cy2: my + perpY * bend,
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 2,
      });
    }
  }
  return { nodes, strands };
}

interface WebOverlayProps {
  width: number;
  height: number;
  glowColor: string;
  dimColor: string;
  nodeColor: string;
  paused: boolean;
}

function WebOverlay({ width, height, glowColor, dimColor, nodeColor, paused }: WebOverlayProps) {
  const geometry = useMemo(
    () => buildWebGeometry(width, height),
    [width, height],
  );

  if (width === 0 || height === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ opacity: paused ? 0 : 1, transition: "opacity 600ms ease", willChange: "opacity" }}
    >
      <defs>
        <filter id="footer-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {geometry.strands.map((strand, i) => (
        <motion.path
          key={i}
          d={`M ${strand.x1} ${strand.y1} C ${strand.cx1} ${strand.cy1} ${strand.cx2} ${strand.cy2} ${strand.x2} ${strand.y2}`}
          fill="none"
          stroke={dimColor}
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            paused
              ? { pathLength: 0, opacity: 0 }
              : { pathLength: 1, opacity: [0, 0.6, 0.3] }
          }
          transition={{
            pathLength: {
              delay: strand.delay,
              duration: strand.duration,
              ease: "easeInOut",
            },
            opacity: {
              delay: strand.delay,
              duration: strand.duration,
              ease: "easeInOut",
            },
          }}
          style={{ willChange: "opacity" }}
        />
      ))}

      {geometry.nodes.map((node, i) => (
        <motion.circle
          key={`n${i}`}
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={nodeColor}
          filter="url(#footer-glow)"
          initial={{ opacity: 0, scale: 0 }}
          animate={
            paused
              ? { opacity: 0, scale: 0 }
              : {
                  opacity: [0, 0.9, 0.4, 0.9],
                  scale: [0, 1, 0.8, 1],
                }
          }
          transition={{
            delay: node.phase * 0.3,
            duration: 3 + node.phase * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ willChange: "opacity, transform" }}
        />
      ))}

      <motion.line
        x1={0}
        y1={height * 0.5}
        x2={width}
        y2={height * 0.5}
        stroke={glowColor}
        strokeWidth="0.3"
        strokeDasharray="4 8"
        animate={paused ? { opacity: 0 } : { opacity: [0.08, 0.25, 0.08] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "opacity" }}
      />
    </svg>
  );
}

const MemoWebOverlay = memo(WebOverlay);

function HolographicFooterInner({
  theme = "holographic",
  developerName = "AWS - | Arshad Wasib Shaik |",
  developerLinkedIn = "",
  developerGitHub = "",
  developerPortfolio = "",
  onPrivacyPolicyClick,
}: FooterProps) {
  const [tier, setTier] = useState<DeviceTier>("desktop");
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [inViewport, setInViewport] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const glitchRef = useRef<HTMLSpanElement>(null);
  const glitchFrameRef = useRef(0);
  const controls = useAnimation();
  const isInView = useInView(footerRef, { amount: 0.1 });

  const c = THEME_COLORS[theme];

  useEffect(() => {
    const update = () => {
      setTier(detectTier());
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setDims({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setInViewport(isInView);
  }, [isInView]);

  useEffect(() => {
    if (!inViewport || (tier !== "desktop" && tier !== "tv")) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let frame = 0;
    const glitchChars = "!@#$%^&*<>?/\\|~";

    const tick = () => {
      frame++;
      if (glitchRef.current && frame % 90 === 0 && Math.random() > 0.6) {
        const original = glitchRef.current.getAttribute("data-original") ?? "";
        const glitched = original
          .split("")
          .map((ch) =>
            Math.random() > 0.8
              ? (glitchChars[Math.floor(Math.random() * glitchChars.length)] ?? ch)
              : ch,
          )
          .join("");
        glitchRef.current.textContent = glitched;
        setTimeout(() => {
          if (glitchRef.current) {
            glitchRef.current.textContent = glitchRef.current.getAttribute("data-original") ?? "";
          }
        }, 80);
      }
      glitchFrameRef.current = frame;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [inViewport, tier]);

  useEffect(() => {
    if (inViewport) {
      controls.start({ opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } });
    }
  }, [inViewport, controls]);

  const links = useMemo<FooterLink[]>(() => {
    const result: FooterLink[] = [];
    if (developerLinkedIn) {
      result.push({ label: "LinkedIn", href: developerLinkedIn, external: true });
    }
    if (developerGitHub) {
      result.push({ label: "GitHub", href: developerGitHub, external: true });
    }
    if (developerPortfolio) {
      result.push({ label: "Portfolio", href: developerPortfolio, external: true });
    }
    result.push({ label: "Privacy Policy", href: "#privacy", external: false });
    return result;
  }, [developerLinkedIn, developerGitHub, developerPortfolio]);

  const handleLinkClick = useCallback(
    (link: FooterLink, e: React.MouseEvent) => {
      speakLabel(link.label);
      if (!link.external && link.href === "#privacy") {
        e.preventDefault();
        onPrivacyPolicyClick?.();
      }
    },
    [onPrivacyPolicyClick],
  );

  const tvFontScale = tier === "tv" ? 1.35 : 1;

  const mobileTabletFooter = (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      aria-label="ASHU AI site footer"
      className="relative w-full overflow-hidden"
      style={{
        background: c.bg,
        borderTop: `1px solid ${c.border}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        willChange: "transform, opacity",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${c.scanline} 0px, ${c.scanline} 1px, transparent 1px, transparent 3px)`,
        }}
      />
      <div className="relative flex flex-col items-center gap-2 py-4 px-4">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono font-bold tracking-widest text-center"
          style={{ color: c.text, fontSize: "0.65rem", willChange: "opacity" }}
        >
          ◈ ASHU AI v2.0 ◈
        </motion.div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              aria-label={link.label}
              onClick={(e) => handleLinkClick(link, e)}
              className="font-mono outline-none focus-visible:underline"
              style={{
                color: c.dim,
                fontSize: "0.62rem",
                textDecoration: "none",
                transition: "color 150ms ease",
              }}
              onTouchStart={(e) => { e.currentTarget.style.color = c.text; }}
              onTouchEnd={(e) => { e.currentTarget.style.color = c.dim; }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <p
          className="font-mono text-center"
          style={{ color: `${c.dim}66`, fontSize: "0.58rem" }}
        >
          © {YEAR} {developerName}. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );

  const desktopTvFooter = (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 24 }}
      animate={controls}
      aria-label="ASHU AI site footer"
      className="relative w-full overflow-hidden"
      style={{
        background: c.bg,
        borderTop: `1px solid ${c.border}`,
        minHeight: tier === "tv" ? "9rem" : "7rem",
        willChange: "transform, opacity",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${c.scanline} 0px, ${c.scanline} 1px, transparent 1px, transparent 3px)`,
        }}
      />

      <MemoWebOverlay
        width={dims.w}
        height={dims.h}
        glowColor={c.glow}
        dimColor={c.dim}
        nodeColor={c.node}
        paused={!inViewport}
      />

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ borderTop: `1px solid ${c.glow}`, willChange: "opacity" }}
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="relative flex flex-col items-center justify-center gap-3 h-full py-5 px-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            aria-hidden="true"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: c.glow, fontSize: `calc(1rem * ${tvFontScale})`, willChange: "opacity, transform" }}
          >
            ◈
          </motion.div>

          <span
            ref={glitchRef}
            data-original="ASHU AI v2.0"
            className="font-mono font-bold tracking-widest select-none"
            style={{ color: c.text, fontSize: `calc(0.75rem * ${tvFontScale})` }}
          >
            ASHU AI v2.0
          </span>

          <motion.div
            aria-hidden="true"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.25 }}
            style={{ color: c.glow, fontSize: `calc(1rem * ${tvFontScale})`, willChange: "opacity, transform" }}
          >
            ◈
          </motion.div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 items-center">
          {links.map((link, idx) => (
            <span key={link.label} className="flex items-center gap-6">
              {idx > 0 && (
                <span aria-hidden="true" style={{ color: `${c.dim}44`, fontSize: "0.6rem" }}>
                  │
                </span>
              )}
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                aria-label={link.label}
                onClick={(e) => handleLinkClick(link, e)}
                className="font-mono outline-none group"
                style={{
                  color: c.dim,
                  fontSize: `calc(0.65rem * ${tvFontScale})`,
                  textDecoration: "none",
                  transition: "color 150ms ease",
                  ...(tier === "tv"
                    ? {
                        padding: "0.5rem 0.75rem",
                        borderRadius: "4px",
                        border: `2px solid transparent`,
                      }
                    : {}),
                }}
                onFocus={(e) => {
                  e.currentTarget.style.color = c.text;
                  if (tier === "tv") {
                    e.currentTarget.style.borderColor = c.glow;
                    e.currentTarget.style.background = `${c.glow}11`;
                  }
                  speakLabel(link.label);
                }}
                onBlur={(e) => {
                  e.currentTarget.style.color = c.dim;
                  if (tier === "tv") {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = c.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = c.dim; }}
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>

        <p
          className="font-mono text-center"
          style={{ color: `${c.dim}66`, fontSize: `calc(0.58rem * ${tvFontScale})` }}
        >
          © {YEAR} {developerName}. Built with Iron Man Jarvis Holographic Technology.
        </p>

        <div className="flex items-center gap-2">
          {(["gemini", "groq", "mistral", "openai", "grok", "claude"] as const).map((p) => (
            <motion.span
              key={p}
              aria-hidden="true"
              className="font-mono uppercase"
              style={{
                color: `${c.dim}55`,
                fontSize: `calc(0.48rem * ${tvFontScale})`,
                letterSpacing: "0.08em",
              }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            >
              {p}
            </motion.span>
          ))}
          <motion.span
            aria-hidden="true"
            className="font-mono"
            style={{ color: `${c.dim}44`, fontSize: `calc(0.48rem * ${tvFontScale})` }}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            + 7 more
          </motion.span>
        </div>
      </div>
    </motion.footer>
  );

  if (tier === "mobile" || tier === "tablet") return mobileTabletFooter;
  return desktopTvFooter;
}

export default memo(HolographicFooterInner);