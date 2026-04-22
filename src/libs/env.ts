import type { Env } from "@/types/env";

/**
 * Internal line parser (single source of truth)
 */
function parseLine(line: string): Env | null {
  const match = line.match(/^([^#=]+)\s*=\s*(.*)$/);
  if (!match) return null;

  const key = match[1]?.trim();
  const rawValue = match[2] ?? "";

  if (!key) return null;

  // remove surrounding quotes
  const value = rawValue.trim().replace(/^["']|["']$/g, "");

  return { key, value };
}

/**
 * Parse .env string → Env[]
 * - Ignores empty lines and comments
 * - Last duplicate key wins
 */
export function parseEnv(text: string): Env[] {
  const normalized = text.replace(/\r/g, "");

  const map = new Map<string, Env>();

  const lines = normalized.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const parsed = parseLine(line);
    if (!parsed) continue; // ignore invalid lines here

    map.set(parsed.key, parsed); // last wins
  }

  return Array.from(map.values());
}

/**
 * Validate .env string
 * - Strict: ALL non-empty lines must be valid
 */
export function validateEnv(text: string): {
  valid: boolean;
  errors: { line: number; content: string }[];
} {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");

  const errors: { line: number; content: string }[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    // Allow comments
    if (!line || line.startsWith("#")) return;

    const parsed = parseLine(line);

    if (!parsed) {
      errors.push({
        line: index + 1,
        content: rawLine,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}