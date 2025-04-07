import type { ManagedFile, ProjectConfig } from "@/types/app-config";
import { generateDockerfile } from "./dockerfile";
import { generateGitLabCI } from "./gitlab-ci-template";
import { generateKubernetesManifest } from "./kubernetes-manifest-template";
import { generateNginxConf } from "./nginx-template";
import type { ProjectNode } from "@/types/project";
import type { Result } from "@/types/result";

export const generateFiles = async (
  config: ProjectConfig,
  project: ProjectNode,
  username: string
): Promise<Result<{ fileName: ManagedFile; content: string }[]>> => {
  const errors: string[] = [];
  const files: { fileName: ManagedFile; content: string }[] = [];

  // Mandatory files
  const dockerFile = await generateDockerfile(config);
  if (dockerFile.success) {
    files.push({
      fileName: "Dockerfile",
      content: dockerFile.content,
    });
  } else {
    errors.push(dockerFile.error);
  }

  const gitlabCI = await generateGitLabCI(config, project, username);
  if (gitlabCI.success) {
    files.push({
      fileName: ".gitlab-ci.yml",
      content: gitlabCI.content,
    });
  } else {
    errors.push(gitlabCI.error);
  }

  const kubernetesFile = await generateKubernetesManifest(config);
  if (kubernetesFile.success) {
    files.push({
      fileName: "kubernetes_manifest.yml",
      content: kubernetesFile.content,
    });
  } else {
    errors.push(kubernetesFile.error);
  }

  // Optional files
  for (const file of config.files) {
    if (file === "nginx.conf") {
      const nginxFile = await generateNginxConf(config);
      if (nginxFile.success) {
        files.push({
          fileName: "nginx.conf",
          content: nginxFile.content,
        });
      } else {
        errors.push(nginxFile.error);
      }
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join("; "),
    };
  }

  return { success: true, content: files };
};
