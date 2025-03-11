import { env } from "@/config/env";
import type { ProjectConfig } from "@/config/frameworks-config";
import type { ProjectNode } from "@/types/project";

const PUBLIC_BASE = (globalThis as any).BASE_PUBLIC_URL || "";

export const generateGitLabCI = async (
  config: ProjectConfig,
  project: Pick<ProjectNode, "namespace" | "repository" | "fullPath">,
  username: string
): Promise<string> => {
  try {
    const response = await fetch(
      `${PUBLIC_BASE}/templates/.gitlab-ci-template.yml`
    );

    if (!response.ok) {
      console.error("Error gitlab ci template not found");
      return "# Error: Template not found";
    }

    let gitlabCI = await response.text();

    if (!project.namespace) throw new Error("Project without namespace");

    const appPaths = project.fullPath.split("/");
    const appName = `${username}-${appPaths[appPaths.length - 1]}`;

    // Replace placeholders with the actual values
    gitlabCI = gitlabCI
      .replace(/{ APPLICATION_NAME }/g, appName) // Set application name
      .replace(/{ PORT }/g, config.port?.toString() || "80") // Set application port from config
      .replace(/{ ROOT_REF }/g, project.repository.rootRef) // Set application main branch
      .replace(/{ DEPLOYED_NAMESPACE }/g, env.DEPLOYED_NAMESPACE) // Set kubernetes context
      .replace(/{ USERNAME }/g, username); // Set Username

    return gitlabCI;
  } catch (error) {
    console.error("Error loading GitLab CI template:", error);
    return "# Error loading GitLab CI template";
  }
};
