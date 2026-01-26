import type { TemplateSource } from "@/types/config";
import { getConfig } from ".";
import { resolveOutputFileName } from "@/utils/file";

export const envKey = "ENV"; // Environment file name

/**
 * Config file info used by detection
 */
export type ConfigFileInfo = {
  file: string;
  checks?: Array<{ framework: string; patterns: (string | RegExp)[] }>;
  detectedFrameworks?: Set<string>;
  requiredFor?: Set<string>;
};

/**
 * Returns a merged list of all config files relevant to the language/framework.
 */
export const getConfigFiles = (lang?: string): ConfigFileInfo[] => {
  const config = getConfig();

  if (!config) throw new Error("Config not found");

  const fileMap = new Map<string, ConfigFileInfo>();

  Object.entries(config.frameworks).forEach(
    ([frameworkId, frameworkConfig]) => {
      const framework = frameworkId;

      if (lang && !frameworkConfig.languages?.includes(lang)) return;

      // ----------------------------------------
      // 1. Framework configFiles (checks)
      // ----------------------------------------
      if (frameworkConfig.configFiles) {
        frameworkConfig.configFiles.forEach((configEntry) => {
          configEntry.file.forEach((filePath) => {
            if (!fileMap.has(filePath)) {
              fileMap.set(filePath, { file: filePath });
            }
            const info = fileMap.get(filePath)!;

            if (!info.checks) info.checks = [];
            info.checks.push({
              framework,
              patterns: configEntry.checkFor,
            });

            if (!info.detectedFrameworks) info.detectedFrameworks = new Set();
            info.detectedFrameworks.add(framework);
          });
        });
      }

      // ----------------------------------------
      // 2. Add output file (always relevant)
      // ----------------------------------------
      if (frameworkConfig.outputFile) {
        const path = frameworkConfig.outputFile;
        if (!fileMap.has(path)) {
          fileMap.set(path, { file: path });
        }
      }

      // ----------------------------------------
      // 3. Add required files
      // ----------------------------------------
      if (frameworkConfig.requiredFiles) {
        frameworkConfig.requiredFiles.forEach((requiredFile) => {
          const arr = Array.isArray(requiredFile)
            ? requiredFile
            : [requiredFile];

          arr.forEach((filePath) => {
            if (!fileMap.has(filePath)) {
              fileMap.set(filePath, { file: filePath });
            }

            const info = fileMap.get(filePath)!;

            if (!info.requiredFor) info.requiredFor = new Set();
            info.requiredFor.add(framework);
          });
        });
      }

      // ----------------------------------------
      // 4. Add complementary template files (NEW BEHAVIOR)
      //    Convert TemplateSource → filename
      // ----------------------------------------
      if (frameworkConfig.files) {
        frameworkConfig.files.forEach((source: TemplateSource) => {
          const fileName = resolveOutputFileName(source);
          if (!fileName) return;

          if (!fileMap.has(fileName)) {
            fileMap.set(fileName, {
              file: fileName,
            });
          }
        });
      }

      // ----------------------------------------
      // 5. Add package manager detection files
      // ----------------------------------------
      frameworkConfig.supportedManagers.forEach((manager) => {
        const pmConfig = config?.packageManagers[manager.manager];
        if (!pmConfig) return;

        pmConfig.detectionFiles.forEach((df) => {
          if (!fileMap.has(df.file)) {
            fileMap.set(df.file, { file: df.file });
          }

          const info = fileMap.get(df.file)!;

          if (df.checkFor) {
            if (!info.checks) info.checks = [];

            info.checks.push({
              framework, // PM checks count toward framework scoring
              patterns: df.checkFor,
            });

            if (!info.detectedFrameworks) info.detectedFrameworks = new Set();
            info.detectedFrameworks.add(framework);
          }
        });
      });
    },
  );

  // Convert to array and sort for consistency
  return Array.from(fileMap.values()).sort((a, b) =>
    a.file.localeCompare(b.file),
  );
};
