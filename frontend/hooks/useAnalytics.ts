// frontend/hooks/useAnalytics.ts
"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { getAnalytics, getProviderStatus } from "@/lib/api/client";
import {
  AnalyticsDashboard,
  AnalyticsPeriod,
  CommandStats,
  ProviderStats,
  TokenStats,
  SessionStats,
  DashboardSummary,
  ProviderStatus,
  CommandType,
} from "@/types";

export interface UseAnalyticsReturn {
  dashboard: AnalyticsDashboard | null;
  summary: DashboardSummary | null;
  commandStats: CommandStats[];
  providerStats: ProviderStats[];
  tokenStats: TokenStats | null;
  sessionStats: SessionStats | null;
  isLoading: boolean;
  error: string | null;
  period: AnalyticsPeriod;
  setPeriod: (p: AnalyticsPeriod) => void;
  refresh: () => void;
}

const KNOWN_COMMAND_TYPES: readonly CommandType[] = ["@", "$", "#", "*", "✱", "default", "slash"];

function isKnownCommandType(value: string): value is CommandType {
  return (KNOWN_COMMAND_TYPES as readonly string[]).includes(value);
}

export function useAnalytics(): UseAnalyticsReturn {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [period, setPeriodState] = useState<AnalyticsPeriod>("7d");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (isMountedRef.current) setIsLoading(true);
    if (isMountedRef.current) setError(null);
    try {
      const [analyticsData, providerData] = await Promise.all([
        getAnalytics(period),
        getProviderStatus(),
      ]);
      if (requestIdRef.current !== requestId || !isMountedRef.current) return;
      setDashboard(analyticsData as AnalyticsDashboard);
      setProviders(Array.isArray(providerData) ? (providerData as ProviderStatus[]) : []);
    } catch (err) {
      if (requestIdRef.current !== requestId || !isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      if (requestIdRef.current === requestId && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [period]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchData();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [fetchData]);

  const setPeriod = useCallback((p: AnalyticsPeriod) => {
    setPeriodState(p);
  }, []);

  const commandStats: CommandStats[] = useMemo(() => {
    if (!dashboard?.command_breakdown) return [];
    return Object.entries(dashboard.command_breakdown).map(([key, count]) => ({
      command_type: isKnownCommandType(key) ? key : "default",
      count: count as number,
      success_rate: 1,
    }));
  }, [dashboard]);

  const providerStats: ProviderStats[] = useMemo(() => {
    if (!dashboard?.provider_breakdown) return [];
    return Object.entries(dashboard.provider_breakdown).map(([provider_name, requests]) => {
      const live = providers.find((p) => p.provider_name === provider_name);
      return {
        provider_name,
        requests: requests as number,
        failures: 0,
        latency_ms: live?.average_latency_ms ?? dashboard.average_latency_ms,
        availability_percent: live ? (live.is_available ? 100 : 0) : 100,
      };
    });
  }, [dashboard, providers]);

  const summary: DashboardSummary | null = useMemo(() => {
    if (!dashboard) return null;
    return {
      total_requests: dashboard.total_requests,
      total_tokens: dashboard.total_tokens,
      total_conversations: 0,
      favorite_provider: (() => {
        const breakdown = dashboard.provider_breakdown;
        if (!breakdown || Object.keys(breakdown).length === 0) return "unknown";
        const sorted = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
        return sorted[0]?.[0] ?? "unknown";
      })(),
      command_breakdown: dashboard.command_breakdown ?? {},
      provider_breakdown: dashboard.provider_breakdown ?? {},
      daily_usage: dashboard.daily_usage ?? [],
      period,
    };
  }, [dashboard, period]);

  const tokenStats: TokenStats | null = useMemo(() => {
    if (!dashboard) return null;
    return {
      total_tokens: dashboard.total_tokens,
      prompt_tokens: 0,
      completion_tokens: 0,
      by_provider: dashboard.provider_breakdown,
    };
  }, [dashboard]);

  return {
    dashboard,
    summary,
    commandStats,
    providerStats,
    tokenStats,
    sessionStats: null,
    isLoading,
    error,
    period,
    setPeriod,
    refresh: fetchData,
  };
}
