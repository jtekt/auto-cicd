import type { FrameworkConfig } from "@/types/app-config";

export const streamlitConfig: FrameworkConfig = {
  id: "streamlit",
  name: "Streamlit",
  language: "python",
  image: { type: "img", value: "/icons/Streamlit.svg" },
  langs: ["python"],
  userConfigurable: {
    installCommand: { defaultEmpty: false },
    outputFile: { defaultEmpty: false },
    port: { defaultEmpty: false },
  },
  outputFile: "app.py",
  port: 8501,
  files: [],
  configFiles: [
    { file: ["requirements.txt"], checkFor: ["streamlit"] },
    // { file: ["pyproject.toml"], checkFor: ["streamlit"] },
  ],
  supportedManagers: [
    { manager: "pip", requiredFiles: ["requirements.txt"] },
    // { manager: "poetry", requiredFiles: ["pyproject.toml"] },
  ],
  defaultManager: "pip",
};
