import type { ProjectConfig } from "@/components/DeployHandler.vue";

export const generateDockerfile = async (
  config: ProjectConfig
): Promise<string> => {
  try {
    const response = await fetch(`/templates/${config.id}/dockerfile.template`);

    if (!response.ok) {
      console.error("Dockerfile template not found for framework:", config.id);
      return "# Error: Template not found";
    }

    let dockerfile = await response.text();

    if (config.installCommand)
      dockerfile = dockerfile.replace(
        /{installCommand}/g,
        config.installCommand
      );
    if (config.buildCommand)
      dockerfile = dockerfile.replace(/{buildCommand}/g, config.buildCommand);
    if (config.outputDir)
      dockerfile = dockerfile.replace(/{outputDir}/g, config.outputDir);
    if (config.rootDir)
      dockerfile = dockerfile.replace(/{rootDir}/g, config.rootDir);

    return dockerfile;
  } catch (error) {
    console.error("Error loading Dockerfile template:", error);
    return "# Error loading Dockerfile template";
  }
};
