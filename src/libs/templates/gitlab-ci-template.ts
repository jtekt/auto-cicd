import type { ProjectConfig } from "@/config/frameworks-config";
import type { ProjectNode } from "@/types/project";

const PUBLIC_BASE = (globalThis as any).BASE_PUBLIC_URL || "";

export const generateGitLabCI = async (
  config: ProjectConfig,
  project: Pick<ProjectNode, "name" | "fullPath" | "repository">
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

    // Replace placeholders with the actual values
    gitlabCI = gitlabCI
      .replace(
        /{ APPLICATION_NAME }/g,
        project.fullPath
          .split("/")
          .pop()
          ?.toLowerCase()
          .trim()
          .replace(" ", "-") ||
          project.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s.,!?'"-]/g, "")
            .trim()
            .replace(" ", "-")
      ) // Set application name
      .replace(/{ PORT }/g, config.port?.toString() || "80") // Set application port from config
      .replace(/{ ROOT_REF }/g, project.repository.rootRef); // Set application main branch

    return gitlabCI;
  } catch (error) {
    console.error("Error loading GitLab CI template:", error);
    return "# Error loading GitLab CI template";
  }
};
