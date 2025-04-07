import type { ProjectConfig } from "@/types/app-config";
import { validatedConfigSchema } from "./schema";
import type { Result } from "@/types/result";

const PUBLIC_BASE = (globalThis as any).BASE_PUBLIC_URL || "";

export const generateDockerfile = async (
  config: ProjectConfig
): Promise<Result<string>> => {
  try {
    const parsed = validatedConfigSchema.safeParse(config);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join("; "),
      };
    }

    const validated = parsed.data;

    const response = await fetch(
      `${PUBLIC_BASE}/templates/${validated.framework}/dockerfile.template`
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Template not found for ${validated.framework}`,
      };
    }

    const splitOutputFile = validated.outputFile.split("/");

    const installCommand = validated.installCommand;
    const buildCommand = validated.buildCommand;
    const outputFileName = getProjectName(
      splitOutputFile[splitOutputFile.length - 1],
      config.framework
    );
    const outputDirectory =
      splitOutputFile.length > 1
        ? [...splitOutputFile].slice(0, -1).join("/") + "/"
        : "./";
    const port = validated.port.toString() || "80";

    let dockerfile = await response.text();

    dockerfile = dockerfile
      .replace(/{INSTALL_COMMAND}/g, installCommand)
      .replace(
        /{BUILD_COMMAND}/g,
        buildCommand ? `\n# Build the project\nRUN ${buildCommand}\n` : ""
      )
      .replace(/{OUTPUT_FILENAME}/g, outputFileName || "")
      .replace(/{OUTPUT_DIRECTORY}/g, outputDirectory)
      .replace(/{PORT}/g, port);

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

const getProjectName = (name: string, framework: string) => {
  switch (framework) {
    case "fastapi":
      return name.split(".")[0];
    default:
      return name;
  }
};
