// frontend/lib/supabase/queries.ts
import { supabase } from "./client";
import {
  CommandType,
  Conversation,
  Message,
  MemoryEntry,
  ProviderLog,
  UserAnalytics,
  UserCommandStats,
  UserProfile,
  DashboardSummary,
  DailyUsage,
  AnalyticsPeriod,
} from "@/types";

const VALID_COMMAND_TYPES: readonly CommandType[] = [
  "@", "$", "#", "*", "\u2731", "default", "slash",
];

function toCommandType(value: string | null | undefined): CommandType {
  if (value && (VALID_COMMAND_TYPES as readonly string[]).includes(value)) {
    return value as CommandType;
  }
  return "default";
}

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

export interface ListResult<T> {
  data: T[];
  error: string | null;
}

export async function getUserProfile(userId: string): Promise<QueryResult<UserProfile>> {
  if (!userId) return { data: null, error: "No user ID provided" };
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url, preferences, updated_at")
    .eq("id", userId)
    .single();
  if (error) return { data: null, error: error.message };
  const { data: authUser } = await supabase.auth.getUser();
  const email = authUser?.user?.email ?? "";
  const fullName = (authUser?.user?.user_metadata?.["full_name"] as string | undefined) ?? null;
  const avatarUrl = (authUser?.user?.user_metadata?.["avatar_url"] as string | undefined) ?? data?.avatar_url ?? null;
  const provider = (authUser?.user?.app_metadata?.["provider"] as string | undefined) ?? null;
  return {
    data: {
      id: userId,
      email,
      username: data?.username ?? null,
      avatar_url: avatarUrl,
      full_name: fullName,
      provider,
      preferences: (data?.preferences as Record<string, unknown>) ?? {},
      updated_at: data?.updated_at ?? new Date().toISOString(),
    },
    error: null,
  };
}

export async function getConversations(
  userId: string,
  limit: number = 50,
): Promise<ListResult<Conversation>> {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, session_id, user_id, title, command_type, tags, message_count, last_provider_used, total_tokens_used, is_archived, provider_used, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Conversation[], error: null };
}

export async function getMessagesByConversation(
  conversationId: string,
  limit: number = 100,
): Promise<ListResult<Message>> {
  if (!conversationId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, session_id, role, content, command_type, provider_name, model_name, prompt_tokens, completion_tokens, total_tokens, latency_ms, fallback_triggered, fallback_reason, providers_tried, attempt_count, is_regenerated, parent_message_id, memory_id, tokens_used, created_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Message[], error: null };
}

export async function getMessagesBySession(
  sessionId: string,
  limit: number = 200,
): Promise<ListResult<Message>> {
  if (!sessionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, session_id, role, content, command_type, provider_name, model_name, total_tokens, latency_ms, fallback_triggered, memory_id, tokens_used, created_at",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: ((data ?? []) as Message[]).reverse(), error: null };
}

export async function getMemoryEntries(
  userId: string,
  limit: number = 100,
): Promise<ListResult<MemoryEntry>> {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("memory_entries")
    .select(
      "id, memory_id, user_id, user_prompt, ai_response, command_type, provider_used, tags, is_starred, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as MemoryEntry[], error: null };
}

export async function getMemoryEntryById(
  memoryId: string,
  userId: string,
): Promise<QueryResult<MemoryEntry>> {
  if (!memoryId || !userId) return { data: null, error: "Missing parameters" };
  const { data, error } = await supabase
    .from("memory_entries")
    .select(
      "id, memory_id, user_id, user_prompt, ai_response, command_type, provider_used, tags, is_starred, created_at",
    )
    .eq("memory_id", memoryId)
    .eq("user_id", userId)
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as MemoryEntry, error: null };
}

export async function toggleMemoryStar(
  memoryId: string,
  userId: string,
  isStarred: boolean,
): Promise<QueryResult<void>> {
  if (!memoryId || !userId) return { data: null, error: "Missing parameters" };
  const { error } = await supabase
    .from("memory_entries")
    .update({ is_starred: isStarred })
    .eq("memory_id", memoryId)
    .eq("user_id", userId);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
}

export async function deleteMemoryEntry(
  memoryId: string,
  userId: string,
): Promise<QueryResult<void>> {
  if (!memoryId || !userId) return { data: null, error: "Missing parameters" };
  const { error } = await supabase
    .from("memory_entries")
    .delete()
    .eq("memory_id", memoryId)
    .eq("user_id", userId);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
}

export async function getProviderLogs(
  sessionId: string,
  limit: number = 50,
): Promise<ListResult<ProviderLog>> {
  if (!sessionId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("provider_logs")
    .select(
      "id, session_id, conversation_id, provider_name, model_name, command_type, success, error_code, error_message, prompt_tokens, completion_tokens, total_tokens, latency_ms, was_fallback, created_at",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ProviderLog[], error: null };
}

export async function getUserAnalytics(
  userId: string,
  period: AnalyticsPeriod = "7d",
  limit: number = 500,
): Promise<ListResult<UserAnalytics>> {
  if (!userId) return { data: [], error: null };
  const days = period === "1d" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from("user_analytics")
    .select(
      "id, user_id, session_id, response_id, conversation_id, command_type, event_type, action, provider_used, tokens_used, response_time_ms, fallback_triggered, content_length, created_at",
    )
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as UserAnalytics[], error: null };
}

export async function getUserCommandStats(
  userId: string,
): Promise<QueryResult<UserCommandStats>> {
  if (!userId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("user_command_stats")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as UserCommandStats, error: null };
}

export async function getDashboardSummary(
  userId: string,
  period: AnalyticsPeriod = "7d",
): Promise<QueryResult<DashboardSummary>> {
  if (!userId) return { data: null, error: "No user ID" };
  const analyticsResult = await getUserAnalytics(userId, period);
  if (analyticsResult.error) {
    return { data: null, error: analyticsResult.error };
  }
  const rows = analyticsResult.data;
  const commandBreakdown: Record<string, number> = {};
  const providerBreakdown: Record<string, number> = {};
  const dailyMap: Record<string, { requests: number; tokens: number; fallbacks: number }> = {};
  let totalTokens = 0;
  const totalRequests = rows.length;
  for (const row of rows) {
    const cmd = toCommandType(row.command_type);
    commandBreakdown[cmd] = (commandBreakdown[cmd] ?? 0) + 1;
    const prov = row.provider_used || "unknown";
    providerBreakdown[prov] = (providerBreakdown[prov] ?? 0) + 1;
    totalTokens += row.tokens_used ?? 0;
    const dateKey = row.created_at.slice(0, 10);
    const existing = dailyMap[dateKey] ?? { requests: 0, tokens: 0, fallbacks: 0 };
    dailyMap[dateKey] = {
      requests: existing.requests + 1,
      tokens: existing.tokens + (row.tokens_used ?? 0),
      fallbacks: existing.fallbacks + (row.fallback_triggered ? 1 : 0),
    };
  }
  const dailyUsage: DailyUsage[] = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
  const favoriteProvider =
    Object.entries(providerBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "unknown";
  const statsResult = await getUserCommandStats(userId);
  const stats = statsResult.data;
  return {
    data: {
      total_requests: totalRequests,
      total_tokens: totalTokens,
      total_conversations: stats?.total_conversations ?? 0,
      favorite_provider: favoriteProvider,
      command_breakdown: commandBreakdown,
      provider_breakdown: providerBreakdown,
      daily_usage: dailyUsage,
      period,
    },
    error: null,
  };
}

export async function archiveConversation(
  conversationId: string,
  userId: string,
): Promise<QueryResult<void>> {
  if (!conversationId || !userId) return { data: null, error: "Missing parameters" };
  const { error } = await supabase
    .from("conversations")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
}

export async function searchMemoryEntries(
  userId: string,
  query: string,
  limit: number = 20,
): Promise<ListResult<MemoryEntry>> {
  if (!userId || !query.trim()) return { data: [], error: null };
  const { data, error } = await supabase
    .from("memory_entries")
    .select(
      "id, memory_id, user_id, user_prompt, ai_response, command_type, provider_used, tags, is_starred, created_at",
    )
    .eq("user_id", userId)
    .or(`user_prompt.ilike.%${query}%,ai_response.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as MemoryEntry[], error: null };
}

export async function getStarredMemoryEntries(
  userId: string,
): Promise<ListResult<MemoryEntry>> {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from("memory_entries")
    .select(
      "id, memory_id, user_id, user_prompt, ai_response, command_type, provider_used, tags, is_starred, created_at",
    )
    .eq("user_id", userId)
    .eq("is_starred", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as MemoryEntry[], error: null };
}