// frontend/lib/api/client.ts
import type {
  AnalyticsDashboard,
  AnalyticsPeriod,
  ChatRequest,
  ChatResponse,
  MemoryEntry,
  ProviderStatus,
  SlashCommandResult,
} from "@/types";
import { supabase } from "@/lib/supabase/client";

const CHAT_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_API_PORT = 8000;

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function resolveBaseUrl(): string {
  const fromEnvPrimary = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (fromEnvPrimary && fromEnvPrimary.trim().length > 0) {
    return fromEnvPrimary.trim().replace(/\/$/, "");
  }

  const fromEnvFallback = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnvFallback && fromEnvFallback.trim().length > 0) {
    return fromEnvFallback.trim().replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function extractErrorMessage(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  if (!raw) return res.statusText || `HTTP ${res.status}`;
  try {
    const parsed = JSON.parse(raw) as { detail?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim().length > 0) {
      return parsed.detail;
    }
  } catch {
    return raw;
  }
  return raw;
}

async function parseSuccessBody<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const raw = await res.text();
  if (!raw || raw.trim().length === 0) {
    return undefined as T;
  }
  return JSON.parse(raw) as T;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const authHeader = await getAuthHeader();
  const hasExternalSignal = Boolean(options?.signal);
  const controller = hasExternalSignal ? null : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...(options?.headers as Record<string, string> | undefined),
      },
      signal: controller ? controller.signal : options?.signal,
      ...options,
    });

    if (!res.ok) {
      const message = await extractErrorMessage(res);
      throw new ApiError(message, res.status);
    }

    return await parseSuccessBody<T>(res);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. The AI provider took too long — automatically trying next provider. Please resend your message.",
        0,
      );
    }
    if (
      err instanceof TypeError &&
      err.message.toLowerCase().includes("fetch")
    ) {
      const resolvedUrl = resolveBaseUrl();
      throw new ApiError(
        `Cannot connect to backend at ${resolvedUrl}. If on mobile or tablet, ensure your device is on the same WiFi network as your development machine, or set NEXT_PUBLIC_BACKEND_URL in your .env file to your machine LAN IP such as http://192.168.x.x:8000`,
        0,
      );
    }
    throw err;
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(
    "/api/v1/chat",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
    CHAT_TIMEOUT_MS,
  );
}

export async function getMemoryEntries(): Promise<MemoryEntry[]> {
  return apiFetch<MemoryEntry[]>("/api/v1/memory");
}

export async function getMemoryEntry(memoryId: string): Promise<MemoryEntry> {
  return apiFetch<MemoryEntry>(
    `/api/v1/memory/${encodeURIComponent(memoryId)}`,
  );
}

export async function deleteMemoryEntry(memoryId: string): Promise<void> {
  return apiFetch<void>(
    `/api/v1/memory/${encodeURIComponent(memoryId)}`,
    { method: "DELETE" },
  );
}

export async function getProviderStatus(): Promise<ProviderStatus[]> {
  return apiFetch<ProviderStatus[]>("/api/v1/health/providers");
}

export async function getAnalytics(
  period: AnalyticsPeriod = "7d",
): Promise<AnalyticsDashboard> {
  return apiFetch<AnalyticsDashboard>(
    `/api/v1/analytics?period=${encodeURIComponent(period)}`,
  );
}

export async function executeSlashCommand(
  command: string,
  sessionId: string,
): Promise<SlashCommandResult> {
  return apiFetch<SlashCommandResult>("/api/v1/commands/slash", {
    method: "POST",
    body: JSON.stringify({ command, session_id: sessionId }),
  });
}

export async function healthCheck(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/v1/health");
}

export async function getCurrentUserInfo(): Promise<{
  authenticated: boolean;
  id: string;
  email: string;
  role: string;
}> {
  return apiFetch<{
    authenticated: boolean;
    id: string;
    email: string;
    role: string;
  }>("/api/v1/auth/me");
}