// frontend/hooks/useTheme.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { ColorScheme } from "@/types";

export type ResolvedMode = "dark" | "light";

export interface UseThemeReturn {
  colorScheme: ColorScheme;
  resolvedMode: ResolvedMode;
  setColorScheme: (scheme: ColorScheme) => void;
  cycleColorScheme: () => void;
  isHydrated: boolean;
}

const STORAGE_KEY = "ashu-color-mode";
const DEFAULT_SCHEME: ColorScheme = "system";
const DEFAULT_MODE: ResolvedMode = "dark";

function resolveSystemMode(): ResolvedMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(scheme: ColorScheme): ResolvedMode {
  return scheme === "system" ? resolveSystemMode() : scheme;
}

function applyModeAttribute(mode: ResolvedMode): void {
  document.documentElement.setAttribute("data-mode", mode);
}

function readStoredScheme(): ColorScheme {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light" || raw === "system") {
      return raw;
    }
  } catch {
    return DEFAULT_SCHEME;
  }
  return DEFAULT_SCHEME;
}

export function useTheme(): UseThemeReturn {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(DEFAULT_SCHEME);
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(DEFAULT_MODE);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const schemeRef = useRef<ColorScheme>(DEFAULT_SCHEME);

  useEffect(() => {
    schemeRef.current = colorScheme;
  }, [colorScheme]);

  useIsomorphicLayoutEffect(() => {
    const stored = readStoredScheme();
    const mode = resolveMode(stored);
    schemeRef.current = stored;
    setColorSchemeState(stored);
    setResolvedMode(mode);
    applyModeAttribute(mode);
    setIsHydrated(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!isHydrated) return;
    const mode = resolveMode(colorScheme);
    setResolvedMode(mode);
    applyModeAttribute(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, colorScheme);
    } catch {
      return;
    }
  }, [colorScheme, isHydrated]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (schemeRef.current !== "system") return;
      const mode = resolveSystemMode();
      setResolvedMode(mode);
      applyModeAttribute(mode);
    };
    mql.addEventListener("change", handleSystemChange);
    return () => mql.removeEventListener("change", handleSystemChange);
  }, []);

  useEffect(() => {
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const raw = event.newValue;
      if (raw === "dark" || raw === "light" || raw === "system") {
        setColorSchemeState(raw);
      }
    };
    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  }, []);

  const cycleColorScheme = useCallback(() => {
    setColorSchemeState((prev: ColorScheme) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "system";
      return "dark";
    });
  }, []);

  return {
    colorScheme,
    resolvedMode,
    setColorScheme,
    cycleColorScheme,
    isHydrated,
  };
}