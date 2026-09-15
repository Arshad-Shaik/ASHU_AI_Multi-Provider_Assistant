// frontend/hooks/useConversation.ts
"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  ConversationEntry,
  ConversationMessage,
  ConversationDetail,
  MessageRole,
} from "@/types";

export interface UseConversationReturn {
  entries: ConversationEntry[];
  activeConversation: ConversationDetail | null;
  activeConversationId: string | null;
  messages: ConversationMessage[];
  addEntry: (entry: ConversationEntry) => void;
  selectConversation: (id: string) => void;
  clearEntries: () => void;
  createMessage: (
    role: MessageRole,
    content: string,
    extras?: Partial<ConversationMessage>,
  ) => ConversationMessage;
}

const MAX_ENTRIES = 100;

function generateMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `msg_${crypto.randomUUID()}`;
  }
  return `msg_${Date.now().toString(36)}_${performance.now().toString(36).replace(".", "")}`;
}

export function useConversation(sessionId: string): UseConversationReturn {
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const sessionIdRef = useRef(sessionId);

  const addEntry = useCallback((entry: ConversationEntry) => {
    setEntries((prev: ConversationEntry[]) =>
      [entry, ...prev.filter((e: ConversationEntry) => e.id !== entry.id)].slice(0, MAX_ENTRIES),
    );
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  const createMessage = useCallback(
    (
      role: MessageRole,
      content: string,
      extras: Partial<ConversationMessage> = {},
    ): ConversationMessage => {
      const msg: ConversationMessage = {
        id: generateMessageId(),
        role,
        content,
        command_type: "default",
        timestamp: new Date().toISOString(),
                provider_used: "",
        session_id: "",
        tokens_used: 0,
        latency_ms: 0,
        is_regenerated: false,
        memory_id: null,
        ...extras,
      };
      setMessages((prev: ConversationMessage[]) => [...prev, msg]);
      return msg;
    },
    [],
  );

  const selectedEntry = useMemo<ConversationEntry | null>(() => {
    if (entries.length === 0) return null;
    if (activeConversationId) {
      return entries.find((e: ConversationEntry) => e.id === activeConversationId) ?? entries[0] ?? null;
    }
    return entries[0] ?? null;
  }, [entries, activeConversationId]);

  const activeConversation = useMemo<ConversationDetail | null>(() => {
    if (!selectedEntry) return null;
    return {
      id: selectedEntry.id,
      session_id: sessionIdRef.current,
      title: selectedEntry.title ?? "Untitled Conversation",
      messages,
      created_at: selectedEntry.created_at,
      updated_at: selectedEntry.updated_at ?? selectedEntry.created_at,
      message_count: messages.length,
      last_provider: selectedEntry.last_provider ?? null,
    };
  }, [selectedEntry, messages]);

  return {
    entries,
    activeConversation,
    activeConversationId,
    messages,
    addEntry,
    selectConversation,
    clearEntries,
    createMessage,
  };
}