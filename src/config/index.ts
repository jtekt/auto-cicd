import { getCacheKey } from "@/utils/cache";
import { graphqlFetchFile } from "@/libs/gitlab";
import { ConfigSchema } from "@/schemas/config";
import type { Config, TemplateSource } from "@/types/config";
import YAML from "yaml";

let parsedConfig: Config | null = null;

export const loadConfig = async () => {
  const res = await fetch("/config.yml");

  if (!res.ok) {
    throw new Error("Error loading config.yml");
  }

  // Read as text (YAML)
  const text = await res.text();

  // Parse YAML → JS object
  const content = YAML.parse(text);

  // Validate with Zod
  parsedConfig = ConfigSchema.parse(content);
};

export const getConfig = () => parsedConfig;

export const DEFAULT_FILES = [".gitlab-ci.yml", "kubernetes_manifest.yml"];
export const DEFAULT_PATHS = DEFAULT_FILES.map((f) => ({
  type: "local" as const,
  path: `/templates/common/${f}`,
}));

export const templates: Record<string, string> = {};

export const loadTemplates = async (
  access_token: string,
  framework: string
) => {
  if (!parsedConfig) return;
  const frameworkFiles = parsedConfig.frameworks[framework]?.files || [];

  // Create a local copy to prevent mutating the config
  const filesToFetch = [...frameworkFiles];

  // Add default files only if not already included and not already loaded
  DEFAULT_PATHS.forEach((defaultPath) => {
    if (!filesToFetch.includes(defaultPath)) {
      filesToFetch.push(defaultPath);
    }
  });

  const requests = filesToFetch.map(async (file) => {
    const cacheKey = getCacheKey(file);

    if (templates[cacheKey]) return;

    try {
      const content = await fetchTemplateSource(file, access_token);
      if (content) templates[cacheKey] = content;
    } catch (err) {
      console.error(`Error fetching template for ${cacheKey}:`, err);
    }
  });

  await Promise.all(requests);
};

async function fetchTemplateSource(
  file: TemplateSource,
  token: string
): Promise<string | null> {
  switch (file.type) {
    case "local":
      const localRes = await fetch(file.path);
      return localRes.ok ? localRes.text() : null;
    case "url":
      const urlRes = await fetch(file.url);
      return urlRes.ok ? urlRes.text() : null;

    case "gitlab":
      return graphqlFetchFile(file.project, file.ref, file.path, token);

    default:
      return null;
  }
}
