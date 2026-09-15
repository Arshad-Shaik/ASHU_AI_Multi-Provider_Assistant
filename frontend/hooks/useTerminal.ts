// frontend/hooks/useTerminal.ts
"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useTerminalStore } from "@/store/terminalStore";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import {
  sendChatMessage,
  healthCheck,
  getProviderStatus,
} from "@/lib/api/client";
import { parseCommand } from "@/lib/utils/commandParser";
import {
  generateMessageId,
  generateConversationId,
} from "@/lib/utils/idGenerator";
import type {
  ConversationMessage,
  CommandType,
  ProviderName,
} from "@/types";

interface UseTerminalOptions {
  onThemeToggle?: () => void;
  onLoginRequest?: () => void;
  onLogoutRequest?: () => void;
  onExportPdf?: (messages: ConversationMessage[]) => void;
}

interface UseTerminalReturn {
  messages: ConversationMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  currentProvider: ProviderName | null;
  sessionId: string;
  submitMessage: (input: string, onAuthRequired: () => void) => Promise<void>;
  clearMessages: () => void;
}

interface ProviderHealthEntry {
  available?: boolean;
  is_available?: boolean;
  latency_ms?: number;
}

interface HealthResponse {
  status?: string;
  providers?: Record<string, ProviderHealthEntry>;
}

interface ProviderListEntry {
  name?: string;
  provider_name?: string;
  available?: boolean;
  is_available?: boolean;
  model?: string;
  model_name?: string;
  latency_ms?: number;
}

function getFirstName(
  fullName: string | null | undefined,
  email: string,
): string {
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] ?? fullName;
    const honorifics = ["mr", "mrs", "ms", "dr", "prof", "sir", "shaik", "sheikh", "md", "syed"];
    if (parts.length > 1 && honorifics.includes(first.toLowerCase())) {
      return parts[parts.length - 1] ?? first;
    }
    return first;
  }
  return email.split("@")[0] ?? "there";
}

function formatProviderLine(
  name: string,
  status: string,
  latency: number | null,
): string {
  const latencyStr = latency !== null ? ` (${latency}ms)` : "";
  return `  ${name.padEnd(20)} ${status}${latencyStr}`;
}

function buildStructuredExportContent(
  messages: ConversationMessage[],
  sessionId: string,
): string {
  const exportLines: string[] = [];
  exportLines.push("ASHU AI ASSISTANT \u2014 CHAT EXPORT");
  exportLines.push(`Session: ${sessionId}`);
  exportLines.push(
    `Exported: ${new Date().toLocaleString("en-US", { hour12: true })}`,
  );
  exportLines.push(`Total Messages: ${messages.length}`);
  exportLines.push("");
  exportLines.push("\u2500".repeat(60));
  exportLines.push("");

  let userCount = 0;
  let aiCount = 0;

  for (const msg of messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    if (msg.role === "user") {
      userCount++;
      exportLines.push(`YOU [${time}]`);
      exportLines.push(msg.content.replace(/[#]/g, "").trim());
      exportLines.push("");
    } else if (msg.role === "assistant") {
      aiCount++;
      const provider = msg.provider_used ? ` via ${msg.provider_used}` : "";
      exportLines.push(`ASHU AI${provider} [${time}]`);
      if (msg.memory_id) {
        exportLines.push(`Memory ID: ${msg.memory_id}`);
      }
      exportLines.push(
        msg.content
          .replace(/#{1,6}\s+/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/```[\s\S]*?```/g, "[CODE BLOCK]")
          .replace(/`([^`]+)`/g, "$1")
          .trim(),
      );
      exportLines.push("");
    }
    exportLines.push("\u2500".repeat(40));
    exportLines.push("");
  }

  exportLines.push("\u2500".repeat(60));
  exportLines.push(
    `Summary: ${userCount} user messages, ${aiCount} AI responses`,
  );
  return exportLines.join("\n");
}

function triggerTextDownload(
  exportContent: string,
  sessionId: string,
): void {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const filename = `ASHU-AI-Export-${sessionId.slice(0, 8)}-${timestamp}.txt`;
  const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function makeSystemMessage(
  content: string,
  sessionId: string,
  commandType: CommandType,
  isError: boolean,
): ConversationMessage {
  return {
    id: generateMessageId(),
    role: "assistant",
    content,
    command_type: commandType,
    provider_used: "",
    memory_id: null,
    timestamp: new Date().toISOString(),
    tokens_used: 0,
    latency_ms: 0,
    is_regenerated: false,
    isError,
    isStreaming: false,
    session_id: sessionId,
  };
}

export function useTerminal(
  _conversationId?: string,
  options?: UseTerminalOptions,
): UseTerminalReturn {
  const {
    messages,
    sessionId: storedSessionId,
    addMessage,
    updateLastMessage,
    clearMessages: storeClear,
    resetSession,
  } = useTerminalStore();

  const { user, isAuthenticated, signOut } = useAuth();
  const { speakDynamic, speakMessageSent, speakProviderChange } = useVoiceAgent();

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<ProviderName | null>(null);

  const sessionId = storedSessionId || generateConversationId();
  const abortRef = useRef<AbortController | null>(null);
  const sessionInitRef = useRef(false);
  const currentProviderRef = useRef<ProviderName | null>(null);

  useEffect(() => {
    currentProviderRef.current = currentProvider;
  }, [currentProvider]);

  useEffect(() => {
    if (!sessionInitRef.current) {
      sessionInitRef.current = true;
      if (!storedSessionId) {
        resetSession();
      }
    }
  }, [storedSessionId, resetSession]);

  const pushSystem = useCallback(
    (content: string, commandType: CommandType = "slash", isError = false) => {
      addMessage(makeSystemMessage(content, sessionId, commandType, isError));
    },
    [addMessage, sessionId],
  );

  const handleSlashCommand = useCallback(
    async (
      raw: string,
      onAuthRequired: () => void,
    ): Promise<boolean> => {
      const trimmed = raw.trim();
      const lower = trimmed.toLowerCase();
      if (!lower.startsWith("/")) return false;

      const firstName = user
        ? getFirstName(user.name ?? undefined, user.email)
        : null;

      if (lower === "/help") {
        pushSystem(
          [
            "ASHU AI ASSISTANT \u2014 AVAILABLE COMMANDS",
            "",
            "@ <topic>          Expert PhD-level explanation",
            "$ <code>           Code analysis with line-by-line breakdown",
            "# <prompt>         Save response to memory with unique ID",
            "* <memory_id>      Regenerate or extend a saved response",
            "\u2731 <memory_id>      Same as * command",
            "",
            "/help              Show this help message",
            "/clear             Clear terminal",
            "/status            Show provider status",
            "/providers         List all AI providers",
            "/history           Show conversation history",
            "/export            Export chat history as PDF",
            "/theme             Cycle terminal theme",
            "/version           Show version info",
            "/login             Sign in or create an account",
            "/logout            Sign out",
          ].join("\n"),
          "slash",
        );
        speakDynamic(
          "Here are all available commands for ASHU AI Assistant. You can use the at symbol for expert explanations, dollar sign for code analysis, hash to save to memory, and slash commands for system controls.",
        );
        return true;
      }

      if (lower === "/clear") {
        storeClear();
        speakDynamic(
          "Terminal cleared. The workspace is clean and ready for your next command.",
        );
        return true;
      }

      if (lower === "/version") {
        pushSystem(
          [
            "ASHU AI ASSISTANT",
            "Version: 2.0.0",
            "Build: 2026-production",
            "Frontend: Next.js 15 + TypeScript",
            "Backend: FastAPI + Python 3.14",
            "Database: Supabase PostgreSQL",
            "Providers: Gemini, Groq, Mistral, OpenAI, Claude, Grok, Cohere, DeepSeek, Cerebras, Together, OpenRouter, Cloudflare, HuggingFace",
          ].join("\n"),
          "slash",
        );
        speakDynamic(
          "ASHU AI Assistant, version two point zero. Powered by Next.js on the frontend, FastAPI on the backend, and thirteen AI providers with intelligent fallback routing.",
        );
        return true;
      }

      if (lower === "/theme") {
        options?.onThemeToggle?.();
        speakDynamic(
          "Cycling to the next holographic terminal theme. The interface is transforming.",
        );
        return true;
      }

      if (lower === "/login") {
        if (isAuthenticated && user) {
          const name = getFirstName(user.name ?? undefined, user.email);
          pushSystem(
            `You are already signed in as ${user.name ?? user.email}. No action needed.`,
            "slash",
          );
          speakDynamic(
            `${name}, you are already signed in to ASHU AI. You have full access to all features including memory, analytics, and all AI commands.`,
          );
          return true;
        }
        onAuthRequired();
        speakDynamic(
          "Opening the authentication portal. Please sign in with Google or GitHub, or create a new account to continue.",
        );
        return true;
      }

      if (lower === "/logout") {
        if (!isAuthenticated) {
          pushSystem("You are not currently signed in.", "slash");
          speakDynamic(
            "You are not currently signed in to ASHU AI Assistant.",
          );
          return true;
        }
        const name = firstName ?? "there";
        pushSystem("Signing out... Goodbye.", "slash");
        speakDynamic(
          `Signing you out now, ${name}. It was a pleasure working with you today. See you again soon.`,
        );
        await signOut().catch(() => undefined);
        return true;
      }

      if (lower === "/status") {
        try {
          const data = (await healthCheck()) as HealthResponse;
          const statusLines = ["SYSTEM STATUS", ""];
          statusLines.push(
            `Overall: ${((data.status ?? "unknown") as string).toUpperCase()}`,
          );
          statusLines.push("");
          if (data.providers && typeof data.providers === "object") {
            statusLines.push("PROVIDERS:");
            for (const [name, rawInfo] of Object.entries(data.providers)) {
              const info = rawInfo as ProviderHealthEntry;
              const isAvailable = info.available ?? info.is_available ?? false;
              const statusLabel = isAvailable ? "ONLINE" : "OFFLINE";
              const latency = info.latency_ms ?? null;
              statusLines.push(formatProviderLine(name, statusLabel, latency));
            }
          }
          pushSystem(statusLines.join("\n"), "slash");
          speakDynamic(
            "System status retrieved successfully. All active provider information is now displayed in the terminal.",
          );
        } catch {
          pushSystem(
            "Unable to reach backend. Ensure the backend service is running.",
            "slash",
            true,
          );
          speakDynamic(
            "Unable to connect to the backend service at this time. Please ensure the server is running.",
          );
        }
        return true;
      }

      if (lower === "/providers") {
        try {
          const rawList = await getProviderStatus();
          const providerLines = ["AI PROVIDERS", ""];
          const typedList = (rawList as unknown as ProviderListEntry[]).map(
            (p) => ({
              name: p.name ?? p.provider_name ?? "unknown",
              available: p.available ?? p.is_available ?? false,
              model: p.model ?? p.model_name ?? null,
              latency_ms: p.latency_ms ?? null,
            }),
          );
          const online = typedList.filter((p) => p.available);
          const offline = typedList.filter((p) => !p.available);
          providerLines.push(`Online: ${online.length} / ${typedList.length}`);
          providerLines.push("");
          if (online.length > 0) {
            providerLines.push("ONLINE:");
            for (const p of online) {
              const model = p.model ? ` (${p.model})` : "";
              providerLines.push(
                formatProviderLine(p.name, "ONLINE" + model, p.latency_ms),
              );
            }
          }
          if (offline.length > 0) {
            providerLines.push("");
            providerLines.push("OFFLINE:");
            for (const p of offline) {
              providerLines.push(formatProviderLine(p.name, "OFFLINE", null));
            }
          }
          pushSystem(providerLines.join("\n"), "slash");
          speakDynamic(
            `${online.length} out of ${typedList.length} AI providers are currently online and actively serving requests.`,
          );
        } catch {
          pushSystem(
            "Unable to reach backend to fetch provider list.",
            "slash",
            true,
          );
          speakDynamic(
            "Could not retrieve provider information. The backend may be unreachable.",
          );
        }
        return true;
      }

      if (lower === "/history") {
        const recent = messages.slice(-20);
        if (recent.length === 0) {
          pushSystem(
            "No conversation history in this session yet.",
            "slash",
          );
          speakDynamic(
            "Your conversation history is empty for this session. Start typing to begin.",
          );
          return true;
        }
        const historyLines = [
          `CONVERSATION HISTORY \u2014 Last ${recent.length} messages`,
          "",
        ];
        for (const msg of recent) {
          const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          const role = msg.role === "user" ? "YOU" : "ASHU AI";
          const preview = msg.content.slice(0, 120).replace(/\n/g, " ");
          const suffix = msg.content.length > 120 ? "..." : "";
          if (msg.memory_id) {
            historyLines.push(`[${time}] ${role} [ID:${msg.memory_id}]`);
          } else {
            historyLines.push(`[${time}] ${role}`);
          }
          historyLines.push(`  ${preview}${suffix}`);
          historyLines.push("");
        }
        pushSystem(historyLines.join("\n"), "slash");
        speakDynamic(
          `Showing the last ${recent.length} messages from your current session. Scroll up to review the full conversation.`,
        );
        return true;
      }

      if (lower === "/export") {
        if (messages.length === 0) {
          pushSystem(
            "Nothing to export. Start a conversation first.",
            "slash",
          );
          speakDynamic(
            "There is no conversation to export yet. Start chatting and then use slash export to download.",
          );
          return true;
        }
        try {
          if (options?.onExportPdf) {
            options.onExportPdf(messages);
            pushSystem(
              `Export complete. Preparing ${messages.length} messages as a formatted PDF document.`,
              "slash",
            );
            speakDynamic(
              `Your conversation is being exported as a formatted PDF document. ${messages.length} messages have been prepared for printing. Your browser print dialog will open shortly.`,
            );
          } else {
            const exportContent = buildStructuredExportContent(
              messages,
              sessionId,
            );
            triggerTextDownload(exportContent, sessionId);
            pushSystem(
              `Export complete. Downloaded ${messages.length} messages as a structured text file.`,
              "slash",
            );
            speakDynamic(
              `Your conversation has been exported successfully. ${messages.length} messages have been saved as a clean structured text file ready for reading.`,
            );
          }
        } catch {
          pushSystem("Export failed. Please try again.", "slash", true);
          speakDynamic(
            "The export encountered an error. Please try again.",
          );
        }
        return true;
      }

      pushSystem(
        `Unknown command: ${trimmed}. Type /help to see all available commands.`,
        "slash",
        true,
      );
      speakDynamic(
        "Unknown command entered. Type slash help to see a complete list of all available commands.",
      );
      return true;
    },
    [
      user,
      isAuthenticated,
      messages,
      sessionId,
      pushSystem,
      storeClear,
      signOut,
      speakDynamic,
      options,
    ],
  );

  const submitMessage = useCallback(
    async (
      input: string,
      onAuthRequired: () => void,
    ): Promise<void> => {
      const trimmed = input.trim();
      if (!trimmed) return;
      if (isLoading || isStreaming) return;

      const isSlash = await handleSlashCommand(trimmed, onAuthRequired);
      if (isSlash) return;

      if (!isAuthenticated) {
        onAuthRequired();
        speakDynamic(
          "Authentication is required to send messages. Please sign in to continue.",
        );
        return;
      }

      const parsed = parseCommand(trimmed);

      const userMsg: ConversationMessage = {
        id: generateMessageId(),
        role: "user",
        content: trimmed,
        command_type: parsed.type,
        provider_used: "",
        memory_id: null,
        timestamp: new Date().toISOString(),
        tokens_used: 0,
        latency_ms: 0,
        is_regenerated: false,
        isError: false,
        isStreaming: false,
        session_id: sessionId,
      };

      addMessage(userMsg);

      const firstName = user
        ? getFirstName(user.name ?? undefined, user.email)
        : "";
      speakMessageSent(firstName, currentProviderRef.current);

      setIsLoading(true);
      setIsStreaming(false);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const assistantMsgId = generateMessageId();

      const placeholderMsg: ConversationMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        command_type: parsed.type,
        provider_used: "",
        memory_id: null,
        timestamp: new Date().toISOString(),
        tokens_used: 0,
        latency_ms: 0,
        is_regenerated: false,
        isError: false,
        isStreaming: true,
        session_id: sessionId,
      };

      addMessage(placeholderMsg);
      setIsStreaming(true);
      setIsLoading(false);

      try {
        const chatRequest = {
          prompt: parsed.prompt,
          command_type: parsed.type,
          session_id: sessionId,
          memory_id: parsed.memoryId,
          conversation_id: sessionId,
        };

        const response = await sendChatMessage(
          chatRequest as Parameters<typeof sendChatMessage>[0],
        );

        if (response.provider_used) {
          const prov = response.provider_used as ProviderName;
          setCurrentProvider(prov);
          currentProviderRef.current = prov;
          speakProviderChange(prov);
        }

        updateLastMessage(response.response ?? "");

        const updatedMsg: ConversationMessage = {
          ...placeholderMsg,
          id: assistantMsgId,
          content: response.response ?? "",
          provider_used: response.provider_used ?? "",
          memory_id: response.memory_id ?? null,
          tokens_used: response.tokens_used ?? 0,
          latency_ms: response.latency_ms ?? 0,
          is_regenerated: false,
          isStreaming: false,
          isError: false,
        };

        const store = useTerminalStore.getState();
        const currentMessages = store.messages;
        const lastIdx = currentMessages.length - 1;
        if (
          lastIdx >= 0 &&
          currentMessages[lastIdx]?.id === assistantMsgId
        ) {
          store.clearMessages();
          for (const m of currentMessages.slice(0, lastIdx)) {
            store.addMessage(m);
          }
          store.addMessage(updatedMsg);
        }
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) {
          const errorMsg: ConversationMessage = {
            ...placeholderMsg,
            id: assistantMsgId,
            content:
              "An error occurred while contacting the AI service. Please check your connection and try again.",
            isStreaming: false,
            isError: true,
          };
          const store = useTerminalStore.getState();
          const currentMessages = store.messages;
          const lastIdx = currentMessages.length - 1;
          if (
            lastIdx >= 0 &&
            currentMessages[lastIdx]?.id === assistantMsgId
          ) {
            store.clearMessages();
            for (const m of currentMessages.slice(0, lastIdx)) {
              store.addMessage(m);
            }
            store.addMessage(errorMsg);
          }
          speakDynamic(
            "An error occurred. Please check your connection and try again.",
          );
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [
      isLoading,
      isStreaming,
      isAuthenticated,
      sessionId,
      user,
      addMessage,
      updateLastMessage,
      speakDynamic,
      speakMessageSent,
      speakProviderChange,
      handleSlashCommand,
    ],
  );

  const clearMessages = useCallback(() => {
    storeClear();
    setCurrentProvider(null);
    currentProviderRef.current = null;
  }, [storeClear]);

  return {
    messages,
    isLoading,
    isStreaming,
    currentProvider,
    sessionId,
    submitMessage,
    clearMessages,
  };
}