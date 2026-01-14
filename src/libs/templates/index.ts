import type { ProjectConfig } from "@/types/app-config";
import type { ProjectNode } from "@/types/project";
import type { Result } from "@/types/result";
import { DEFAULT_PATHS, templates } from "@/config";
import { templateDataBuilder } from "./data-builder";
import { parseTemplate } from "../mustache";

type GenerateFile = { fileName: string; content: string };

export const generateFiles = async (
  config: ProjectConfig,
  project: ProjectNode,
  username: string
): Promise<Result<GenerateFile[]>> => {
  try {
    // Build template data
    const templateData = templateDataBuilder(
      config,
      project,
      username
    );
    const filesPaths = [...DEFAULT_PATHS]

    // Add additional files from config
    config.files.forEach((file) => {
      filesPaths.push(`/templates/${config.framework}/${file}`);
    });

    const result: GenerateFile[] = [];

    // Process each template
    for (const path of filesPaths) {
      const template = templates[path];
      if (!template) {
        return {
          success: false,
          error: `Template not found for ${path}`,
        };
      }

      // Replace placeholders in template
      const content = parseTemplate(template, templateData);

      const fileName = path.split("/").pop();
      if (!fileName) {
        return {
          success: false,
          error: `Invalid file name for template ${path}`,
        };
      }

      result.push({ fileName, content });
    }

    return { success: true, content: result };
  } catch (error) {
    console.error("Error generating files:", error);
    return {
      success: false,
      error: "Error generating files",
    };
  }
};
