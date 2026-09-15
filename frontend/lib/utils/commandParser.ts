// frontend/lib/utils/commandParser.ts
import { CommandType, ParsedCommand, SlashCommandResult } from "@/types";

export interface CommandInfo {
  name: string;
  description: string;
  glowColor: string;
  icon: string;
  example: string;
  placeholder: string;
  shortcut: string;
}

export interface SlashCommandMeta {
  command: string;
  description: string;
  example: string;
  requiresAuth: boolean;
  requiresLoggedOut: boolean;
}

export type SlashCommandKey =
  | "help"
  | "clear"
  | "status"
  | "providers"
  | "history"
  | "export"
  | "theme"
  | "login"
  | "logout"
  | "version"
  | "unknown";

export interface ParsedSlashCommand {
  command: SlashCommandKey;
  args: string;
}

export const COMMAND_INFO: Record<CommandType, CommandInfo> = {
  "@": {
    name: "Expert Mode",
    description: "PhD-level explanation from basics to advanced",
    glowColor: "#00ff88",
    icon: "@",
    example: "@ what is machine learning",
    placeholder: "Enter topic for expert explanation...",
    shortcut: "@",
  },
  "$": {
    name: "Code Analysis",
    description: "Line-by-line code breakdown with version detection",
    glowColor: "#ff8800",
    icon: "$",
    example: "$ print('hello world')",
    placeholder: "Paste code to analyze...",
    shortcut: "$",
  },
  "#": {
    name: "Memory Save",
    description: "Save AI response with a unique retrievable ID",
    glowColor: "#b400ff",
    icon: "#",
    example: "# explain recursion",
    placeholder: "Enter prompt to save to memory...",
    shortcut: "#",
  },
  "*": {
    name: "Regenerate",
    description: "Regenerate or extend a previously saved response",
    glowColor: "#ff0088",
    icon: "✱",
    example: "* MEM_2026_XXXXXX",
    placeholder: "Enter memory ID to regenerate...",
    shortcut: "*",
  },
  "\u2731": {
    name: "Regenerate",
    description: "Regenerate or extend a previously saved response",
    glowColor: "#ff0088",
    icon: "✱",
    example: "✱ MEM_2026_XXXXXX",
    placeholder: "Enter memory ID to regenerate...",
    shortcut: "✱",
  },
  slash: {
    name: "System Command",
    description: "Terminal system command",
    glowColor: "#00ffff",
    icon: "/",
    example: "/help",
    placeholder: "Enter system command...",
    shortcut: "/",
  },
  default: {
    name: "Chat",
    description: "Plain AI conversation",
    glowColor: "#00ccff",
    icon: "›",
    example: "What is the speed of light?",
    placeholder: "Ask ASHU AI anything...",
    shortcut: "",
  },
};

const SLASH_COMMAND_MAP: Record<string, SlashCommandKey> = {
  help: "help",
  clear: "clear",
  status: "status",
  providers: "providers",
  history: "history",
  export: "export",
  theme: "theme",
  login: "login",
  logout: "logout",
  version: "version",
};

export const SLASH_COMMANDS_META: SlashCommandMeta[] = [
  {
    command: "/help",
    description: "Show all available commands",
    example: "/help",
    requiresAuth: false,
    requiresLoggedOut: false,
  },
  {
    command: "/clear",
    description: "Clear terminal output",
    example: "/clear",
    requiresAuth: false,
    requiresLoggedOut: false,
  },
  {
    command: "/status",
    description: "Show AI provider status",
    example: "/status",
    requiresAuth: false,
    requiresLoggedOut: false,
  },
  {
    command: "/providers",
    description: "List all 13 AI providers",
    example: "/providers",
    requiresAuth: false,
    requiresLoggedOut: false,
  },
  {
    command: "/history",
    description: "Show conversation history",
    example: "/history",
    requiresAuth: true,
    requiresLoggedOut: false,
  },
  {
    command: "/export",
    description: "Export chat history as PDF",
    example: "/export",
    requiresAuth: true,
    requiresLoggedOut: false,
  },
  {
    command: "/theme",
    description: "Cycle to next terminal theme",
    example: "/theme",
    requiresAuth: false,
    requiresLoggedOut: false,
  },
  {
    command: "/version",
    description: "Show ASHU AI version info",
    example: "/version",
    requiresAuth: false,
    requiresLoggedOut: false,
  },
  {
    command: "/login",
    description: "Sign in or create an account",
    example: "/login",
    requiresAuth: false,
    requiresLoggedOut: true,
  },
  {
    command: "/logout",
    description: "Sign out of your account",
    example: "/logout",
    requiresAuth: true,
    requiresLoggedOut: false,
  },
];

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { type: "default", raw: trimmed, prompt: "", memoryId: null, instruction: null };
  }
  if (trimmed.startsWith("@")) {
    return { type: "@", raw: trimmed, prompt: trimmed.slice(1).trim(), memoryId: null, instruction: null };
  }
  if (trimmed.startsWith("$")) {
    return { type: "$", raw: trimmed, prompt: trimmed.slice(1).trim(), memoryId: null, instruction: null };
  }
  if (trimmed.startsWith("#")) {
    return { type: "#", raw: trimmed, prompt: trimmed.slice(1).trim(), memoryId: null, instruction: null };
  }
  if (trimmed.startsWith("*")) {
    const body = trimmed.slice(1).trim();
    const parts = body.split(/\s+/);
    const memoryId = parts[0] ?? null;
    const instruction = parts.slice(1).join(" ") || null;
    return { type: "*", raw: trimmed, prompt: body, memoryId, instruction };
  }
  if (trimmed.startsWith("\u2731")) {
    const body = trimmed.slice(1).trim();
    const parts = body.split(/\s+/);
    const memoryId = parts[0] ?? null;
    const instruction = parts.slice(1).join(" ") || null;
    return { type: "\u2731", raw: trimmed, prompt: body, memoryId, instruction };
  }
  if (trimmed.startsWith("/")) {
    return { type: "slash", raw: trimmed, prompt: trimmed.slice(1).trim(), memoryId: null, instruction: null };
  }
  return { type: "default", raw: trimmed, prompt: trimmed, memoryId: null, instruction: null };
}

export function parseSlashCommand(body: string): ParsedSlashCommand {
  const parts = body.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? "";
  const args = parts.slice(1).join(" ");
  const command = SLASH_COMMAND_MAP[cmd] ?? "unknown";
  return { command, args };
}

export function getCommandInfo(type: CommandType): CommandInfo {
  return COMMAND_INFO[type] ?? COMMAND_INFO["default"];
}

export function getVisibleSlashCommands(isAuthenticated: boolean): SlashCommandMeta[] {
  return SLASH_COMMANDS_META.filter((cmd) => {
    if (cmd.requiresAuth && !isAuthenticated) return false;
    if (cmd.requiresLoggedOut && isAuthenticated) return false;
    return true;
  });
}

export function isMemoryId(input: string): boolean {
  return isValidMemoryId(input);
}

export function isValidMemoryId(input: string): boolean {
  return /^MEM_\d{4}_[A-Z0-9]{6,}$/i.test(input.trim());
}

export function isSlashCommand(input: string): boolean {
  return input.trim().startsWith("/");
}

export function isCommandPrefix(input: string): boolean {
  const first = input.trim()[0];
  return first === "@" || first === "$" || first === "#" || first === "*" || first === "\u2731" || first === "/";
}

export function buildSlashCommandResult(
  type: SlashCommandResult["type"],
  message: string,
  data?: unknown,
): SlashCommandResult {
  return { type, message, data };
}

export function normalizeCommandType(raw: string): CommandType {
  if (raw === "@" || raw === "$" || raw === "#" || raw === "*" || raw === "\u2731" || raw === "slash" || raw === "default") {
    return raw as CommandType;
  }
  return "default";
}

export function getCommandPrefix(type: CommandType): string {
  if (type === "default" || type === "slash") return "";
  if (type === "\u2731") return "\u2731 ";
  return `${type} `;
}

export function buildHelpLines(isAuthenticated: boolean): Array<{ text: string; command?: string; clickable: boolean }> {
  const separator = { text: "─".repeat(47), clickable: false };
  const header = { text: "ASHU AI — COMMAND REFERENCE", clickable: false };

  const commandLines = [
    { text: "@ <topic>     Expert PhD-level explanation", command: "@ ", clickable: true },
    { text: "$ <code>      Code analysis & breakdown", command: "$ ", clickable: true },
    { text: "# <prompt>    Save response to memory", command: "# ", clickable: true },
    { text: "* <mem_id>    Regenerate saved response", command: "* ", clickable: true },
    { text: "✱ <mem_id>    Same as * command", command: "\u2731 ", clickable: true },
  ];

  const slashLines = getVisibleSlashCommands(isAuthenticated).map((meta) => ({
    text: `${meta.command.padEnd(14)} ${meta.description}`,
    command: meta.command,
    clickable: true,
  }));

  return [
    header,
    separator,
    ...commandLines,
    separator,
    ...slashLines,
    separator,
  ];
}