import type { ProjectConfig } from "@/types/app-config";
import type { ProjectNode } from "@/types/project";

export const templateDataBuilder = (
  config: ProjectConfig,
  project: ProjectNode,
  username: string,
): Record<string, string> => {
  const splitOutputFile = config.outputFile?.split("/") || [];
  const fullFileName =
    splitOutputFile[splitOutputFile.length - 1] || project.projectName;
  const moduleName = fullFileName.split(".").slice(0, -1).join(".");
  const outputDirectory =
    splitOutputFile.length > 1
      ? [...splitOutputFile].slice(0, -1).join("/") + "/"
      : "./";

  const projectPath = project.fullPath.split("/").pop() || "";

  const urlSafeProjectName = projectPath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");

  return {
    USERNAME: username,

    // GITLAB CI Variables
    // Deprecated: In favor to use PROJECT_NAME_SLUG instead
    APPLICATION_NAME: project.projectName,
    PROJECT_NAME_SLUG: urlSafeProjectName,
    ROOT_REF: project.repository.rootRef, // Set application main branch

    // Commands
    INSTALL_COMMAND: config.installCommand,
    BUILD_COMMAND: config.buildCommand || "echo 'Skipping build'",

    // Output configuration
    OUTPUT_FILENAME: fullFileName,
    OUTPUT_MODULE_NAME: moduleName,
    OUTPUT_DIRECTORY: outputDirectory,
    OUTPUT_PATH: outputDirectory + fullFileName,

    // Server configuration
    PORT: config.port?.toString() || "80",

    // Framework
    FRAMEWORK: config.framework,
  };
};
