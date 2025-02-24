import type { ProjectConfig } from "@/components/DeployHandler.vue";
import type { Project } from "@/types/project";

export const generateGitLabCI = async (
  config: ProjectConfig,
  project: Project
): Promise<string> => {
  try {
    const response = await fetch(`/templates/.gitlab-ci-template.yml`);

    if (!response.ok) {
      console.error("Error gitlab ci template not found");
      return "# Error: Template not found";
    }

    const template = await response.text();

    // Replace placeholders with the actual values
    let gitlabCI = template;
    gitlabCI = gitlabCI.replace(
      /{ APPLICATION_NAME }/g,
      project.name.replace(/\s+/g, "-")
    ); // Set application name from config
    gitlabCI = gitlabCI.replace(/{ NAMESPACE }/g, config.id); // Set application name from config

    return gitlabCI;
  } catch (error) {
    console.error("Error loading GitLab CI template:", error);
    return "# Error loading GitLab CI template";
  }
};
