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
        config.installCommand.toLowerCase()
      );
    if (config.buildCommand)
      dockerfile = dockerfile.replace(
        /{buildCommand}/g,
        config.buildCommand.toLowerCase()
      );
    if (config.outputDir)
      dockerfile = dockerfile.replace(
        /{outputDir}/g,
        config.outputDir.toLowerCase()
      );
    if (config.rootDir)
      dockerfile = dockerfile.replace(
        /{rootDir}/g,
        config.rootDir.toLowerCase()
      );

    const port = config.port ? config.port.toString() : "80";
    dockerfile = dockerfile.replace(/{PORT}/g, port);

    return dockerfile;
  } catch (error) {
    console.error("Error loading Dockerfile template:", error);
    return "# Error loading Dockerfile template";
  }
};
