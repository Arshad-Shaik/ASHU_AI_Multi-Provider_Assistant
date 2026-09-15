// frontend/lib/utils/idGenerator.ts
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const MEMORY_ID_PATTERN = /\bMEM_\d{4}_[A-Z0-9]+\b/;
const SESSION_ID_PATTERN = /\bSES_[A-Z0-9]+_[A-Z0-9]+\b/;
const MESSAGE_ID_PATTERN = /\bMSG_[A-Z0-9]+_[A-Z0-9]+\b/;
const USER_ID_PATTERN = /\bUSR_[A-Z0-9]+_[A-Z0-9]+\b/;
const AI_ID_PATTERN = /\bAI_[A-Z0-9]+_[A-Z0-9]+\b/;

let memorySequence = 0;
let sessionSequence = 0;
let messageSequence = 0;
let userSequence = 0;
let aiSequence = 0;

function randomChars(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < len; i++) {
    const byte = bytes[i] ?? 0;
    result += CHARS[byte % CHARS.length] ?? "0";
  }
  return result;
}

function toBase36Seq(counter: number): string {
  return counter.toString(36).toUpperCase().padStart(2, "0");
}

export function generateMemoryId(): string {
  const year = new Date().getFullYear();
  const seq = toBase36Seq(memorySequence++);
  const rand = randomChars(6);
  return `MEM_${year}_${seq}${rand}`;
}

export function generateSessionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const seq = toBase36Seq(sessionSequence++);
  const rand = randomChars(6);
  return `SES_${ts}_${seq}${rand}`;
}

export function generateMessageId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const seq = toBase36Seq(messageSequence++);
  const rand = randomChars(4);
  return `MSG_${ts}_${seq}${rand}`;
}

export function generateConversationId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomChars(8);
  return `CON_${ts}_${rand}`;
}

export function generateResponseId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomChars(6);
  return `RES_${ts}_${rand}`;
}

export function generateUserId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const seq = toBase36Seq(userSequence++);
  const rand = randomChars(4);
  return `USR_${ts}_${seq}${rand}`;
}

export function generateAiId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const seq = toBase36Seq(aiSequence++);
  const rand = randomChars(4);
  return `AI_${ts}_${seq}${rand}`;
}

export function generateToastId(): string {
  return `TOAST_${Date.now().toString(36).toUpperCase()}_${randomChars(4)}`;
}

export function isValidMemoryId(value: string): boolean {
  return MEMORY_ID_PATTERN.test(value.trim());
}

export function isValidSessionId(value: string): boolean {
  return SESSION_ID_PATTERN.test(value.trim());
}

export function isValidMessageId(value: string): boolean {
  return MESSAGE_ID_PATTERN.test(value.trim());
}

export function isValidUserId(value: string): boolean {
  return USER_ID_PATTERN.test(value.trim());
}

export function isValidAiId(value: string): boolean {
  return AI_ID_PATTERN.test(value.trim());
}

export function extractMemoryIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(MEMORY_ID_PATTERN);
  return match?.[0] ?? null;
}

export function formatIdForDisplay(id: string, maxLen: number = 20): string {
  if (id.length <= maxLen) return id;
  const prefix = id.split("_").slice(0, 2).join("_");
  const suffix = id.slice(-4);
  return `${prefix}\u2026${suffix}`;
}

export function parseMemoryIdFromStarCommand(input: string): string | null {
  const trimmed = input.replace(/^[*\u2731]\s*/u, "").trim();
  if (isValidMemoryId(trimmed)) return trimmed;
  const extracted = extractMemoryIdFromInput(trimmed);
  return extracted;
}

export function getIdPrefix(
  id: string,
): "MEM" | "SES" | "MSG" | "CON" | "RES" | "USR" | "AI" | "TOAST" | "UNKNOWN" {
  if (id.startsWith("MEM_")) return "MEM";
  if (id.startsWith("SES_")) return "SES";
  if (id.startsWith("MSG_")) return "MSG";
  if (id.startsWith("CON_")) return "CON";
  if (id.startsWith("RES_")) return "RES";
  if (id.startsWith("USR_")) return "USR";
  if (id.startsWith("AI_")) return "AI";
  if (id.startsWith("TOAST_")) return "TOAST";
  return "UNKNOWN";
}