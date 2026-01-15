import type { TemplateSource } from "@/types/config";

export function resolveOutputFileName(file: TemplateSource): string | null {
  if (file.type === "local") {
    return file.path.split("/").pop() || null;
  }
  if (file.type === "url") {
    return file.url.split("/").pop() || null;
  }
  if (file.type === "gitlab") {
    return file.path.split("/").pop() || null;
  }
  return null;
}

export function normalizeContent(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")   // normalize CRLF → LF
    .replace(/\s+$/g, "")     // remove trailing whitespace
    .trim();                  // remove surrounding whitespace
}