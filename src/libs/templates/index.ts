import type { ProjectNode } from "@/types/project";
import type { Result } from "@/types/result";
import { DEFAULT_PATHS, templates, loadTemplates } from "@/config";
import { templateDataBuilder } from "./data-builder";
import { parseTemplate } from "../mustache";
import type { ProjectConfig } from "@/types/app-config";
import type { TemplateSource } from "@/types/config";
import type { GitLabFile } from "../gitlab";
import { getTemplateCacheKey } from "@/utils/cache";
import { resolveOutputFileName } from "@/utils/file";

export const generateFiles = async (
  access_token: string,
  config: ProjectConfig,
  project: ProjectNode,
  username: string
): Promise<Result<GitLabFile[]>> => {
  try {
    // Load and cache templates for this framework
    await loadTemplates(access_token, config.framework);

    // Build mustache template data
    const templateData = templateDataBuilder(config, project, username);

    // Start with defaults (TemplateSource[])
    const filesToRender: TemplateSource[] = [...DEFAULT_PATHS];

    // Add user-defined files (TemplateSource[])
    if (config.files) {
      filesToRender.push(...config.files);
    }

    const results: GitLabFile[] = [];

    for (const file of filesToRender) {
      const key = getTemplateCacheKey(file);
      const template = templates[key];

      if (!template) {
        return {
          success: false,
          error: `Template not found for source: ${JSON.stringify(file)}`,
        };
      }

      // Render via mustache
      const content = parseTemplate(template, templateData);

      // Generate output file name
      const fileName = resolveOutputFileName(file);

      if (!fileName) {
        return {
          success: false,
          error: `Unable to determine output filename for: ${JSON.stringify(
            file
          )}`,
        };
      }

      results.push({ fileName, content });
    }

    return { success: true, content: results };
  } catch (err) {
    console.error("Error generating files:", err);
    return {
      success: false,
      error: "Error generating files",
    };
  }
};