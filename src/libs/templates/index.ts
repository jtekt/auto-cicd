import type { ManagedFile, ProjectConfig } from "@/config/frameworks-config";
import { generateDockerfile } from "./dockerfile-template";
import { generateGitLabCI } from "./gitlab-ci-template";
import { generateKubernetesManifest } from "./kubernetes-manifest-template";
import { generateNginxConf } from "./nginx-template";
import type { ProjectNode } from "@/types/project";

export const generateFiles = async (
  config: ProjectConfig,
  project: ProjectNode
): Promise<{ fileName: ManagedFile; content: string }[]> => {
  const generatedFiles: { fileName: ManagedFile; content: string }[] = [];

  // Generate Dockerfile
  if (config.files.includes("Dockerfile")) {
    const dockerfile = await generateDockerfile(config);
    generatedFiles.push({ fileName: "Dockerfile", content: dockerfile });
  }

  // Generate .gitlab-ci.yml
  if (config.files.includes(".gitlab-ci.yml")) {
    const gitlabCi = await generateGitLabCI(config, project);
    generatedFiles.push({ fileName: ".gitlab-ci.yml", content: gitlabCi });
  }

  // Generate kubernetes_manifest.yml
  if (config.files.includes("kubernetes_manifest.yml")) {
    const k8sManifest = await generateKubernetesManifest(config);
    generatedFiles.push({
      fileName: "kubernetes_manifest.yml",
      content: k8sManifest,
    });
  }

  // Generate nginx.conf
  if (config.files.includes("nginx.conf")) {
    const nginxConf = await generateNginxConf(config);
    generatedFiles.push({ fileName: "nginx.conf", content: nginxConf });
  }

  return generatedFiles;
};
