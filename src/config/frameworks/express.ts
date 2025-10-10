import type { FrameworkConfig } from "@/types/app-config";

export const expressConfig: FrameworkConfig = {
  id: "express",
  name: "Express",
  language: "javascript",
  image: { type: "img", value: "/icons/Express.svg" },
  langs: ["javascript", "typescript"],
  userConfigurable: {
    buildCommand: { defaultEmpty: true },
    installCommand: { defaultEmpty: false },
    outputFile: { defaultEmpty: false },
    port: { defaultEmpty: false },
  },
  outputFile: "app.js",
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
};
