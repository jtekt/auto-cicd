import type { TemplateSource } from "./config";

export type FileAction = "create" | "update";

export type ProjectConfig = {
  language: string;
  framework: string;
  manager: string;
  files: TemplateSource[]; // Optional files to generate
  runtimeDependencies?: string[]; // For Python frameworks

  // User configurable commands
  installCommand: string; // Explicitly set based on manager/framework
  buildCommand?: string; // Optional, based on framework
  outputFile: string; // Optional, based on framework
  port: number;
};