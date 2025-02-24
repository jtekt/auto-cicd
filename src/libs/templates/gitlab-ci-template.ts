import type { Project } from "@/types/project";

export const generateGitLabCI = async (project: Project): Promise<string> => {
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
      project.name.toLowerCase().replace(/\s+/g, "-")
    ); // Set application name from config

    return gitlabCI;
  } catch (error) {
    console.error("Error loading GitLab CI template:", error);
    return "# Error loading GitLab CI template";
  }
};
