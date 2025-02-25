import type { ProjectConfig } from "@/components/DeployHandler.vue";
import type { ProjectNode } from "@/types/project";

export const generateGitLabCI = async (
  config: ProjectConfig,
  project: ProjectNode
): Promise<string> => {
  try {
    const response = await fetch(`/templates/.gitlab-ci-template.yml`);

    if (!response.ok) {
      console.error("Error gitlab ci template not found");
      return "# Error: Template not found";
    }

    let gitlabCI = await response.text();

    // Replace placeholders with the actual values
    gitlabCI = gitlabCI.replace(
      /{ APPLICATION_NAME }/g,
      project.name.toLowerCase().replace(/[\s_]+/g, "-")
    ); // Set application name from config
    gitlabCI = gitlabCI.replace(/{ PORT }/g, config.port?.toString() || "80"); // Set application port from config

    return gitlabCI;
  } catch (error) {
    console.error("Error loading GitLab CI template:", error);
    return "# Error loading GitLab CI template";
  }
};
