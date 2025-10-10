import type { FrameworkConfig } from "@/types/app-config";

export const nuxtConfig: FrameworkConfig = {
  id: "nuxt",
  name: "Nuxt",
  language: "javascript",
  image: { type: "img", value: "/icons/Nuxt.svg" },
  langs: ["vue", "typescript", "javascript"],
  userConfigurable: {
    buildCommand: { defaultEmpty: false },
    installCommand: { defaultEmpty: false },
  },
  outputFile: "/app/server/index.mjs",
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
    ["nuxt.config.ts", "nuxt.config.mts", "nuxt.config.js", "nuxt.config.mjs"],
    "package.json",
  ],
};
