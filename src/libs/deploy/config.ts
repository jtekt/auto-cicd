import { frameworksConfig, packageManagers } from "@/config/frameworks-config";
import type {
  ProjectConfig,
} from "@/types/app-config";

// Helper to get default ProjectConfig
export const getDefaultProjectConfig = (
  frameworkId: string,
  managerName?: string
): ProjectConfig => {
  const framework = frameworksConfig[frameworkId];

  if(!framework) throw new Error("No framework found")

  const manager =
    managerName &&
    framework.supportedManagers.find((sm) => sm.manager === managerName)
      ? managerName
      : framework.defaultManager;

  const managerConfig = packageManagers[manager];

  if(!managerConfig) throw new Error("No manager found")

  return {
    language: framework.languages[0]!,
    framework: frameworkId,
    manager: manager,
    installCommand: managerConfig.commands.install,
    buildCommand: !framework.userConfigurable?.buildCommand?.defaultEmpty
      ? managerConfig.commands.build
      : undefined,
    outputFile: framework.outputFile,
    port: framework.port || 3000,
    files: framework.files || [],
  };
};
