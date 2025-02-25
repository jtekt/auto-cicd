export type AcceptedFrameworks = "vite" | "nuxt" | "unknown";

export type ManagedFile =
  | "Dockerfile"
  | ".gitlab-ci.yml"
  | "nginx.conf"
  | "kubernetes_manifest.yml";

export type ProjectConfig = {
  id: AcceptedFrameworks;
  name: string;
  image: {
    type: "img" | "icon";
    value: string;
  };

  // Config
  buildCommand?: string;
  installCommand?: string;
  outputDir?: string;
  rootDir?: string;
  port?: number;
  managers: string[];

  // Deploy
  files: ManagedFile[];

  // Framework-specific properties
  langs?: string[];
  configFiles?: {
    file: string;
    checkFor: string;
  }[];
};

export const acceptedJavascriptManagers = ["npm", "yarn"];

const frameworksConfig: Record<string, ProjectConfig> = {
  vite: {
    id: "vite",
    name: "Vite",
    image: {
      type: "img",
      value: "/icons/Vite.js.svg",
    },
    langs: ["vue", "typescript", "javascript", "tsx", "jsx"],
    buildCommand: "npm run build",
    installCommand: "npm install",
    outputDir: "dist",
    rootDir: "./",
    port: 80,
    managers: ["npm", "yarn"],
    files: [
      ".gitlab-ci.yml",
      "Dockerfile",
      "kubernetes_manifest.yml",
      "nginx.conf",
    ],
    configFiles: [
      {
        file: "package.json",
        checkFor: "vite",
      },
    ],
  },
  nuxt: {
    id: "nuxt",
    name: "Nuxt",
    image: {
      type: "img",
      value: "/icons/Nuxt.svg",
    },
    langs: ["vue", "typescript", "javascript"],
    buildCommand: "npm run build",
    installCommand: "npm install",
    outputDir: ".output",
    rootDir: "./",
    port: 80,
    managers: ["npm", "yarn"],
    files: [".gitlab-ci.yml", "Dockerfile", "kubernetes_manifest.yml"],
    configFiles: [
      {
        file: "package.json",
        checkFor: "nuxt",
      },
    ],
  },
  unknown: {
    id: "unknown",
    name: "Unknown Framework",
    image: {
      type: "icon",
      value: "mdi-help-circle-outline",
    },
    langs: [],
    buildCommand: "npm run build",
    installCommand: "npm install",
    outputDir: "dist",
    rootDir: "./",
    managers: [],
    files: [],
  },
};

export default frameworksConfig;
