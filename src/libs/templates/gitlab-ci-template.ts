import { env } from "@/config/env";
import type { ProjectConfig } from "@/types/app-config";
import type { ProjectNode } from "@/types/project";
import type { Result } from "@/types/result";

const PUBLIC_BASE = (globalThis as any).BASE_PUBLIC_URL || "";

export const generateGitLabCI = async (
  config: ProjectConfig,
  project: Pick<ProjectNode, "namespace" | "repository" | "projectName">,
  username: string
): Promise<Result<string>> => {
  try {
    const response = await fetch(
      `${PUBLIC_BASE}/templates/.gitlab-ci-template.yml`
    );

    if (!response.ok) {
      console.error("Error: GitLab CI template not found");
      return {
        success: false,
        error: "Template not found",
      };
    }

    let gitlabCI = await response.text();

    if (!project.namespace) {
      throw new Error("Project without namespace");
    }

    // Replace placeholders with the actual values
    gitlabCI = gitlabCI
      .replace(/{ APPLICATION_NAME }/g, project.projectName) // Set application name
      .replace(/{ PORT }/g, config.port?.toString() || "80") // Set application port from config
      .replace(/{ ROOT_REF }/g, project.repository.rootRef) // Set application main branch
      .replace(/{ DEPLOYED_NAMESPACE }/g, env.DEPLOYED_NAMESPACE) // Set kubernetes context
      .replace(/{ USERNAME }/g, username); // Set Username

    return {
      success: true,
      content: gitlabCI,
    };
  } catch (error) {
    console.error("Error loading GitLab CI template:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message === "Project without namespace"
            ? "Project namespace is required"
            : "Error loading GitLab CI template"
          : "Unknown error occurred",
    };
  }
};
