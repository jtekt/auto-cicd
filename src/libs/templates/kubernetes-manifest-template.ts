import type { ProjectConfig } from "@/components/DeployHandler.vue";

export const generateKubernetesManifest = async (
  config: ProjectConfig
): Promise<string> => {
  try {
    // Fetch the Kubernetes template
    const templatePath = `/templates/kubernetes_manifest-template.yml`;
    const response = await fetch(templatePath);

    if (!response.ok) {
      console.error("Kubernetes template not found for framework:", config.id);
      return "# Error: Template not found";
    }

    const template = await response.text();

    return template;
  } catch (error) {
    console.error("Error loading Kubernetes config template:", error);
    return "# Error loading Kubernetes config template";
  }
};
