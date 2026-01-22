import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import axios from "axios";
import type { ProjectNode } from "@/types/project";
import { generateFiles } from "@/libs/templates";
import {
  getEnvs,
  getGitLabFiles,
  updateEnvs,
  type CommitAction,
  type CommitActionObject,
  type GitLabFile,
} from "@/libs/gitlab";
import { getConfigFiles } from "@/config/frameworks-config";
import { getDefaultProjectConfig } from "@/libs/deploy/config";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/stores/toast";
import { useI18n } from "vue-i18n";
import type { ProjectConfig } from "@/types/app-config";
import { DEFAULT_FILES, getConfig } from "@/config";
import type { FrameworkConfigType } from "@/types/config";
import { normalizeContent } from "@/utils/file";

type Env = {
  key: string;
  value: string;
  visible: boolean;
  protected?: boolean;
};

export const useDeployStore = defineStore("deploy", () => {
  const config = getConfig();
  const authStore = useAuthStore();
  const toast = useToast();
  const { t } = useI18n();

  const project = ref<ProjectNode | null>(null);

  // Select models
  const frameworkSelector = ref<string>();
  const managerSelector = ref<string>();

  // Dialogs models
  const deployDialog = ref(false);
  const confirmDeployDialog = ref(false);
  const nextStepsDialog = ref(false);

  // State
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const projectConfig = ref<ProjectConfig>();

  // Environment variables
  const environmentVariables = ref<Env[]>([]);
  const originalEnvironmentVariables = ref<Env[]>([]);

  // Files to be committed
  type InjectFile = {
    fileName: string;
    content: string;
    action: CommitAction;
    isChecked: boolean;
  };

  const injectFiles = ref<InjectFile[]>([]);

  // Files in the repository
  const repositoryFiles = ref<GitLabFile[]>([]);

  // Error messages and deployment info
  const deploymentInfo = ref<{
    filesCommitted: string[];
    envs: boolean;
    messages: string[];
    errors: string[];
  } | null>(null);

  // Computed properties
  const frameworks = computed(() =>
    Object.entries(config ? config.frameworks : {}).map(([id, value]) => ({
      id,
      ...value,
    })),
  );

  const currentProjectFrameworkConfig = computed(() => {
    if (!projectConfig.value) return;
    return config?.frameworks[projectConfig.value.framework];
  });

  const packageManagersOptions = computed(() => {
    if (!currentProjectFrameworkConfig.value) return [];

    return currentProjectFrameworkConfig.value.supportedManagers.map((m) => ({
      title: m.manager,
      value: m.manager,
    }));
  });

  const filesMightHaveMissed = computed<(string | string[])[]>(() => {
    if (!project.value || !currentProjectFrameworkConfig.value) return [];

    const requiredByFramework =
      currentProjectFrameworkConfig.value.requiredFiles || [];
    const requiredByPackageManager =
      currentProjectFrameworkConfig.value.supportedManagers.find(
        (sm) => sm.manager === projectConfig.value?.manager,
      )?.requiredFiles || [];
    const requiredFilesForConfig = [
      ...new Set([...requiredByFramework, ...requiredByPackageManager]),
    ];

    return requiredFilesForConfig.filter(
      (f) =>
        !repositoryFiles.value.find((id) => {
          if (typeof f === "string") return id.fileName === f;
          return f.find((fc) => id.fileName === fc);
        }),
    );
  });

  const isOutputFileInvalid = computed(() => {
    // If has buildCommand, outputFile is not required
    if (projectConfig.value?.buildCommand) return false;

    return !repositoryFiles.value.find(
      (f) => f.fileName === projectConfig.value?.outputFile,
    );
  });

  const envChanges = computed(() => {
    let e: { added: Env[]; modified: Env[]; removed: Env[] } = {
      added: [],
      modified: [],
      removed: [],
    };

    environmentVariables.value.forEach((newEnv) => {
      const origEnv = originalEnvironmentVariables.value.find(
        (e) => e.key === newEnv.key,
      );
      if (!origEnv) e.added.push(newEnv);
      else if (origEnv.value !== newEnv.value) e.modified.push(newEnv);
    });

    e.removed = originalEnvironmentVariables.value.filter(
      (origEnv) =>
        !environmentVariables.value.some(
          (newEnv) => newEnv.key === origEnv.key,
        ),
    );

    return e;
  });

  // Sync selectors with projectConfig
  watch(
    () => frameworkSelector.value,
    (newFramework) => {
      if (!config || newFramework === projectConfig.value?.framework) {
        return;
      } else if (!newFramework) {
        reset();

        return;
      }

      const newFrameworkConfig = config.frameworks[newFramework];

      if (!newFrameworkConfig) throw new Error("No framework set");

      // Update projectConfig with the new framework
      projectConfig.value = getDefaultProjectConfig(
        newFramework,
        managerSelector.value,
      );

      // Check if the selected manager is supported by the new framework
      const supportedManagers = newFrameworkConfig.supportedManagers.map(
        (m) => m.manager,
      );

      if (
        !managerSelector.value ||
        !supportedManagers.includes(managerSelector.value)
      ) {
        managerSelector.value = newFrameworkConfig.defaultManager;
        projectConfig.value.manager = managerSelector.value;
      }
    },
  );

  watch(
    () => managerSelector.value,
    (newManager) => {
      if (
        newManager &&
        projectConfig.value &&
        newManager !== projectConfig.value.manager
      ) {
        projectConfig.value.manager = newManager;
      }
    },
  );

  // Actions
  async function openDeployment(selectedProject: ProjectNode) {
    isLoading.value = true;
    project.value = selectedProject;

    if (!authStore.session || !project.value) {
      toast.error(t("components.deployHandler.script.errors.unauthorized"));
      isLoading.value = false;
      return;
    }

    deployDialog.value = true;

    // Reset state
    error.value = null;
    deploymentInfo.value = null;
    injectFiles.value = [];
    projectConfig.value = undefined;
    frameworkSelector.value = undefined;
    managerSelector.value = undefined;
    repositoryFiles.value = [];

    // Get current envs
    const envs = await getEnvs({
      access_token: authStore.session.auth_token.access_token,
      project: project.value,
    }).then((res) => {
      if (res.success) return res.data;
      return [];
    });
    originalEnvironmentVariables.value = JSON.parse(JSON.stringify(envs));
    environmentVariables.value = JSON.parse(JSON.stringify(envs));

    const detectedConfig = await identifyProject();

    projectConfig.value = detectedConfig;
    frameworkSelector.value = detectedConfig?.framework;
    managerSelector.value = detectedConfig?.manager;

    isLoading.value = false;
  }

  async function handleDeploy() {
    if (!authStore.session || !project.value) {
      toast.error(t("components.deployHandler.script.errors.unauthorized"));
      return;
    }

    if (!projectConfig.value) {
      toast.error(t("components.deployHandler.script.errors.missingConfig"));
      return;
    }

    // Validate envs
    const invalidEnvs = environmentVariables.value.filter(
      (e) => !e.key || !e.value,
    );
    if (invalidEnvs.length) {
      toast.error(
        t("components.deployHandler.script.errors.invalidEnvs", {
          keys: invalidEnvs.map((e) => e.key).join(", "),
        }),
      );
      return;
    }

    isLoading.value = true;
    injectFiles.value = [];

    const generated = await generateFiles(
      authStore.session.auth_token.access_token,
      projectConfig.value,
      project.value,
      authStore.session.user.nickname,
    );

    if (!generated.success) {
      toast.error(
        t("components.deployHandler.script.errors.fileGenerationFailed", {
          error: generated.error,
        }),
      );
      isLoading.value = false;
      return;
    }

    // Compute commit actions
    const repo = repositoryFiles.value;

    injectFiles.value = generated.content
      .map<InjectFile | null>((file) => {
        const existing = repo.find((r) => r.fileName === file.fileName);

        if (!existing) {
          return {
            fileName: file.fileName,
            content: file.content,
            action: "create",
            isChecked: true,
          } as InjectFile;
        }

        const existingContent = normalizeContent(existing.content);
        const newContent = normalizeContent(file.content);

        const isMatch = existingContent === newContent;
        if (!isMatch) {
          return {
            fileName: file.fileName,
            content: file.content,
            action: "update",
            isChecked: true,
          } as InjectFile;
        }

        return null;
      })
      .filter((v): v is InjectFile => v !== null); // Remove nulls correctly

    isLoading.value = false;
    confirmDeployDialog.value = true;
  }

  async function confirmDeploy() {
    if (!authStore.session || !project.value) {
      toast.error(t("components.deployHandler.script.errors.unauthorized"));
      return;
    }

    confirmDeployDialog.value = false;
    isLoading.value = true;

    const encodeBase64 = (str: string) =>
      btoa(
        new TextEncoder()
          .encode(str)
          .reduce((data, byte) => data + String.fromCharCode(byte), ""),
      );

    const result: {
      env?: { success: boolean; error?: string };
      commit?: { success: boolean; error?: string };
    } = {};
    const actions = {
      commit: injectFiles.value.reduce<CommitActionObject[]>((acc, f) => {
        if (f.isChecked) {
          acc.push({
            action: f.action || "create",
            file_path: f.fileName,
            content: encodeBase64(f.content),
            encoding: "base64",
          });
        }
        return acc;
      }, []),
      env:
        originalEnvironmentVariables.value.length > 0 ||
        environmentVariables.value.length > 0,
    };

    if (actions.commit.length) {
      const commitToastId = toast.loading("Committing files...");
      try {
        const commitUrl = `${
          import.meta.env.VITE_APP_GITLAB_URL
        }/api/v4/projects/${project.value.id}/repository/commits`;
        await axios.post(
          commitUrl,
          {
            branch: project.value.repository.rootRef,
            commit_message: `[AUTO-CICD] generate deployment files`,
            actions: actions.commit,
          },
          {
            headers: {
              Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
            },
          },
        );
        result.commit = { success: true };

        // Update the repository files with the new content
        project.value.deploymentFiles = injectFiles.value.map((f) => ({
          name: f.fileName,
          rawTextBlob: f.content,
        }));

        toast.success(
          t("components.deployHandler.script.success.commitSuccess"),
          {
            id: commitToastId,
          },
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        result.commit = { success: false, error: errorMessage };
        toast.error(t("components.deployHandler.script.errors.commitFailed"), {
          id: commitToastId,
        });
        console.error("Commit error:", err);
      }
    }

    if (actions.env) {
      const envToastId = toast.loading("Updating environment variables...");

      try {
        await updateEnvs({
          access_token: authStore.session.auth_token.access_token,
          project: project.value,
          envsUpdate: environmentVariables.value,
        });
        result.env = { success: true };
        toast.success(
          t("components.deployHandler.script.success.envUpdateSuccess"),
          {
            id: envToastId,
          },
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        result.env = { success: false, error: errorMessage };
        toast.error(
          t("components.deployHandler.script.errors.envUpdateFailed"),
          {
            id: envToastId,
          },
        );
        console.error("Env update error:", err);
      }
    }

    deploymentInfo.value = {
      filesCommitted: result.commit?.success
        ? actions.commit.map((c) => c.file_path)
        : [],
      envs: result.env?.success ?? false,
      messages: [],
      errors: [],
    };

    const hasCommitAttempt = actions.commit.length > 0;
    const hasEnvAttempt = actions.env;
    const commitSuccess = result.commit?.success ?? !hasCommitAttempt;
    const envSuccess = result.env?.success ?? !hasEnvAttempt;

    if (commitSuccess && envSuccess) {
      if (hasCommitAttempt) {
        deploymentInfo.value.messages.push(
          t("components.deployHandler.script.success.deployMessages.deploying"),
          t(
            "components.deployHandler.script.success.deployMessages.firstDeploy",
          ),
          t(
            "components.deployHandler.script.success.deployMessages.trackProgress",
          ),
        );
      }
    } else {
      if (hasCommitAttempt && !result.commit?.success) {
        deploymentInfo.value.errors.push(
          `Failed to commit files: ${result.commit?.error || "Unknown error"}`,
        );
      }
      if (hasEnvAttempt && !result.env?.success) {
        deploymentInfo.value.errors.push(
          `Failed to update environment variables: ${
            result.env?.error || "Unknown error"
          }`,
        );
      }
    }

    isLoading.value = false;
    deployDialog.value = false;
    nextStepsDialog.value = true;
  }

  function cancelDeploy() {
    confirmDeployDialog.value = false;
  }

  async function identifyProject(): Promise<ProjectConfig | undefined> {
    if (!config || !project.value?.languages.length || !authStore.session) {
      return;
    }

    const mainLang = project.value.languages[0];
    if (!mainLang) return;

    // Filter config files by language for efficiency
    const configFiles = getConfigFiles(mainLang.name);
    if (!configFiles.length) return;

    const paths = configFiles.map((cf) => ({
      ...cf,
      project: project.value!,
    }));

    // Search for default files and dockerfile
    [...DEFAULT_FILES, "Dockerfile"].forEach((df) => {
      paths.push({
        file: df,
        project: project.value!,
        alwaysFetch: true,
      });
    });

    const filesResponse = await getGitLabFiles({
      access_token: authStore.session.auth_token.access_token,
      paths,
    });

    if (!filesResponse.success) {
      console.warn(
        "Failed to fetch files; falling back to unknown:",
        filesResponse.error,
      );
      return;
    }

    // Map fileName to content for quick lookup (handle optional content)
    const fileContents = new Map(
      filesResponse.data.map((f) => [f.fileName, f.content || null]),
    );

    repositoryFiles.value = filesResponse.data; // Keep for UI/other uses

    // Detection using structured checks
    const frameworkMatches: Map<string, number> = new Map(
      Object.keys(config.frameworks).map((framework) => [framework, 0]), // Key: framework, Value: initial score 0
    );

    configFiles.forEach((info) => {
      // Skip if file not fetched
      if (!fileContents.has(info.file)) {
        return;
      }

      // String-based scoring for files with checks (requires content)
      if (!info.checks || !info.checks.length) {
        return;
      }

      const content = fileContents.get(info.file);
      if (!content) {
        return;
      }

      // Existence-based scoring for required files
      if (info.requiredFor && info.requiredFor.size > 0) {
        info.requiredFor.forEach((framework) => {
          const currentScore = frameworkMatches.get(framework) ?? 0;

          // Required files gives 2 points
          frameworkMatches.set(framework, currentScore + 2);
        });
      }

      // Check each framework's indicators
      info.checks.forEach(({ framework, patterns }) => {
        const matches = patterns.some((pattern) => {
          if (pattern instanceof RegExp) {
            return pattern.test(content);
          }
          // fallback for plain strings
          return content.includes(pattern);
        });

        if (matches) {
          const currentScore = frameworkMatches.get(framework) ?? 0;
          frameworkMatches.set(framework, currentScore + 1);
        }
      });
    });

    // Find best match by highest score (skip 'unknown')
    let maxScore = -1;
    let bestFramework: string | null = null;
    for (const [framework, score] of frameworkMatches.entries()) {
      if (score <= maxScore) continue;
      maxScore = score;
      bestFramework = framework;
    }

    if (!bestFramework) {
      console.debug("No framework matched; defaulting to unknown");
      return;
    }

    const bestConfig = config.frameworks[bestFramework];

    if (!bestConfig) {
      console.debug("No framework matched; defaulting to unknown");
      return;
    }

    // Detect package manager using supportedManagers' requiredFiles
    const detectedManager = detectPackageManager(bestConfig, fileContents);
    const packageManager = detectedManager || bestConfig.defaultManager;

    return getDefaultProjectConfig(bestFramework, packageManager);
  }

  function detectPackageManager(
    frameworkConfig: FrameworkConfigType,
    fileContents: Map<string, string | null>,
  ): string | undefined {
    for (const {
      manager,
      requiredFiles,
    } of frameworkConfig.supportedManagers) {
      const hasAllRequired = requiredFiles.every((reqFile) => {
        const filesToCheck = Array.isArray(reqFile) ? reqFile : [reqFile];
        return filesToCheck.some((f) => fileContents.has(f)); // Existence check
      });
      if (hasAllRequired) {
        return manager;
      }
    }
    return undefined;
  }

  async function searchFile(file: string) {
    if (!authStore.session || !project.value) return;

    const filesData = await getGitLabFiles({
      access_token: authStore.session.auth_token.access_token,
      paths: [{ file, alwaysFetch: true, project: project.value }],
    });

    if (filesData.success && filesData.data.length === 1) {
      const fileData = filesData.data[0];

      if (!fileData) return;

      const existingFileIndex = repositoryFiles.value.findIndex(
        (f) => f.fileName === file,
      );

      if (existingFileIndex !== -1) {
        // Update existing file
        repositoryFiles.value[existingFileIndex] = {
          ...repositoryFiles.value[existingFileIndex],
          ...fileData,
        };
      } else {
        // Insert new file
        repositoryFiles.value.push(fileData);
      }
    }
  }

  function reset() {
    project.value = null;
    frameworkSelector.value = undefined;
    projectConfig.value = undefined;
    managerSelector.value = undefined;
  }

  return {
    currentProjectFrameworkConfig,
    project,
    deployDialog,
    confirmDeployDialog,
    nextStepsDialog,
    isLoading,
    error,
    projectConfig,
    injectFiles,
    deploymentInfo,
    frameworks,
    packageManagersOptions,
    filesMightHaveMissed,
    frameworkSelector,
    managerSelector,
    repositoryFiles,
    isOutputFileInvalid,
    envChanges,
    environmentVariables,
    originalEnvironmentVariables,
    openDeployment,
    handleDeploy,
    confirmDeploy,
    cancelDeploy,
    searchFile,
  };
});
