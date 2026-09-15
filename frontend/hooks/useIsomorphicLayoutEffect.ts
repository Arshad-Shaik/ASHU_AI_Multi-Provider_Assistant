// frontend/hooks/useIsomorphicLayoutEffect.ts
"use client";

import { useEffect, useLayoutEffect } from "react";

export const useIsomorphicLayoutEffect: typeof useLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;