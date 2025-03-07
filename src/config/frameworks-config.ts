// Types
export type AcceptedFramework =
  | "vite"
  | "nuxt"
  | "nextjs"
  | "express"
  | "streamlit"
  | "fastapi"
  | "unknown";
export type AcceptedPackageManager = "npm" | "yarn" | "pnpm" | "pip" | "poetry";
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
  installCommand: string; // Explicitly set based on manager/framework
  buildCommand?: string; // Optional, based on framework
  outputFileName?: string; // Optional, based on framework
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
  userConfigurable?: {
    installCommand?: true;
    buildCommand?: {
      defaultEmpty: boolean;
    };
    outputDir?: true;
    outputFileName?: true;
    rootDir?: true;
  };
  outputDir?: string;
  outputFileName?: string;
  rootDir?: string;
  port?: number;
  files?: OptionalFiles[];
  configFiles?: { file: string; checkFor: string[] }[]; // What files to check and what key words to look for
  supportedManagers: {
    manager: AcceptedPackageManager;
    requiredFiles: string[];
  }[];
  defaultManager: AcceptedPackageManager;
  requiredFiles?: string[];
  tips?: { text: string; link?: string }[];
};

export const envKey = "ENV"; // Name of the file saved in gitlab with the envs

export const packageManagers: Record<
  AcceptedPackageManager,
  PackageManagerConfig
> = {
  npm: {
    name: "npm",
    commands: {
      install: "npm install",
      build: "npm run build",
    },
    detectionFiles: [{ file: "package-lock.json" }],
  },
  yarn: {
    name: "yarn",
    commands: {
      install: "yarn install",
      build: "yarn build",
    },
    detectionFiles: [{ file: "yarn.lock" }],
  },
  pnpm: {
    name: "pnpm",
    commands: {
      install: "corepack enable pnpm && pnpm i --frozen-lockfile",
      build: "corepack enable pnpm && pnpm run build --frozen-lockfile",
    },
    detectionFiles: [{ file: "pnpm-lock.yaml" }],
  },
  pip: {
    name: "pip",
    commands: { install: "pip install --no-cache-dir -r requirements.txt" },
    detectionFiles: [{ file: "requirements.txt" }],
  },
  poetry: {
    name: "poetry",
    commands: {
      install: "poetry install --no-root",
    },
    detectionFiles: [{ file: "pyproject.toml" }],
  },
};

export const frameworksConfig: Record<AcceptedFramework, FrameworkConfig> = {
  vite: {
    id: "vite",
    name: "Vite",
    language: "javascript",
    image: { type: "img", value: "/icons/Vite.js.svg" },
    langs: ["vue", "typescript", "javascript", "tsx", "jsx"],
    userConfigurable: {
      buildCommand: { defaultEmpty: false },
      installCommand: true,
      outputDir: true,
      rootDir: true,
    },
    outputDir: "dist",
    rootDir: "./",
    port: 5173,
    files: ["nginx.conf"],
    configFiles: [{ file: "vite.config.ts", checkFor: ["defineConfig"] }],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: ["vite.config.ts", "package.json"],
  },
  nuxt: {
    id: "nuxt",
    name: "Nuxt",
    language: "javascript",
    image: { type: "img", value: "/icons/Nuxt.svg" },
    langs: ["vue", "typescript", "javascript"],
    userConfigurable: {
      buildCommand: { defaultEmpty: false },
      installCommand: true,
      outputDir: true,
      rootDir: true,
    },
    outputDir: ".output",
    rootDir: "./",
    port: 3000,
    files: [],
    configFiles: [{ file: "nuxt.config.ts", checkFor: ["defineNuxtConfig"] }],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: ["nuxt.config.ts", "package.json"],
  },
  nextjs: {
    id: "nextjs",
    name: "NextJs",
    language: "javascript",
    image: { type: "img", value: "/icons/Nextjs.svg" },
    langs: ["tsx", "jsx", "typescript", "javascript"],
    userConfigurable: {
      buildCommand: { defaultEmpty: false },
      installCommand: true,
      outputDir: true,
      rootDir: true,
    },
    outputDir: ".next",
    rootDir: "./",
    port: 3000,
    files: [],
    configFiles: [{ file: "next.config.ts", checkFor: ["NextConfig"] }],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: ["next.config.ts", "package.json"],
    tips: [
      {
        text: `To deploy you need to add the config "output: 'standalone'" in your next.config.js`,
        link: "https://nextjs.org/docs/pages/api-reference/config/next-config-js/output#automatically-copying-traced-files",
      },
    ],
  },
  express: {
    id: "express",
    name: "Express",
    language: "javascript",
    image: { type: "img", value: "/icons/Express.svg" },
    langs: ["javascript", "typescript"],
    userConfigurable: {
      buildCommand: {
        defaultEmpty: true,
      },
      installCommand: true,
      outputDir: true,
      rootDir: true,
      outputFileName: true,
    },
    outputDir: "./",
    rootDir: "./",
    outputFileName: "app.js",
    port: 3000,
    files: [],
    configFiles: [{ file: "package.json", checkFor: ["express"] }],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: ["package.json"],
  },
  fastapi: {
    id: "fastapi",
    name: "FastAPI",
    language: "python",
    image: { type: "img", value: "/icons/FastAPI.svg" },
    langs: ["python"],
    userConfigurable: {
      rootDir: true,
      installCommand: true,
      outputFileName: true,
    },
    rootDir: "./",
    outputFileName: "main.py",
    port: 8000,
    files: [],
    configFiles: [
      { file: "requirements.txt", checkFor: ["fastapi"] },
      { file: "pyproject.toml", checkFor: ["fastapi"] },
    ],
    supportedManagers: [
      { manager: "pip", requiredFiles: ["requirements.txt"] },
      { manager: "poetry", requiredFiles: ["pyproject.toml"] },
    ],
    defaultManager: "pip",
  },
  streamlit: {
    id: "streamlit",
    name: "Streamlit",
    language: "python",
    image: { type: "img", value: "/icons/Streamlit.svg" },
    langs: ["python"],
    userConfigurable: {
      rootDir: true,
      installCommand: true,
      outputFileName: true,
    },
    rootDir: "./",
    outputFileName: "app.py",
    port: 8501,
    files: [],
    configFiles: [
      { file: "requirements.txt", checkFor: ["streamlit"] },
      { file: "pyproject.toml", checkFor: ["streamlit"] },
    ],
    supportedManagers: [
      { manager: "pip", requiredFiles: ["requirements.txt"] },
      { manager: "poetry", requiredFiles: ["pyproject.toml"] },
    ],
    defaultManager: "pip",
  },
  unknown: {
    id: "unknown",
    name: "Unknown Framework",
    language: "javascript",
    image: { type: "icon", value: "mdi-help-circle-outline" },
    outputDir: "dist",
    rootDir: "./",
    port: 3000,
    supportedManagers: [],
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
    buildCommand: !framework.userConfigurable?.buildCommand?.defaultEmpty
      ? managerConfig.commands.build
      : undefined,
    outputFileName: framework.outputFileName,
    outputDir: framework.outputDir || "",
    rootDir: framework.rootDir || "./",
    port: framework.port || 3000,
    files: framework.files || [],
  };
};

// Helper to get supported frameworks
export const getSupportedFrameworks = (): AcceptedFramework[] => {
  return Object.keys(frameworksConfig).filter(
    (framework) => framework !== "unknown"
  ) as AcceptedFramework[];
};
