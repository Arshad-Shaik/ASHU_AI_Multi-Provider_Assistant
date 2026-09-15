// frontend/hooks/useVoiceAgent.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useVoice } from "./useVoice";
import { extractFirstName } from "@/lib/utils/sanitizer";

export interface UseVoiceAgentReturn {
  isEnabled: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  lastSpokenText: string | null;
  toggleAgent: () => void;
  speakDynamic: (text: string, priority?: boolean) => void;
  speakThemeChange: (themeName: string, resolvedMode: string) => void;
  speakAuthEvent: (
    event: "login" | "logout" | "already_logged_in",
    userName?: string,
  ) => void;
  speakProviderChange: (providerName: string) => void;
  speakMessageSent: (firstName: string, providerName: string | null) => void;
  speak: (text: string) => void;
}

const STORAGE_KEY = "ashu-voice-agent-enabled";
const SESSION_KEY_OUTPUT = "ashu-terminal-output-spoken";
const SESSION_KEY_INPUT = "ashu-terminal-input-spoken";
const CLICK_DEBOUNCE_MS = 400;

const ARIA_SPEECH_MAP: Array<[string, string]> = [
  ["open memory panel", "Memory panel is now open. Your saved conversations and AI responses are fully visible."],
  ["open conversation log panel", "Conversation log panel is now open. You may browse your complete chat history here."],
  ["open analytics", "Analytics dashboard is now open. Your full usage statistics are now displayed."],
  ["open command palette", "Command reference panel is now open. All available commands are listed for your review."],
  ["accept all cookies", "All cookies accepted. Thank you for your consent. ASHU AI is fully operational."],
  ["essential cookies only", "Essential cookies only selected. Your privacy preferences have been saved successfully."],
  ["sign in with google", "Opening Google sign-in. Please complete authentication in the popup window."],
  ["sign in with github", "Opening GitHub sign-in. Please complete authentication in the popup window."],
  ["close memory panel", "Memory panel has been closed."],
  ["close conversation panel", "Conversation panel has been closed."],
  ["clear terminal", "Terminal cleared. The workspace is clean and ready for your next command."],
  ["toggle fullscreen", "Toggling fullscreen display mode."],
  ["cycle color theme", "Switching to the next holographic color theme."],
  ["send message", "Message submitted. Processing your request now."],
  ["voice agent", "Voice agent status toggled."],
  ["sign out", "Signing out of your account. Your session is ending gracefully."],
  ["sign in to ashu", "Opening the authentication portal. Please sign in to continue."],
  ["open privacy policy", "Opening Privacy Policy. Your data protection information is now displayed."],
  ["close privacy policy", "Privacy Policy closed."],
  ["linkedin", "Opening the developer LinkedIn profile. Connecting you to the professional network."],
  ["github", "Opening the developer GitHub repository. Connecting you to the source code."],
  ["copy", "Content copied to clipboard successfully."],
  ["delete memory", "Memory entry has been permanently removed from your saved responses."],
  ["regenerate", "Regenerating the selected response with enhanced depth and greater analytical clarity."],
  ["export chat", "Exporting your conversation history as a structured downloadable file."],
  ["refresh memory", "Refreshing your memory entries. Loading the latest saved responses now."],
  ["retry", "Retrying the connection to the backend service."],
  ["switch to light theme", "Light theme is now fully active. The interface brightness has been elevated for optimal clarity."],
  ["switch to dark theme", "Dark theme is now fully active. The interface is optimized for low-light environments."],
  ["switch to system theme", "System theme is now active. The interface will follow your device display preferences automatically."],
  ["filter by @", "Filtering memory by At command ? expert level explanations are now displayed."],
  ["filter by $", "Filtering memory by Dollar command ? code analysis entries are now displayed."],
  ["filter by #", "Filtering memory by Hash command ? saved memory entries are now displayed."],
  ["filter by all", "Showing all memory entries across all command types."],
  ["filter by chat", "Filtering memory by standard chat conversations."],
  ["terminal output", "Terminal output area. All AI responses and your messages are displayed here."],
  ["terminal input", "Terminal input ready. Type your message or command and press Enter to send."],
  ["star memory", "Memory entry starred. This response has been marked as a favourite."],
  ["unstar memory", "Memory entry unstarred. This response has been removed from favourites."],
  ["load conversation", "Loading selected conversation into the terminal."],
];

const SESSION_GATE_KEYS: Array<[string, string]> = [
  ["terminal output", SESSION_KEY_OUTPUT],
  ["terminal input", SESSION_KEY_INPUT],
];

const UNLIMITED_SPEAK_KEYS = [
  "filter by",
  "switch to",
  "sign in with",
  "copy",
  "delete memory",
  "star memory",
  "load conversation",
];

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStoredEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    return;
  }
}

function getSessionFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    return;
  }
}

function resolveAriaLabel(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const labeled = target.closest("[aria-label]");
  if (!labeled) return null;
  const label = labeled.getAttribute("aria-label");
  if (!label || label.trim().length === 0) return null;
  return label.trim();
}

function buildProviderPhrase(providerName: string | null): string {
  if (!providerName || providerName.trim().length === 0) return "our AI engine";
  const name = providerName.trim();
  const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const providerPhraseMap: Record<string, string> = {
    Gemini: "Google Gemini",
    Groq: "Groq with Qwen",
    Openai: "OpenAI GPT",
    Grok: "xAI Grok",
    Mistral: "Mistral AI",
    Claude: "Anthropic Claude",
    Cerebras: "Cerebras AI",
    Openrouter: "OpenRouter",
    Cohere: "Cohere Command",
    Huggingface: "Hugging Face",
    Cloudflare: "Cloudflare AI",
    Together: "Together AI",
    Deepseek: "DeepSeek AI",
  };
  return providerPhraseMap[normalized] ?? normalized;
}

function resolveClickSpeech(ariaLabel: string): string {
  const lower = ariaLabel.toLowerCase();
  for (const [key, speech] of ARIA_SPEECH_MAP) {
    if (lower.includes(key)) return speech;
  }
  if (lower.startsWith("account menu for ")) {
    const name = ariaLabel.slice("account menu for ".length).trim();
    const firstName = extractFirstName(name);
    const addressName = firstName.length > 1 ? firstName : name;
    return addressName
      ? `Opening account options for ${addressName}. What would you like to do?`
      : "Opening account options.";
  }
  if (lower.startsWith("filter by ")) {
    const filterName = ariaLabel.slice("filter by ".length).trim();
    const filterMap: Record<string, string> = {
      "@": "Filtering by At command ? expert level explanations are now displayed.",
      "$": "Filtering by Dollar command ? code analysis entries are now displayed.",
      "#": "Filtering by Hash command ? saved memory entries are now displayed.",
      "all": "Showing all memory entries across all command types.",
      "chat": "Filtering by standard chat conversations.",
    };
    return filterMap[filterName] ?? `Filtering memory by ${filterName}.`;
  }
  if (lower.includes("close")) return "Panel closed.";
  if (lower.includes("search")) return "Search activated. Type to filter your entries.";
  if (lower.includes("scroll to bottom")) return "Scrolled to the latest message.";
  return ariaLabel;
}

function isUnlimitedSpeakKey(lower: string): boolean {
  return UNLIMITED_SPEAK_KEYS.some((k) => lower.includes(k));
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const voice = useVoice();
  const voiceRef = useRef(voice);
  const isEnabledRef = useRef<boolean>(false);
  const isMountedRef = useRef(true);
  const lastClickRef = useRef<{ label: string; time: number } | null>(null);
  const speakCountRef = useRef<Map<string, number>>(new Map());

  const [isEnabled, setIsEnabled] = useState<boolean>(() => readStoredEnabled());
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);

  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
    writeStoredEnabled(isEnabled);
  }, [isEnabled]);

  const emitSpoken = useCallback((text: string) => {
    if (isMountedRef.current) setLastSpokenText(text);
  }, []);

  const shouldAllowSpeak = useCallback((ariaLabel: string): boolean => {
    const lower = ariaLabel.toLowerCase();
    for (const [key, sessionKey] of SESSION_GATE_KEYS) {
      if (lower.includes(key)) {
        if (getSessionFlag(sessionKey)) return false;
        setSessionFlag(sessionKey);
        return true;
      }
    }
    if (isUnlimitedSpeakKey(lower)) return true;
    const current = speakCountRef.current.get(lower) ?? 0;
    if (current >= 3) return false;
    speakCountRef.current.set(lower, current + 1);
    return true;
  }, []);

  useEffect(() => {
    if (!voice.isSupported) return;
    const handleClick = (event: MouseEvent) => {
      if (!isEnabledRef.current) return;
      const label = resolveAriaLabel(event.target);
      if (!label) return;
      const now = Date.now();
      const prev = lastClickRef.current;
      if (prev && prev.label === label && now - prev.time < CLICK_DEBOUNCE_MS) return;
      lastClickRef.current = { label, time: now };
      if (!shouldAllowSpeak(label)) return;
      const speech = resolveClickSpeech(label);
      emitSpoken(speech);
      voiceRef.current.speak(speech, true);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [voice.isSupported, emitSpoken, shouldAllowSpeak]);

  const toggleAgent = useCallback(() => {
    if (!voiceRef.current.isSupported) return;
    setIsEnabled((prev) => {
      const next = !prev;
      if (!next) {
        voiceRef.current.stopSpeaking();
        if (isMountedRef.current) setLastSpokenText(null);
        lastClickRef.current = null;
        speakCountRef.current.clear();
      } else {
        const activateMsg =
          "Voice agent activated. I am ASHU AI, your holographic intelligence assistant. I will narrate your interactions with clarity and precision.";
        emitSpoken(activateMsg);
        voiceRef.current.speak(activateMsg, true);
      }
      return next;
    });
  }, [emitSpoken]);

  const speakDynamic = useCallback(
    (text: string, priority: boolean = true) => {
      if (!voiceRef.current.isSupported) return;
      if (!isEnabledRef.current) return;
      if (!text || text.trim().length === 0) return;
      emitSpoken(text);
      voiceRef.current.speak(text, priority);
    },
    [emitSpoken],
  );

  const speakThemeChange = useCallback(
    (themeName: string, resolvedMode: string) => {
      if (!voiceRef.current.isSupported) return;
      if (!isEnabledRef.current) return;
      const mode = resolvedMode.toLowerCase().trim();
      const scheme = themeName.toLowerCase().trim();
      let speech = "";
      if (scheme === "light") {
        speech = "Light theme is now fully active. The interface brightness has been elevated for optimal daytime clarity.";
      } else if (scheme === "dark") {
        speech = "Dark theme is now fully active. The interface is optimized for low-light and nighttime environments.";
      } else if (scheme === "system") {
        const systemMode = mode === "light" ? "light" : "dark";
        speech = `System theme is now active. Your device preference is ${systemMode} mode. The interface has adapted accordingly.`;
      } else {
        speech = `${themeName} theme is now active. The holographic interface has transformed to reflect your selection.`;
      }
      emitSpoken(speech);
      voiceRef.current.speak(speech, true);
    },
    [emitSpoken],
  );

  const speakAuthEvent = useCallback(
    (event: "login" | "logout" | "already_logged_in", userName?: string) => {
      if (!voiceRef.current.isSupported) return;
      const firstName =
        userName && userName.trim().length > 0 ? extractFirstName(userName) : "";
      const addressName = firstName.length > 1 ? firstName : (userName ?? "");
      let speech = "";
      if (event === "login") {
        if (!isEnabledRef.current) return;
        speech = addressName
          ? `Welcome back, ${addressName}. You are now signed in to ASHU AI. Your holographic terminal is fully ready and awaiting your commands.`
          : "Welcome. You are now signed in to ASHU AI. Your holographic terminal is fully ready and awaiting your commands.";
      } else if (event === "logout") {
        speech = addressName
          ? `Goodbye, ${addressName}. You have been signed out successfully. Your session has ended gracefully. We look forward to seeing you again.`
          : "You have been signed out successfully. Your session has ended. Come back soon.";
      } else if (event === "already_logged_in") {
        if (!isEnabledRef.current) return;
        speech = addressName
          ? `${addressName}, you are already signed in to ASHU AI. All features are fully active and available. No further action is required.`
          : "You are already signed in. All features are active. No further action is required.";
      }
      if (speech.length > 0) {
        emitSpoken(speech);
        voiceRef.current.speak(speech, true);
      }
    },
    [emitSpoken],
  );

  const speakProviderChange = useCallback(
    (providerName: string) => {
      if (!voiceRef.current.isSupported) return;
      if (!isEnabledRef.current) return;
      const phrase = buildProviderPhrase(providerName);
      const speech = `${phrase} is now handling your request. Generating your response, please stand by.`;
      emitSpoken(speech);
      voiceRef.current.speak(speech, false);
    },
    [emitSpoken],
  );

  const speakMessageSent = useCallback(
    (firstName: string, providerName: string | null) => {
      if (!voiceRef.current.isSupported) return;
      if (!isEnabledRef.current) return;
      const providerPhrase = buildProviderPhrase(providerName);
      const name = firstName && firstName.trim().length > 1 ? firstName.trim() : null;
      const speech = name
        ? `${name}, your message has been received by ${providerPhrase}. Please stand by while your response is being generated.`
        : `Your message has been received by ${providerPhrase}. Please stand by while your response is being generated.`;
      emitSpoken(speech);
      voiceRef.current.speak(speech, true);
    },
    [emitSpoken],
  );

  return {
    isEnabled,
    isSpeaking: voice.isSpeaking,
    isSupported: voice.isSupported,
    lastSpokenText,
    toggleAgent,
    speakDynamic,
    speakThemeChange,
    speakAuthEvent,
    speakProviderChange,
    speakMessageSent,
    speak: speakDynamic,
  };
}
