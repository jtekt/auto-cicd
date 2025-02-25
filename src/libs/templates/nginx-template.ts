import type { ProjectConfig } from "@/components/DeployHandler.vue";

export const generateNginxConf = async (
  config: ProjectConfig
): Promise<string> => {
  try {
    // Fetch the nginx.conf template
    const templatePath = `/templates/${config.id}/nginx.conf.template`;
    const response = await fetch(templatePath);

    if (!response.ok) {
      console.error("Nginx template not found for framework:", config.id);
      return "# Error: Template not found";
    }

    let nginx = await response.text();

    nginx = nginx.replace(/{PORT}/g, config.port?.toString() || "80"); // Set application port from config

    return nginx;
  } catch (error) {
    console.error("Error loading Nginx config template:", error);
    return "# Error loading Nginx config template";
  }
};
