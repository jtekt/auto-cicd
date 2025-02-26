// Types
export type AcceptedFramework = "vite" | "nuxt" | "streamlit" | "unknown";
export type AcceptedPackageManager = "npm" | "yarn" | "pip" | "poetry";
export type Language = "javascript" | "python";
export type OptionalFiles = "nginx.conf"; // Optional files exclusive to some frameworks
export type ManagedFile =
  | OptionalFiles
  | "Dockerfile"
  | "kubernetes_manifest.yml"
  | ".gitlab-ci.yml";

export type PackageManagerConfig = {
  name: AcceptedPackageManager;
  commands: {
    install: string;
    build?: string; // Optional, some frameworks may not need a build step
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
  installCommand: string; // Explicitly set based on manager/framework
  buildCommand?: string; // Optional, based on framework
  outputDir: string;
  rootDir: string;
  port: number;
  files: OptionalFiles[]; // Optional files to generate
  runtimeDependencies?: string[]; // For Python frameworks
};

export type FrameworkConfig = {
  id: AcceptedFramework;
  name: string;
  language: Language;
  image: { type: "img" | "icon"; value: string };
  langs?: string[];
  outputDir?: string;
  rootDir?: string;
  port?: number;
  files?: OptionalFiles[];
  configFiles?: { file: string; checkFor: string[] }[]; // Still needed for framework detection
  supportedManagers: AcceptedPackageManager[];
  defaultManager: AcceptedPackageManager;
  runtimeDependencies?: string[];
};

export const packageManagers: Record<
  AcceptedPackageManager,
  PackageManagerConfig
> = {
  npm: {
    name: "npm",
    commands: { install: "npm install", build: "npm run build" },
    detectionFiles: [{ file: "package-lock.json" }],
  },
  yarn: {
    name: "yarn",
    commands: { install: "yarn install", build: "yarn build" },
    detectionFiles: [{ file: "yarn.lock" }],
  },
  pip: {
    name: "pip",
    commands: { install: "pip install -r requirements.txt" },
    detectionFiles: [{ file: "requirements.txt" }],
  },
  poetry: {
    name: "poetry",
    commands: { install: "poetry install" },
    detectionFiles: [{ file: "pyproject.toml", checkFor: "[tool.poetry]" }],
  },
};

export const frameworksConfig: Record<AcceptedFramework, FrameworkConfig> = {
  vite: {
    id: "vite",
    name: "Vite",
    language: "javascript",
    image: { type: "img", value: "/icons/Vite.js.svg" },
    langs: ["vue", "typescript", "javascript", "tsx", "jsx"],
    outputDir: "dist",
    rootDir: "./",
    port: 80,
    files: ["nginx.conf"],
    configFiles: [{ file: "package.json", checkFor: ["vite"] }],
    supportedManagers: ["npm", "yarn"],
    defaultManager: "npm",
  },
  nuxt: {
    id: "nuxt",
    name: "Nuxt",
    language: "javascript",
    image: { type: "img", value: "/icons/Nuxt.svg" },
    langs: ["vue", "typescript", "javascript"],
    outputDir: ".output",
    rootDir: "./",
    port: 80,
    files: [],
    configFiles: [{ file: "package.json", checkFor: ["nuxt"] }],
    supportedManagers: ["npm", "yarn"],
    defaultManager: "npm",
  },
  streamlit: {
    id: "streamlit",
    name: "Streamlit",
    language: "python",
    image: { type: "img", value: "/icons/Streamlit.svg" },
    langs: ["python"],
    rootDir: "./",
    port: 8501,
    files: [],
    configFiles: [{ file: "requirements.txt", checkFor: ["streamlit"] }],
    supportedManagers: ["pip", "poetry"],
    defaultManager: "pip",
    runtimeDependencies: ["gunicorn"],
  },
  unknown: {
    id: "unknown",
    name: "Unknown Framework",
    language: "javascript",
    image: { type: "icon", value: "mdi-help-circle-outline" },
    outputDir: "dist",
    rootDir: "./",
    port: 80,
    files: [],
    supportedManagers: ["npm"],
    defaultManager: "npm",
  },
};

// Helper to get default ProjectConfig
export const getDefaultProjectConfig = (
  frameworkId: AcceptedFramework,
  managerName?: AcceptedPackageManager
): ProjectConfig => {
  const framework = frameworksConfig[frameworkId];
  const manager = managerName || framework.defaultManager;
  const managerConfig = packageManagers[manager];

  return {
    language: framework.language,
    framework: framework.id,
    manager: manager,
    installCommand: managerConfig.commands.install,
    buildCommand:
      framework.language === "javascript"
        ? managerConfig.commands.build
        : undefined,
    outputDir: framework.outputDir || "dist",
    rootDir: framework.rootDir || "./",
    port: framework.port || 80,
    files: framework.files || [],
    runtimeDependencies: framework.runtimeDependencies,
  };
};
