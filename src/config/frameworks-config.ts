import type {
  AcceptedFramework,
  AcceptedPackageManager,
  DefaultInjectedFiles,
  FrameworkConfig,
  ManagedFile,
  OptionalFiles,
  PackageManagerConfig,
} from "@/types/app-config";

// Import individual framework configs
import { viteConfig } from "./frameworks/vite";
import { nuxtConfig } from "./frameworks/nuxt";
import { nextConfig } from "./frameworks/next";
import { expressConfig } from "./frameworks/express";
import { streamlitConfig } from "./frameworks/streamlit";
import { fastapiConfig } from "./frameworks/fastapi";

export const envKey = "ENV"; // Name of the file saved in gitlab with the envs

export const defaultInjectedFiles: DefaultInjectedFiles[] = [
  "Dockerfile",
  ".gitlab-ci.yml",
  "kubernetes_manifest.yml",
];

export const extraInjectedFiles: OptionalFiles[] = ["nginx.conf"];

export const managedFiles: ManagedFile[] = [
  ...defaultInjectedFiles,
  ...extraInjectedFiles,
];

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
};

export const frameworksConfig: Record<AcceptedFramework, FrameworkConfig> = {
  vite: viteConfig,
  nuxt: nuxtConfig,
  nextjs: nextConfig,
  express: expressConfig,
  fastapi: fastapiConfig,
  streamlit: streamlitConfig,
};

export const acceptedFrameworks = Object.keys(
  frameworksConfig
) as AcceptedFramework[];

// Helper to get default supported managers based on language
const getDefaultSupportedManagers = (
  language: string
): FrameworkConfig["supportedManagers"] => {
  if (language === "python") {
    return [{ manager: "pip", requiredFiles: ["requirements.txt"] }];
  }
  return [
    { manager: "npm", requiredFiles: ["package-lock.json"] },
    { manager: "yarn", requiredFiles: ["yarn.lock"] },
    { manager: "pnpm", requiredFiles: ["pnpm-lock.yaml"] },
  ];
};

// Validate configs on load (call in your app init)
export const validateConfigs = (): void => {
  Object.values(frameworksConfig).forEach((config) => {
    if (!config.id || !config.name) {
      throw new Error(`Invalid config for ${config.id}: missing id/name`);
    }
    // Add more checks as needed (e.g., supportedManagers align with language)
  });
};

export type ConfigFileInfo = {
  file: string;
  checks?: Array<{ framework: AcceptedFramework; strings: string[] }>;
  detectedFrameworks?: Set<AcceptedFramework>; // Unique frameworks this file helps detect (for checks)
  requiredFor?: Set<AcceptedFramework>; // Frameworks that require this file's existence
  alwaysFetch?: boolean; // e.g., for defaults like Dockerfile
};

export const getConfigFiles = (lang?: string): ConfigFileInfo[] => {
  const fileMap = new Map<string, ConfigFileInfo>(); // Use Map for easy merging

  // Add always-fetch defaults (injected files)
  defaultInjectedFiles.forEach((file) => {
    fileMap.set(file, { file, alwaysFetch: true });
  });

  // Process frameworks
  Object.entries(frameworksConfig).forEach(([frameworkId, frameworkConfig]) => {
    const framework = frameworkId as AcceptedFramework;
    if (lang && !frameworkConfig.langs?.includes(lang)) return;

    // Ensure supportedManagers if missing
    if (!frameworkConfig.supportedManagers?.length) {
      frameworkConfig.supportedManagers = getDefaultSupportedManagers(
        frameworkConfig.language
      );
    }

    // Track detection checks (per-file, per-framework strings)
    if (frameworkConfig.configFiles) {
      frameworkConfig.configFiles.forEach((configEntry) => {
        configEntry.file.forEach((filePath) => {
          if (!fileMap.has(filePath)) {
            fileMap.set(filePath, { file: filePath });
          }

          const info = fileMap.get(filePath)!;
          if (!info.checks) info.checks = [];
          info.checks!.push({ framework, strings: configEntry.checkFor });

          // Track unique detected frameworks with Set
          if (!info.detectedFrameworks) info.detectedFrameworks = new Set();
          info.detectedFrameworks.add(framework);
        });
      });
    }

    // Add output file (always include for deploy, no detection)
    if (frameworkConfig.outputFile) {
      if (!fileMap.has(frameworkConfig.outputFile)) {
        fileMap.set(frameworkConfig.outputFile, {
          file: frameworkConfig.outputFile,
        });
      }
    }

    // Add required files (existence check, no content unless already marked)
    if (frameworkConfig.requiredFiles) {
      frameworkConfig.requiredFiles.forEach((requiredFile) => {
        const filesToAdd = Array.isArray(requiredFile)
          ? requiredFile
          : [requiredFile];
        filesToAdd.forEach((filePath) => {
          if (!fileMap.has(filePath)) {
            fileMap.set(filePath, { file: filePath });
          }
          const info = fileMap.get(filePath)!;
          if (!info.requiredFor) info.requiredFor = new Set();
          info.requiredFor.add(framework);
        });
      });
    }

    // Add complementary files (no detection)
    if (frameworkConfig.files) {
      frameworkConfig.files.forEach((f) => {
        if (!fileMap.has(f)) {
          fileMap.set(f, { file: f, alwaysFetch: true });
        }
      });
    }

    // Add manager detection files (existence primarily; content if checkFor)
    frameworkConfig.supportedManagers.forEach((manager) => {
      const pmConfig = packageManagers[manager.manager];
      if (pmConfig) {
        pmConfig.detectionFiles.forEach((df) => {
          if (!fileMap.has(df.file)) {
            fileMap.set(df.file, {
              file: df.file,
              // For PM, checks only if df.checkFor (rare, e.g., for poetry sections)
            });
          }
          const info = fileMap.get(df.file)!;
          if (df.checkFor && !info.checks) {
            info.checks = []; // Initialize if needed
          }
          if (df.checkFor) {
            // Add PM-specific check (use a special framework like 'pm-detection' or integrate into detection flow)
            // For now, add as generic check; adjust detection logic to handle PM separately
            if (info.checks) {
              info.checks.push({
                framework: framework, // Or a placeholder; PM is post-framework detection
                strings: [df.checkFor],
              });
              if (!info.detectedFrameworks) info.detectedFrameworks = new Set();
              info.detectedFrameworks.add(framework); // Tie to framework for simplicity
            }
          }
        });
      }
    });
  });

  // Convert to array, sorted for consistency
  return Array.from(fileMap.values()).sort((a, b) =>
    a.file.localeCompare(b.file)
  );
};
