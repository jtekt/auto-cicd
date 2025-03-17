import type { ProjectConfig } from "@/types/app-config";

type GenerateNginxResult =
  | {
      success: true;
      content: string;
    }
  | {
      success: false;
      error: string;
    };

export const generateNginxConf = async (
  config: ProjectConfig
): Promise<GenerateNginxResult> => {
  try {
    // Fetch the nginx.conf template
    const templatePath = `/templates/${config.framework}/nginx.conf.template`;
    const response = await fetch(templatePath);

    if (!response.ok) {
      console.error(
        "Nginx template not found for framework:",
        config.framework
      );
      return {
        success: false,
        error: "Nginx template not found for framework:" + config.framework,
      };
    }

    let nginx = await response.text();

    nginx = nginx.replace(/{PORT}/g, config.port?.toString() || "80"); // Set application port from config

    return { success: true, content: nginx };
  } catch (error) {
    console.error("Error loading Nginx config template:", error);
    return { success: false, error: "Error loading Nginx config template" };
  }
};
