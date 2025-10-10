import type { FrameworkConfig } from "@/types/app-config";

export const nextConfig: FrameworkConfig = {
  id: "nextjs",
  name: "NextJs",
  language: "javascript",
  image: { type: "img", value: "/icons/Nextjs.svg" },
  langs: ["tsx", "jsx", "typescript", "javascript"],
  userConfigurable: {
    buildCommand: { defaultEmpty: false },
    installCommand: { defaultEmpty: false },
  },
  outputFile: ".next/server.js",
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
    ["next.config.ts", "next.config.mts", "next.config.js", "next.config.mjs"],
    "package.json",
  ],
  tips: [
    {
      text: `To deploy you need to add the config "output: 'standalone'" in your next.config.js`,
      link: "https://nextjs.org/docs/pages/api-reference/config/next-config-js/output#automatically-copying-traced-files",
    },
  ],
};
