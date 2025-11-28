import config from "./index";

export const envKey = "ENV"; // Name of the file saved in gitlab with the envs

export const packageManagers = config.packageManagers;

export const frameworksConfig = config.frameworks;

export const acceptedFrameworks = Object.keys(frameworksConfig);

export type ConfigFileInfo = {
  file: string;
  checks?: Array<{ framework: string; strings: string[] }>;
  detectedFrameworks?: Set<string>; // Unique frameworks this file helps detect (for checks)
  requiredFor?: Set<string>; // Frameworks that require this file's existence
  alwaysFetch?: boolean; // e.g., for defaults like Dockerfile
};

export const getConfigFiles = (lang?: string): ConfigFileInfo[] => {
  const fileMap = new Map<string, ConfigFileInfo>(); // Use Map for easy merging

  // Process frameworks
  Object.entries(frameworksConfig).forEach(([frameworkId, frameworkConfig]) => {
    const framework = frameworkId;
    if (lang && !frameworkConfig.languages?.includes(lang)) return;

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
                strings: df.checkFor,
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
