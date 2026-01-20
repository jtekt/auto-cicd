import type { TemplateSource } from "@/types/config";

export function getCacheKey(file: TemplateSource): string {
  if (typeof file === "string") {
    return `local:${file}`;
  } else if (file.type === "url") {
    return `url:${file.url}`;
  } else if (file.type === "gitlab") {
    return `gitlab:${file.project}:${file.ref}:${file.path}`;
  }

  return ""
}
