export type AcceptedFramework =
  | "vite"
  | "nuxt"
  | "nextjs"
  | "express"
  | "streamlit"
  | "fastapi"
export type AcceptedPackageManager = "npm" | "yarn" | "pnpm" | "pip";
export type Language = "javascript" | "python";
export type OptionalFiles = "nginx.conf"; // Optional files exclusive to some frameworks
export type DefaultInjectedFiles =
  | "Dockerfile"
  | "kubernetes_manifest.yml"
  | ".gitlab-ci.yml";
export type ManagedFile = OptionalFiles | DefaultInjectedFiles;

export type PackageManagerConfig = {
  name: AcceptedPackageManager;
  commands: {
    install: string;
    build?: string; // Optional, some frameworks may not need a build step
    start?: string; // Optional, some frameworks have a preset start
  };
  detectionFiles: {
    file: string;
    checkFor?: string; // Optional content check (e.g., "[tool.poetry]" in pyproject.toml)
  }[];
};

export type FileAction = "create" | "update";

// ProjectConfig for deployment
export type ProjectConfig = {
  language: Language;
  framework: AcceptedFramework;
  manager: AcceptedPackageManager;
  files: OptionalFiles[]; // Optional files to generate
  runtimeDependencies?: string[]; // For Python frameworks

  // User configurable commands
  installCommand: string; // Explicitly set based on manager/framework
  buildCommand?: string; // Optional, based on framework
  outputFile: string; // Optional, based on framework
  port: number;
};

export type FrameworkConfig = {
  id: AcceptedFramework;
  name: string;
  language: Language;
  image: { type: "img" | "icon"; value: string };
  langs?: string[];
  userConfigurable?: {
    installCommand?: {
      defaultEmpty: boolean; // If true, the user must provide a command
    };
    buildCommand?: {
      defaultEmpty: boolean; // If true, the user must provide a command
    };
    outputFile?: {
      defaultEmpty: boolean; // If true, the user must provide a command
    };
    port?: {
      defaultEmpty: boolean; // If true, the user must provide a command
    };
  };
  outputFile: string;
  port?: number;
  files?: OptionalFiles[];
  configFiles?: { file: string[]; checkFor: string[] }[]; // What files and variations to check and what key words to look for
  supportedManagers: {
    manager: AcceptedPackageManager;
    requiredFiles: string[];
  }[];
  defaultManager: AcceptedPackageManager;
  requiredFiles?: (string | string[])[];
  tips?: { text: string; link?: string }[];
};
