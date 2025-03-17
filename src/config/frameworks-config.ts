import type {
  AcceptedFramework,
  AcceptedPackageManager,
  FrameworkConfig,
  PackageManagerConfig,
} from "@/types/app-config";

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
      install: "corepack enable pnpm && pnpm i",
      build: "corepack enable pnpm && pnpm run build",
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
    configFiles: [
      {
        file: [
          "vite.config.ts",
          "vite.config.mts",
          "vite.config.js",
          "vite.config.mjs",
        ],
        checkFor: ["defineConfig"],
      },
    ],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: [
      [
        "vite.config.ts",
        "vite.config.mts",
        "vite.config.js",
        "vite.config.mjs",
      ],
      "package.json",
    ],
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
    configFiles: [
      {
        file: [
          "nuxt.config.ts",
          "nuxt.config.mts",
          "nuxt.config.js",
          "nuxt.config.mjs",
        ],
        checkFor: ["defineNuxtConfig"],
      },
    ],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: [
      [
        "nuxt.config.ts",
        "nuxt.config.mts",
        "nuxt.config.js",
        "nuxt.config.mjs",
      ],
      "package.json",
    ],
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
    configFiles: [
      {
        file: [
          "next.config.ts",
          "next.config.mts",
          "next.config.js",
          "next.config.mjs",
        ],
        checkFor: ["NextConfig"],
      },
    ],
    supportedManagers: [
      { manager: "npm", requiredFiles: ["package-lock.json"] },
      { manager: "yarn", requiredFiles: ["yarn.lock"] },
      { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
    ],
    defaultManager: "npm",
    requiredFiles: [
      [
        "next.config.ts",
        "next.config.mts",
        "next.config.js",
        "next.config.mjs",
      ],
      "package.json",
    ],
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
    configFiles: [{ file: ["package.json"], checkFor: ["express"] }],
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
      { file: ["requirements.txt"], checkFor: ["fastapi"] },
      { file: ["pyproject.toml"], checkFor: ["fastapi"] },
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
      { file: ["requirements.txt"], checkFor: ["streamlit"] },
      { file: ["pyproject.toml"], checkFor: ["streamlit"] },
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
