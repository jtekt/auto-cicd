import type { FrameworkConfig } from "@/types/app-config";

export const viteConfig: FrameworkConfig = {
  id: "vite",
  name: "Vite",
  language: "javascript",
  image: { type: "img", value: "/icons/Vite.js.svg" },
  langs: ["vue", "typescript", "javascript", "tsx", "jsx"],
  userConfigurable: {
    buildCommand: { defaultEmpty: false },
    installCommand: { defaultEmpty: false },
  },
  outputFile: "dist/index.html",
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
    ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"],
    "package.json",
  ],
};
