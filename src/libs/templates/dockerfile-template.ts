import type { ProjectConfig } from "@/config/frameworks-config";

const PUBLIC_BASE = (globalThis as any).BASE_PUBLIC_URL || "";

export const generateDockerfile = async (
  config: ProjectConfig
): Promise<string> => {
  try {
    const response = await fetch(
      `${PUBLIC_BASE}/templates/${config.framework}/dockerfile.template`
    );
    if (!response.ok) {
      return `# Error: Template not found for ${config.framework}`;
    }

    config = replaceFrameworkSpecifics(config);

    let dockerfile = await response.text();

    // Replace placeholders with the appropriate values, skipping empty ones
    dockerfile = dockerfile
      .replace(/{ROOT_DIR}/g, config.rootDir)
      .replace(/{INSTALL_COMMAND}/g, config.installCommand)
      .replace(
        /{BUILD_COMMAND}/g,
        config.buildCommand
          ? `\n# Build the project\nRUN ${config.buildCommand}\n`
          : ""
      )
      .replace(/{OUTPUT_DIR}/g, config.outputDir)
      .replace(/{OUTPUT_FILENAME}/g, config.outputFileName || "")
      .replace(/{PORT}/g, config.port.toString());

    return dockerfile;
  } catch (error) {
    console.error("Error loading Dockerfile template:", error);
    return "# Error loading Dockerfile template";
  }
};

const replaceFrameworkSpecifics = (config: ProjectConfig): ProjectConfig => {
  if (config.framework === "fastapi") {
    if (config.outputFileName) {
      config.outputFileName = config.outputFileName.replace(/\.py$/, "");
    }
  }

  return config;
};
