import type { FrameworkConfig } from "@/types/app-config";

export const fastapiConfig: FrameworkConfig = {
  id: "fastapi",
  name: "FastAPI",
  language: "python",
  image: { type: "img", value: "/icons/FastAPI.svg" },
  langs: ["python"],
  userConfigurable: {
    installCommand: { defaultEmpty: false },
    outputFile: { defaultEmpty: false },
    port: { defaultEmpty: false },
  },
  outputFile: "main.py",
  port: 8000,
  files: [],
  configFiles: [
    { file: ["requirements.txt"], checkFor: ["fastapi"] },
    // { file: ["pyproject.toml"], checkFor: ["fastapi"] },
  ],
  supportedManagers: [
    { manager: "pip", requiredFiles: ["requirements.txt"] },
    // { manager: "poetry", requiredFiles: ["pyproject.toml"] },
  ],
  defaultManager: "pip",
};
