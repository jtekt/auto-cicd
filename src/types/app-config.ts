export type OptionalFiles = "nginx.conf"; // Optional files exclusive to some frameworks
export type DefaultInjectedFiles =
  | "Dockerfile"
  | "kubernetes_manifest.yml"
  | ".gitlab-ci.yml";
export type ManagedFile = OptionalFiles | DefaultInjectedFiles;

export type FileAction = "create" | "update";

export type ProjectConfig = {
  language: string;
  framework: string;
  manager: string;
  files: OptionalFiles[]; // Optional files to generate
  runtimeDependencies?: string[]; // For Python frameworks

  // User configurable commands
  installCommand: string; // Explicitly set based on manager/framework
  buildCommand?: string; // Optional, based on framework
  outputFile: string; // Optional, based on framework
  port: number;
};