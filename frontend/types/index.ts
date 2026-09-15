// frontend/types/index.ts
export type TerminalTheme =
  | "matrix"
  | "cyberpunk"
  | "holographic"
  | "neon"
  | "cyber"
  | "plasma"
  | "aurora"
  | "inferno"
  | "ghost"
  | "crimson";

export type ColorMode = "dark" | "light" | "system";

export type CommandType =
  | "@"
  | "$"
  | "#"
  | "*"
  | "✱"
  | "default"
  | "slash";

export type SidePanelType =
  | "memory"
  | "conversation"
  | "analytics"
  | "commands"
  | null;

export type MessageRole = "user" | "assistant" | "system";

export type ProviderName =
  | "gemini"
  | "groq"
  | "mistral"
  | "openai"
  | "grok"
  | "claude"
  | "cerebras"
  | "openrouter"
  | "cohere"
  | "huggingface"
  | "cloudflare"
  | "together"
  | "deepseek"
  | "none"
  | "unknown";

export type AnalyticsPeriod = "1d" | "7d" | "30d" | "90d";

export type DeviceTier = "low" | "mid" | "high";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  command_type: CommandType;
  provider_used: string;
  memory_id: string | null;
  timestamp: string;
  tokens_used: number;
  latency_ms: number;
  is_regenerated: boolean;
  isError?: boolean;
  isStreaming?: boolean;
  name?: string | null;
  avatar_url?: string | null;
  session_id: string;
}

export interface ChatRequest {
  prompt: string;
  command_type: CommandType;
  session_id: string;
  memory_id?: string | null;
  instruction?: string | null;
  conversation_id?: string | null;
}

export interface ChatResponse {
  response: string;
  provider_used: string;
  command_type: CommandType;
  memory_id: string | null;
  session_id: string;
  timestamp: string;
  tokens_used: number;
  latency_ms: number;
  fallback_triggered?: boolean;
  providers_tried?: string[];
  error?: string | null;
}

export interface MemoryEntry {
  id: string;
  memory_id: string;
  user_id: string;
  user_prompt: string;
  ai_response: string;
  command_type: string;
  provider_used: string;
  tags: string[];
  is_starred: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  command_type: string | null;
  tags: string[];
  message_count: number;
  last_provider_used: string | null;
  total_tokens_used: number;
  is_archived: boolean;
  provider_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  command_type: string | null;
  provider_name: string | null;
  model_name: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  fallback_triggered: boolean;
  fallback_reason: string | null;
  providers_tried: string[];
  attempt_count: number;
  is_regenerated: boolean;
  parent_message_id: string | null;
  memory_id: string | null;
  tokens_used: number;
  created_at: string;
}

export interface ProviderStatus {
  provider_name: string;
  is_available: boolean;
  circuit_state: "closed" | "open" | "half-open";
  failure_count: number;
  last_failure_time: string | null;
  recovery_time: string | null;
  total_requests: number;
  total_failures: number;
  average_latency_ms: number;
}

export type ProviderStatusMap = Record<string, ProviderStatus>;

export interface ProviderLog {
  id: string;
  session_id: string;
  conversation_id: string | null;
  provider_name: string;
  model_name: string;
  command_type: string | null;
  success: boolean;
  error_code: string | null;
  error_message: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  was_fallback: boolean;
  created_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  session_id: string;
  response_id: string;
  conversation_id: string;
  command_type: string;
  event_type: string;
  action: string;
  provider_used: string;
  tokens_used: number;
  response_time_ms: number;
  fallback_triggered: boolean;
  content_length: number;
  created_at: string;
}

export interface UserCommandStats {
  user_id: string;
  at_count: number;
  dollar_count: number;
  hash_count: number;
  star_count: number;
  voice_count: number;
  chat_count: number;
  total_tokens: number;
  total_sessions: number;
  total_conversations: number;
  total_requests: number;
  favorite_provider: string;
  command_type: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
  provider: string | null;
  preferences: Record<string, unknown>;
  updated_at: string;
}

export interface DashboardSummary {
  total_requests: number;
  total_tokens: number;
  total_conversations: number;
  favorite_provider: string;
  command_breakdown: Record<string, number>;
  provider_breakdown: Record<string, number>;
  daily_usage: DailyUsage[];
  period: AnalyticsPeriod;
}

export interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  fallbacks: number;
}

export interface AnalyticsDashboard {
  total_requests: number;
  total_tokens: number;
  average_latency_ms: number;
  command_breakdown: Record<string, number>;
  provider_breakdown: Record<string, number>;
  daily_usage: DailyUsage[];
  period: AnalyticsPeriod;
}

export interface VoiceConfig {
  enabled: boolean;
  language: string;
  autoSpeak: boolean;
  volume: number;
  rate: number;
  voiceURI?: string;
}

export interface VoiceState {
  isSupported: boolean;
  isSpeaking: boolean;
  currentText?: string;
  availableVoices?: SpeechSynthesisVoice[];
}

export interface SlashCommandResult {
  type: "clear" | "help" | "theme" | "providers" | "reset" | "export" | "version" | "unknown";
  message: string;
  data?: unknown;
}

export interface ParsedCommand {
  type: CommandType;
  raw: string;
  prompt: string;
  memoryId: string | null;
  instruction: string | null;
}

export interface MemoryPreview {
  memory_id: string;
  user_prompt: string;
  ai_response_preview: string;
  command_type: string;
  provider_used: string;
  created_at: string;
}


export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  full_name?: string;
  provider?: string;
  created_at: string;
}
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  error: string | null;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

export interface CommandPaletteItem {
  command: string;
  symbol: string;
  description: string;
  example: string;
  shortcut?: string;
}

export interface ThemeOption {
  value: TerminalTheme;
  label: string;
  primaryColor: string;
  description: string;
}
export type ColorScheme = "dark" | "light" | "system";

export interface ConversationEntry {
  id: string;
  title: string;
  command_type?: string;
  created_at: string;
  updated_at?: string;
  message_count?: number;
  last_provider?: string;
  tags?: string[];
  is_archived?: boolean;
}

export interface ConversationDetail {
  id: string;
  session_id: string;
  title: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
  message_count: number;
  last_provider: string | null;
}

export interface ProviderStats {
  provider_name: string;
  requests: number;
  failures: number;
  latency_ms: number;
  availability_percent: number;
}

export interface TokenStats {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  by_provider: Record<string, number>;
}

export interface SessionStats {
  total_sessions: number;
  average_session_length_ms: number;
  peak_hour: number;
}

export interface CommandStats {
  command_type: CommandType;
  count: number;
  success_rate: number;
}

export type AIProvider =
  | "gemini"
  | "groq"
  | "openai"
  | "grok"
  | "mistral"
  | "claude"
  | "cerebras"
  | "openrouter"
  | "cohere"
  | "huggingface"
  | "cloudflare"
  | "together"
  | "deepseek"
  | "unknown";

export type TerminalLineType = "input" | "output" | "error" | "system" | "info";

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  role: MessageRole;
  content: string;
  command_type?: CommandType;
  timestamp: string;
  provider_used?: string;
  memory_id?: string;
  isStreaming?: boolean;
  tokens_used?: number;
  latency_ms?: number;
  session_id?: string;
  is_regenerated?: boolean;
}

export interface AnimationConfig {
  tier: DeviceTier;
  fps: number;
  particleCount: number;
  enableBloom: boolean;
  enableScanlines: boolean;
  enableGrid: boolean;
  enableMatrix: boolean;
  enableParticles: boolean;
}
