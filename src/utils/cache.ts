import type { TemplateSource } from "@/types/config";

export function getCacheKey(file: TemplateSource): string {
  switch (file.type) {
    case "local":
      return `local:${file.path}`;
    case "url":
      return `url:${file.url}`;
    case "gitlab":
      return `gitlab:${file.project}:${file.ref}:${file.path}`;
  }
}