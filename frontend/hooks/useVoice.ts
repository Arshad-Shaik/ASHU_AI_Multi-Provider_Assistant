// frontend/hooks/useVoice.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { VoiceState } from "@/types";
import { stripMarkdownForVoice } from "@/lib/utils/sanitizer";

export interface UseVoiceReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  speak: (text: string, priority?: boolean) => void;
  stopSpeaking: () => void;
  setVoiceRate: (rate: number) => void;
  setVoiceVolume: (volume: number) => void;
}

const FEMALE_VOICE_KEYWORDS = [
  "samantha",
  "victoria",
  "karen",
  "moira",
  "tessa",
  "fiona",
  "veena",
  "zira",
  "hazel",
  "susan",
  "female",
  "woman",
  "girl",
  "aria",
  "jenny",
  "michelle",
  "monica",
  "nicky",
] as const;

const PREFERRED_VOICE_NAMES = [
  "Google US English",
  "Microsoft Aria Online",
  "Samantha",
  "Karen",
  "Moira",
  "Tessa",
  "Victoria",
  "Zira",
] as const;

const DEFAULT_RATE = 0.88;
const DEFAULT_PITCH = 0.95;
const DEFAULT_VOLUME = 1.0;
const MAX_SPEAK_LENGTH = 600;

function isLikelyFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const nameLower = voice.name.toLowerCase();
  return FEMALE_VOICE_KEYWORDS.some((kw) => nameLower.includes(kw));
}

function pickBestFemaleVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const english = voices.filter((v) =>
    v.lang.toLowerCase().startsWith("en"),
  );
  const pool = english.length > 0 ? english : voices;
  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = pool.find((v) =>
      v.name.toLowerCase().includes(preferred.toLowerCase()),
    );
    if (match) return match;
  }
  const femaleOnline = pool.find(
    (v) => isLikelyFemaleVoice(v) && !v.localService,
  );
  if (femaleOnline) return femaleOnline;
  const femaleLocal = pool.find((v) => isLikelyFemaleVoice(v));
  if (femaleLocal) return femaleLocal;
  const onlineEnglish = pool.find((v) => !v.localService);
  if (onlineEnglish) return onlineEnglish;
  return pool[0] ?? null;
}

export function useVoice(): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isSupported: false,
    isSpeaking: false,
    availableVoices: [],
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const rateRef = useRef(DEFAULT_RATE);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const playNext = useCallback(() => {
    const synth = synthRef.current;
    const nextText = queueRef.current.shift();
    if (!synth || !nextText) {
      isSpeakingRef.current = false;
      if (isMountedRef.current) {
        setVoiceState((prev) => ({ ...prev, isSpeaking: false }));
      }
      return;
    }
    const utterance = new SpeechSynthesisUtterance(nextText);
    utterance.rate = rateRef.current;
    utterance.pitch = DEFAULT_PITCH;
    utterance.volume = volumeRef.current;
    const selectedVoice = pickBestFemaleVoice(voicesRef.current);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      if (isMountedRef.current) {
        setVoiceState((prev) => ({ ...prev, isSpeaking: true }));
      }
    };
    utterance.onend = () => {
      if (queueRef.current.length > 0) {
        playNext();
      } else {
        isSpeakingRef.current = false;
        if (isMountedRef.current) {
          setVoiceState((prev) => ({ ...prev, isSpeaking: false }));
        }
      }
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      queueRef.current = [];
      if (isMountedRef.current) {
        setVoiceState((prev) => ({ ...prev, isSpeaking: false }));
      }
    };
    synth.speak(utterance);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    synthRef.current = window.speechSynthesis;
    if (isMountedRef.current) {
      setVoiceState((prev) => ({ ...prev, isSupported: true }));
    }

    const loadVoices = () => {
      const loaded = window.speechSynthesis.getVoices();
      voicesRef.current = loaded;
      if (isMountedRef.current) {
        setVoiceState((prev) => ({ ...prev, availableVoices: loaded }));
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      queueRef.current = [];
      const synth = synthRef.current;
      if (synth) {
        try {
          synth.cancel();
        } catch {
          return;
        }
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, priority: boolean = false) => {
      const synth = synthRef.current;
      if (!synth) return;
      const cleaned = stripMarkdownForVoice(text);
      if (!cleaned || cleaned.trim().length === 0) return;
      const truncated =
        cleaned.length > MAX_SPEAK_LENGTH
          ? `${cleaned.slice(0, MAX_SPEAK_LENGTH)}\u2026`
          : cleaned;
      if (priority) {
        synth.cancel();
        queueRef.current = [truncated];
        isSpeakingRef.current = false;
        playNext();
      } else {
        queueRef.current.push(truncated);
        if (!isSpeakingRef.current) {
          playNext();
        }
      }
    },
    [playNext],
  );

  const stopSpeaking = useCallback(() => {
    queueRef.current = [];
    const synth = synthRef.current;
    if (synth) {
      try {
        synth.cancel();
      } catch {
        return;
      }
    }
    isSpeakingRef.current = false;
    if (isMountedRef.current) {
      setVoiceState((prev) => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const setVoiceRate = useCallback((rate: number) => {
    rateRef.current = Math.max(0.5, Math.min(2.0, rate));
  }, []);

  const setVoiceVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0.0, Math.min(1.0, volume));
  }, []);

  return {
    isSpeaking: voiceState.isSpeaking,
    isSupported: voiceState.isSupported,
    availableVoices: voiceState.availableVoices ?? [],
    speak,
    stopSpeaking,
    setVoiceRate,
    setVoiceVolume,
  };
}