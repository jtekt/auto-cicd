import type { ProjectConfig } from "@/components/DeployHandler.vue";

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
    configFile: "package.json",
    checkFor: "vite",
  },
  // fastapi: {
  //   id: "fastapi",
  //   name: "FastAPI",
  //   image: {
  //     type: "img",
  //     value: "/icons/FastAPI.svg",
  //   },
  //   langs: ["python"],
  //   buildCommand: "uvicorn app:app --reload",
  //   installCommand: "pip install -r requirements.txt",
  //   outputDir: "static",
  //   rootDir: "./",
  //   files: [".gitlab-ci.yml", "Dockerfile", "kubernetes_manifest.yml"],
  //   configFiles: ["requirements.txt", "setup.py"],
  //   checkFor: "fastapi",
  // },
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
