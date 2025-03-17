import type { ProjectConfig } from "@/types/app-config";

const PUBLIC_BASE = (globalThis as any).BASE_PUBLIC_URL || "";

type GenerateDockerfileResult =
  | {
      success: true;
      content: string;
    }
  | {
      success: false;
      error: string;
    };

export const generateDockerfile = async (
  config: ProjectConfig
): Promise<GenerateDockerfileResult> => {
  try {
    const response = await fetch(
      `${PUBLIC_BASE}/templates/${config.framework}/dockerfile.template`
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Template not found for ${config.framework}`,
      };
    }

    const updatedConfig = replaceFrameworkSpecifics(config);
    let dockerfile = await response.text();

    // Replace placeholders with appropriate values
    dockerfile = dockerfile
      .replace(/{ROOT_DIR}/g, updatedConfig.rootDir)
      .replace(/{INSTALL_COMMAND}/g, updatedConfig.installCommand)
      .replace(
        /{BUILD_COMMAND}/g,
        updatedConfig.buildCommand
          ? `\n# Build the project\nRUN ${updatedConfig.buildCommand}\n`
          : ""
      )
      .replace(/{OUTPUT_DIR}/g, updatedConfig.outputDir)
      .replace(/{OUTPUT_FILENAME}/g, updatedConfig.outputFileName || "")
      .replace(/{PORT}/g, updatedConfig.port.toString());

    return {
      success: true,
      content: dockerfile,
    };
  } catch (error) {
    console.error("Error loading Dockerfile template:", error);
    return {
      success: false,
      error: "Error loading Dockerfile template",
    };
  }
};

const replaceFrameworkSpecifics = (config: ProjectConfig): ProjectConfig => {
  const updatedConfig = { ...config };

  if (updatedConfig.framework === "fastapi" && updatedConfig.outputFileName) {
    updatedConfig.outputFileName = updatedConfig.outputFileName.replace(
      /\.py$/,
      ""
    );
  }

  return updatedConfig;
};
