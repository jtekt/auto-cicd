import type {
  AcceptedFramework,
  AcceptedPackageManager,
  DefaultInjectedFiles,
  FrameworkConfig,
  ManagedFile,
  OptionalFiles,
  PackageManagerConfig,
} from "@/types/app-config";

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
  unknown: {
    name: "unknown",
    commands: { install: "" },
    detectionFiles: [],
  },

  // poetry: {
  //   name: "poetry",
  //   commands: { install: "poetry install --no-dev" },
  //   detectionFiles: [{ file: "pyproject.toml" }],
  // },
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
  },
  fastapi: {
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
  },
  streamlit: {
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
  },

  // Template for new frameworks (e.g., add SvelteKit like this):
  // sveltekit: {
  //   id: "sveltekit",
  //   name: "SvelteKit",
  //   language: "javascript",
  //   image: { type: "img", value: "/icons/Svelte.svg" },
  //   langs: ["typescript", "javascript"],
  //   userConfigurable: {
  //     buildCommand: { defaultEmpty: false },
  //     installCommand: { defaultEmpty: false },
  //   },
  //   outputFile: "build/index.js", // Adapter-dependent
  //   port: 3000,
  //   deployType: "server", // New field: "static" | "server" | "hybrid" for K8s manifest gen
  //   files: ["svelte.config.js"], // Framework-specific injections
  //   configFiles: [
  //     {
  //       file: ["svelte.config.js", "svelte.config.ts"],
  //       checkFor: ["config", "vite"], // Strings to grep for detection
  //     },
  //   ],
  //   supportedManagers: [ // Optional: defaults to JS if language="javascript"
  //     { manager: "npm", requiredFiles: ["package-lock.json"] },
  //     { manager: "yarn", requiredFiles: ["yarn.lock"] },
  //   ],
  //   defaultManager: "npm",
  //   requiredFiles: [
  //     ["svelte.config.js", "svelte.config.ts"],
  //     "package.json",
  //   ],
  // },

  unknown: {
    id: "unknown",
    name: "Unknown Framework",
    language: "javascript",
    image: { type: "icon", value: "mdi-help-circle-outline" },
    outputFile: "index.js",
    port: 3000,
    supportedManagers: [],
    defaultManager: "npm",
  },
};

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
  isDetectionFile: boolean;
  checks?: Array<{ framework: AcceptedFramework; strings: string[] }>;
  alwaysFetch?: boolean; // e.g., for defaults like Dockerfile
};

export const getConfigFiles = (lang?: string): ConfigFileInfo[] => {
  const fileMap = new Map<string, ConfigFileInfo>(); // Use Map for easy merging

  // Add always-fetch defaults (injected files)
  defaultInjectedFiles.forEach((file) => {
    fileMap.set(file, { file, isDetectionFile: false, alwaysFetch: true });
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

    // Track detection checks (key improvement: per-file, per-framework strings)
    if (frameworkConfig.configFiles) {
      frameworkConfig.configFiles.forEach((configEntry) => {
        configEntry.file.forEach((filePath) => {
          if (!fileMap.has(filePath)) {
            fileMap.set(filePath, { file: filePath, isDetectionFile: true });
          }
          const info = fileMap.get(filePath)!;
          if (!info.checks) info.checks = [];
          info.checks!.push({ framework, strings: configEntry.checkFor });
        });
      });
    }

    // Add output file (if configurable, but always include for deploy)
    if (frameworkConfig.outputFile) {
      const info = fileMap.get(frameworkConfig.outputFile) || {
        file: frameworkConfig.outputFile,
        isDetectionFile: false,
      };
      fileMap.set(frameworkConfig.outputFile, info);
    }

    // Add required files
    if (frameworkConfig.requiredFiles) {
      frameworkConfig.requiredFiles.forEach((requiredFile) => {
        const filesToAdd = Array.isArray(requiredFile)
          ? requiredFile
          : [requiredFile];
        filesToAdd.forEach((filePath) => {
          if (!fileMap.has(filePath)) {
            fileMap.set(filePath, { file: filePath, isDetectionFile: false });
          }
        });
      });
    }

    // Add complementary files
    if (frameworkConfig.files) {
      frameworkConfig.files.forEach((f) => {
        if (!fileMap.has(f)) {
          fileMap.set(f, { file: f, isDetectionFile: false });
        }
      });
    }

    // Add manager detection files
    frameworkConfig.supportedManagers.forEach((manager) => {
      const pmConfig = packageManagers[manager.manager];
      if (pmConfig) {
        pmConfig.detectionFiles.forEach((df) => {
          if (!fileMap.has(df.file)) {
            fileMap.set(df.file, { file: df.file, isDetectionFile: true });
          }
          // Optionally add checks here if managers have string-based detection
        });
      }
    });
  });

  // Convert to array, sorted for consistency
  return Array.from(fileMap.values()).sort((a, b) =>
    a.file.localeCompare(b.file)
  );
};
