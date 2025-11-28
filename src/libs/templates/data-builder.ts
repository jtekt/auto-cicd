import type { ProjectConfig } from "@/types/app-config";
import type { ProjectNode } from "@/types/project";

export const templateDataBuilder = (
  config: ProjectConfig,
  project: ProjectNode,
  username: string
): Record<string, string> => {
  const splitOutputFile = config.outputFile?.split("/") || [];
  const fileName =
    splitOutputFile[splitOutputFile.length - 1] || project.projectName;
  const outputDirectory =
    splitOutputFile.length > 1
      ? [...splitOutputFile].slice(0, -1).join("/") + "/"
      : "./";

  return {
    USERNAME: username,

    // GITLAB CI Variables
    APPLICATION_NAME: project.projectName,
    ROOT_REF: project.repository.rootRef, // Set application main branch

    // Set kubernetes context
    DEPLOYED_NAMESPACE: import.meta.env.VITE_APP_DEPLOYED_NAMESPACE,
    IMAGE_PULL_SECRET_NAME:
      import.meta.env.VITE_APP_IMAGE_PULL_SECRET_NAME ||
      "auto-cicd-pull-secret",

    // Commands
    INSTALL_COMMAND: config.installCommand,
    BUILD_COMMAND: config.buildCommand || "echo 'Skipping build'",

    // Output configuration
    OUTPUT_FILENAME: fileName,
    OUTPUT_DIRECTORY: outputDirectory,
    OUTPUT_PATH: outputDirectory + fileName,

    // Server configuration
    PORT: config.port?.toString() || "80",

    // Framework
    FRAMEWORK: config.framework,
  };
};
