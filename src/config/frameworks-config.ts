import type { ProjectConfig } from "@/components/DeployHandler.vue";

export type AcceptedFrameworks = "vite" | "nuxt" | "unknown";

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
    files: [],
  },
};

export default frameworksConfig;
