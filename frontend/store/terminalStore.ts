// frontend/store/terminalStore.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ConversationMessage,
  TerminalTheme,
  CommandType,
  SidePanelType,
  VoiceConfig,
  ProviderStatus,
  ProviderStatusMap,
  UserProfile,
  DashboardSummary,
  VoiceState,
} from "@/types";
import { generateSessionId } from "@/lib/utils/idGenerator";

interface TerminalStore {
  messages: ConversationMessage[];
  theme: TerminalTheme;
  sessionId: string;
  isLoading: boolean;
  isStreaming: boolean;
  isAuthenticated: boolean;
  currentProvider: string;
  activeSidePanel: SidePanelType;
  voiceConfig: VoiceConfig;
  voiceState: VoiceState;
  providerStatuses: ProviderStatus[];
  providerStatusMap: ProviderStatusMap;
  userProfile: UserProfile | null;
  dashboardSummary: DashboardSummary | null;
  commandUsage: Record<CommandType, number>;
  inputDraft: string;
  isMobileMenuOpen: boolean;
  addMessage: (msg: ConversationMessage) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setTheme: (theme: TerminalTheme) => void;
  setLoading: (v: boolean) => void;
  setStreaming: (v: boolean) => void;
  setAuthenticated: (v: boolean) => void;
  setCurrentProvider: (p: string) => void;
  setActiveSidePanel: (p: SidePanelType) => void;
  toggleSidePanel: (p: Exclude<SidePanelType, null>) => void;
  setVoiceConfig: (config: Partial<VoiceConfig>) => void;
  setVoiceState: (state: Partial<VoiceState>) => void;
  setProviderStatuses: (statuses: ProviderStatus[]) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setDashboardSummary: (summary: DashboardSummary | null) => void;
  incrementCommandUsage: (cmd: CommandType) => void;
  setInputDraft: (draft: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  resetSession: () => void;
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  enabled: true,
  language: "en-US",
  autoSpeak: false,
  volume: 0.9,
  rate: 0.95,
};

const DEFAULT_VOICE_STATE: VoiceState = {
  isSupported: false,
  isSpeaking: false,
};

const DEFAULT_COMMAND_USAGE: Record<CommandType, number> = {
  "@": 0,
  $: 0,
  "#": 0,
  "*": 0,
  "\u2731": 0,
  default: 0,
  slash: 0,
};

export const useTerminalStore = create<TerminalStore>()(
  persist(
    (set) => ({
      messages: [],
      theme: "matrix",
      sessionId: generateSessionId(),
      isLoading: false,
      isStreaming: false,
      isAuthenticated: false,
      currentProvider: "",
      activeSidePanel: null,
      voiceConfig: DEFAULT_VOICE_CONFIG,
      voiceState: DEFAULT_VOICE_STATE,
      providerStatuses: [],
      providerStatusMap: {},
      userProfile: null,
      dashboardSummary: null,
      commandUsage: DEFAULT_COMMAND_USAGE,
      inputDraft: "",
      isMobileMenuOpen: false,

      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      updateLastMessage: (content) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const lastIndex = state.messages.length - 1;
          const target = state.messages[lastIndex];
          if (!target || target.role !== "assistant") return state;
          const msgs = [...state.messages];
          msgs[lastIndex] = { ...target, content };
          return { messages: msgs };
        }),

      clearMessages: () => set({ messages: [] }),

      setTheme: (theme) => set({ theme }),

      setLoading: (v) => set({ isLoading: v }),

      setStreaming: (v) => set({ isStreaming: v }),

      setAuthenticated: (v) => set({ isAuthenticated: v }),

      setCurrentProvider: (p) => set({ currentProvider: p }),

      setActiveSidePanel: (p) => set({ activeSidePanel: p }),

      toggleSidePanel: (p) =>
        set((state) => ({
          activeSidePanel: state.activeSidePanel === p ? null : p,
        })),

      setVoiceConfig: (partial) =>
        set((state) => ({
          voiceConfig: { ...state.voiceConfig, ...partial },
        })),

      setVoiceState: (partial) =>
        set((state) => ({
          voiceState: { ...state.voiceState, ...partial },
        })),

      setProviderStatuses: (statuses) => {
        const map: ProviderStatusMap = {};
        for (const s of statuses) {
          map[s.provider_name] = s;
        }
        set({ providerStatuses: statuses, providerStatusMap: map });
      },

      setUserProfile: (profile) => set({ userProfile: profile }),

      setDashboardSummary: (summary) => set({ dashboardSummary: summary }),

      incrementCommandUsage: (cmd) =>
        set((state) => ({
          commandUsage: {
            ...state.commandUsage,
            [cmd]: (state.commandUsage[cmd] ?? 0) + 1,
          },
        })),

      setInputDraft: (draft) => set({ inputDraft: draft }),

      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      resetSession: () =>
        set({
          sessionId: generateSessionId(),
          messages: [],
          currentProvider: "",
          isLoading: false,
          isStreaming: false,
          isAuthenticated: false,
          inputDraft: "",
          activeSidePanel: null,
        }),
    }),
    {
      name: "ashu-terminal-store",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        commandUsage: state.commandUsage,
        voiceConfig: state.voiceConfig,
        messages: state.messages,
        sessionId: state.sessionId,
        inputDraft: state.inputDraft,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<TerminalStore> | undefined;
        return {
          ...currentState,
          theme: persisted?.theme ?? currentState.theme,
          commandUsage: {
            ...DEFAULT_COMMAND_USAGE,
            ...(persisted?.commandUsage ?? {}),
          },
          voiceConfig: {
            ...DEFAULT_VOICE_CONFIG,
            ...(persisted?.voiceConfig ?? {}),
          },
          messages: persisted?.messages ?? currentState.messages,
          sessionId: persisted?.sessionId ?? currentState.sessionId,
          inputDraft: persisted?.inputDraft ?? currentState.inputDraft,
        };
      },
    },
  ),
);