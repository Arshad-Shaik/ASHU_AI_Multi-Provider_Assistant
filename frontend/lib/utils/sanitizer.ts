// frontend/lib/utils/sanitizer.ts
const SCRIPT_TAG_PATTERN = /<script[^>]*>[\s\S]*?<\/script>/gi;
const SCRIPT_OPEN_PATTERN = /<script[^>]*>/gi;
const JAVASCRIPT_PROTOCOL_PATTERN = /javascript:/gi;
const INLINE_EVENT_PATTERN = /on\w+\s*=/gi;
const IFRAME_PATTERN = /<iframe[^>]*>/gi;
const DATA_HTML_PATTERN = /data:text\/html/gi;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ANSI_ESCAPE_PATTERN = /\x1B\[[0-9;]*[mGKHF]/g;
const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF\u2028\u2029]/g;

const MARKDOWN_BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const MARKDOWN_ITALIC_STAR_PATTERN = /\*([^*]+)\*/g;
const MARKDOWN_ITALIC_UNDERSCORE_PATTERN = /_([^_]+)_/g;
const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+/gm;
const MARKDOWN_CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const MARKDOWN_INLINE_CODE_PATTERN = /`([^`]+)`/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g;
const MARKDOWN_HR_PATTERN = /^[-*_]{3,}\s*$/gm;
const MARKDOWN_BLOCKQUOTE_PATTERN = /^>\s*/gm;
const MARKDOWN_LIST_PATTERN = /^[\s]*[-*+]\s+/gm;
const MARKDOWN_NUMBERED_LIST_PATTERN = /^[\s]*\d+\.\s+/gm;

const MAX_INPUT_LENGTH = 8000;
const MAX_OUTPUT_LENGTH = 100000;
const MAX_PREVIEW_LENGTH = 280;

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(ZERO_WIDTH_PATTERN, "")
    .replace(ANSI_ESCAPE_PATTERN, "")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}

export function sanitizeOutput(output: string): string {
  if (typeof output !== "string") return "";
  const cleaned = output
    .replace(SCRIPT_TAG_PATTERN, "")
    .replace(SCRIPT_OPEN_PATTERN, "")
    .replace(JAVASCRIPT_PROTOCOL_PATTERN, "")
    .replace(INLINE_EVENT_PATTERN, "")
    .replace(IFRAME_PATTERN, "")
    .replace(DATA_HTML_PATTERN, "")
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(ZERO_WIDTH_PATTERN, "")
    .replace(ANSI_ESCAPE_PATTERN, "");
  return cleaned.slice(0, MAX_OUTPUT_LENGTH);
}

export function stripMarkdownForVoice(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(MARKDOWN_CODE_BLOCK_PATTERN, " code block ")
    .replace(MARKDOWN_INLINE_CODE_PATTERN, "$1")
    .replace(MARKDOWN_BOLD_PATTERN, "$1")
    .replace(MARKDOWN_ITALIC_STAR_PATTERN, "$1")
    .replace(MARKDOWN_ITALIC_UNDERSCORE_PATTERN, "$1")
    .replace(MARKDOWN_HEADING_PATTERN, "")
    .replace(MARKDOWN_LINK_PATTERN, "$1")
    .replace(MARKDOWN_HR_PATTERN, "")
    .replace(MARKDOWN_BLOCKQUOTE_PATTERN, "")
    .replace(MARKDOWN_LIST_PATTERN, "")
    .replace(MARKDOWN_NUMBERED_LIST_PATTERN, "")
    .replace(/[#*_`~>]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function truncateForPreview(text: string, maxLen: number = MAX_PREVIEW_LENGTH): string {
  if (typeof text !== "string") return "";
  const cleaned = text.replace(/\s{2,}/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.8 ? truncated.slice(0, lastSpace) : truncated) + "\u2026";
}

export function sanitizeMemoryId(id: string): string {
  if (typeof id !== "string") return "";
  return id.replace(/[^A-Z0-9_]/gi, "").toUpperCase().slice(0, 30);
}

export function sanitizeSessionId(id: string): string {
  if (typeof id !== "string") return "";
  return id.replace(/[^A-Z0-9_]/gi, "").toUpperCase().slice(0, 40);
}

export function sanitizeTagList(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim().replace(/[^a-zA-Z0-9\s-_]/g, "").slice(0, 32))
    .filter((t) => t.length > 0)
    .slice(0, 20);
}

export function escapeHtml(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeWhitespace(text: string): string {
  if (typeof text !== "string") return "";
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, "  ").replace(/ {3,}/g, "  ");
}

export function extractFirstName(fullName: string): string {
  if (typeof fullName !== "string" || fullName.trim().length === 0) return "";
  const parts = fullName.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0] ?? "";
  const COMMON_SURNAMES = [
    "shaik","sheikh","khan","sharma","verma","gupta","singh","kumar",
    "patel","rao","reddy","naidu","nair","pillai","iyer","iyengar",
    "joshi","desai","mehta","shah","malhotra","chopra","kapoor","arora",
    "bose","das","dutta","ghosh","sen","mukherjee","banerjee","chatterjee",
    "mishra","tiwari","pandey","shukla","dubey","srivastava","trivedi",
    "mr","mrs","ms","dr","prof","sir",
  ];
  const firstLower = (parts[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const isSurname = COMMON_SURNAMES.includes(firstLower);
  if (isSurname && parts.length > 1) {
    const candidate = parts[1] ?? "";
    if (candidate.length > 1) return candidate;
  }
  const first = parts[0] ?? "";
  if (first.length <= 2 && parts.length > 1) {
    return parts[1] ?? "";
  }
  return first;
}
export function stripThinkingTags(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
    .trim();
}
