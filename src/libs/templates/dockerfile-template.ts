import type { ProjectConfig } from "@/config/frameworks-config";

export const generateDockerfile = async (
  config: ProjectConfig
): Promise<string> => {
  try {
    const response = await fetch(
      `/templates/${config.framework}/dockerfile.template`
    );
    if (!response.ok) {
      return `# Error: Template not found for ${config.framework}`;
    }

    let dockerfile = await response.text();

    // Replace placeholders with the appropriate values, skipping empty ones
    dockerfile = dockerfile
      .replace(/{ROOT_DIR}/g, config.rootDir)
      .replace(/{INSTALL_COMMAND}/g, config.installCommand)
      .replace(/{BUILD_COMMAND}/g, config.buildCommand || "")
      .replace(/{OUTPUT_DIR}/g, config.outputDir)
      .replace(/{PORT}/g, config.port.toString());

    return dockerfile;
  } catch (error) {
    console.error("Error loading Dockerfile template:", error);
    return "";
  }
};
