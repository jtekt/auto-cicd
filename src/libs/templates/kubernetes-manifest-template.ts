import type { ProjectConfig } from "@/types/app-config";

type GenerateKubernetesResult =
  | {
      success: true;
      content: string;
    }
  | {
      success: false;
      error: string;
    };

export const generateKubernetesManifest = async (
  config: ProjectConfig
): Promise<GenerateKubernetesResult> => {
  try {
    // Fetch the Kubernetes template
    const templatePath = `/templates/kubernetes_manifest-template.yml`;
    const response = await fetch(templatePath);

    if (!response.ok) {
      console.error(
        "Kubernetes template not found for framework:",
        config.framework
      );
      return {
        success: false,
        error:
          "Kubernetes template not found for framework:" + config.framework,
      };
    }

    const template = await response.text();

    return { success: true, content: template };
  } catch (error) {
    console.error("Error loading Kubernetes config template:", error);
    return {
      success: false,
      error: "Error loading Kubernetes config template",
    };
  }
};
