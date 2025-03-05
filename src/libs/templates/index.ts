import type { ManagedFile, ProjectConfig } from "@/config/frameworks-config";
import { generateDockerfile } from "./dockerfile-template";
import { generateGitLabCI } from "./gitlab-ci-template";
import { generateKubernetesManifest } from "./kubernetes-manifest-template";
import { generateNginxConf } from "./nginx-template";
import type { ProjectNode } from "@/types/project";

export const generateFiles = async (
  config: ProjectConfig,
  project: ProjectNode,
  username: string
): Promise<{ fileName: ManagedFile; content: string }[]> => {
  const files: { fileName: ManagedFile; content: string }[] = [];

  // Mandatory files
  files.push({
    fileName: "Dockerfile",
    content: await generateDockerfile(config),
  });
  files.push({
    fileName: ".gitlab-ci.yml",
    content: await generateGitLabCI(config, project, username),
  });
  files.push({
    fileName: "kubernetes_manifest.yml",
    content: await generateKubernetesManifest(config),
  });

  // Optional files
  for (const file of config.files) {
    if (file === "nginx.conf") {
      files.push({
        fileName: "nginx.conf",
        content: await generateNginxConf(config),
      });
    }
  }

  return files;
};
