// frontend/hooks/useProviderStatus.ts
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getProviderStatus } from "@/lib/api/client";
import { ProviderStatus, ProviderStatusMap } from "@/types";

export interface UseProviderStatusReturn {
  statuses: ProviderStatus[];
  statusMap: ProviderStatusMap;
  isLoading: boolean;
  error: string | null;
  availableCount: number;
  totalCount: number;
  activeProvider: string | null;
  refresh: () => Promise<void>;
  getProviderDisplayName: (raw: string) => string;
  getCircuitLabel: (status: ProviderStatus) => string;
}

const TOTAL_EXPECTED_PROVIDERS = 13;

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  gemini: "Google Gemini",
  groq: "Groq",
  mistral: "Mistral AI",
  openai: "OpenAI",
  grok: "xAI Grok",
  claude: "Anthropic Claude",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
  cohere: "Cohere",
  huggingface: "HuggingFace",
  cloudflare: "Cloudflare AI",
  together: "Together AI",
  deepseek: "DeepSeek",
};

const DEFAULT_POLL_MS = 30000;
const MIN_POLL_MS = 5000;

function getDisplayName(raw: string): string {
  return PROVIDER_DISPLAY_NAMES[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getCircuitLabel(status: ProviderStatus): string {
  if (status.circuit_state === "open") return "OFFLINE";
  if (status.circuit_state === "half-open") return "RECOVERING";
  if (status.is_available) return "ONLINE";
  return "STANDBY";
}

export function useProviderStatus(
  pollIntervalMs: number = DEFAULT_POLL_MS,
): UseProviderStatusReturn {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const safeInterval = Math.max(pollIntervalMs, MIN_POLL_MS);

  const fetchStatuses = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const data = await getProviderStatus();
      if (!isMountedRef.current || requestIdRef.current !== requestId) return;
      const list = Array.isArray(data) ? data : [];
      setStatuses(list);
      setError(null);
      const responding = list.find(
        (s) => s.is_available && s.circuit_state === "closed" && s.total_requests > 0,
      );
      if (responding) {
        setActiveProvider(responding.provider_name);
      }
    } catch (err) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return;
      const msg = err instanceof Error ? err.message : "Failed to fetch provider status";
      setError(msg);
    } finally {
      if (isMountedRef.current && requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void fetchStatuses();

    if (safeInterval <= 0) return;

    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        void fetchStatuses();
      }, safeInterval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchStatuses();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      startPolling();
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      stopPolling();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [fetchStatuses, safeInterval]);

  const statusMap: ProviderStatusMap = useMemo(() => {
    const map: ProviderStatusMap = {};
    for (const s of statuses) {
      map[s.provider_name] = s;
    }
    return map;
  }, [statuses]);

  const availableCount = useMemo(
    () => statuses.filter((s) => s.is_available).length,
    [statuses],
  );

  const getProviderDisplayName = useCallback((raw: string): string => {
    return getDisplayName(raw);
  }, []);

  const getCircuitLabelCb = useCallback((status: ProviderStatus): string => {
    return getCircuitLabel(status);
  }, []);

  return {
    statuses,
    statusMap,
    isLoading,
    error,
    availableCount,
    totalCount: TOTAL_EXPECTED_PROVIDERS,
    activeProvider,
    refresh: fetchStatuses,
    getProviderDisplayName,
    getCircuitLabel: getCircuitLabelCb,
  };
}