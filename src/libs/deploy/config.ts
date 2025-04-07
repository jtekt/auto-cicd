import { frameworksConfig, packageManagers } from "@/config/frameworks-config";
import type {
  AcceptedFramework,
  AcceptedPackageManager,
  ProjectConfig,
} from "@/types/app-config";

// Helper to get default ProjectConfig
export const getDefaultProjectConfig = (
  frameworkId: AcceptedFramework,
  managerName?: AcceptedPackageManager
): ProjectConfig => {
  const framework = frameworksConfig[frameworkId];
  const manager =
    managerName &&
    framework.supportedManagers.find((sm) => sm.manager === managerName)
      ? managerName
      : framework.defaultManager;
  const managerConfig = packageManagers[manager];

  return {
    language: framework.language,
    framework: framework.id,
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

// Helper to get supported frameworks
export const getSupportedFrameworks = (): AcceptedFramework[] => {
  return Object.keys(frameworksConfig).filter(
    (framework) => framework !== "unknown"
  ) as AcceptedFramework[];
};
