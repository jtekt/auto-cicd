import type { ConfigFileInfo } from "@/config/frameworks-config";
import type { TemplateSource } from "@/types/config";

export function getTemplateCacheKey(file: TemplateSource): string {
  if (typeof file === "string") {
    return `local:${file}`;
  } else if (file.type === "url") {
    return `url:${file.url}`;
  } else if (file.type === "gitlab") {
    return `gitlab:${file.project}:${file.ref}:${file.path}`;
  }

  return "";
}

export function getProjectCacheKey(
  item: ConfigFileInfo & {
    project: { fullPath: string; repository: { rootRef: string } };
  },
) {
  return `${item.project.fullPath}:${item.project.repository.rootRef}:${item.file}`;
}
