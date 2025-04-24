import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import axios, { AxiosError } from "axios";
import type { ProjectNode } from "@/types/project";
import { generateFiles } from "@/libs/templates";
import {
  getEnvs,
  getGitLabFiles,
  updateEnvs,
  type CommitAction,
  type CommitActionObject,
} from "@/libs/gitlab";
import {
  frameworksConfig,
  packageManagers,
  envKey,
  getConfigFiles,
} from "@/config/frameworks-config";
import type {
  AcceptedFramework,
  AcceptedPackageManager,
  ProjectConfig,
} from "@/types/app-config";
import { getDefaultProjectConfig } from "@/libs/deploy/config";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@jtekt-private/vue3-toaster";
import { useI18n } from "vue-i18n";

type Env = {
  key: string;
  value: string;
  visible: boolean;
  protected?: boolean;
};

export const useDeployStore = defineStore("deploy", () => {
  const authStore = useAuthStore();
  const toast = useToast();
  const { t } = useI18n();

  const project = ref<ProjectNode | null>(null);

  // Select models
  const frameworkSelector = ref<AcceptedFramework>("unknown");
  const managerSelector = ref<AcceptedPackageManager>("npm");

  // Dialogs models
  const deployDialog = ref(false);
  const confirmDeployDialog = ref(false);
  const nextStepsDialog = ref(false);

  // State
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const projectConfig = ref<ProjectConfig>(getDefaultProjectConfig("unknown"));

  // Environment variables
  const environmentVariables = ref<Env[]>([]);
  const originalEnvironmentVariables = ref<Env[]>([]);

  // Files to be committed
  const injectFiles = ref<
    {
      fileName: string;
      content: string;
      action: CommitAction;
      isChecked: boolean;
    }[]
  >([]);

  // Files in the repository
  const repositoryFiles = ref<{ fileName: string; content: string }[]>([]);

  // Error messages and deployment info
  const deploymentInfo = ref<{
    filesCommitted: string[];
    envs: boolean;
    messages: string[];
    errors: string[];
  } | null>(null);

  // Computed properties
  const frameworks = computed(() => Object.values(frameworksConfig));

  const packageManagersOptions = computed(() => {
    return frameworksConfig[
      projectConfig.value.framework
    ].supportedManagers.map((m) => ({
      title: m.manager,
      value: m.manager,
    }));
  });

  const filesMightHaveMissed = computed<(string | string[])[]>(() => {
    if (!project.value) return [];

    const requiredByFramework =
      frameworksConfig[projectConfig.value.framework].requiredFiles || [];
    const requiredByPackageManager =
      frameworksConfig[projectConfig.value.framework].supportedManagers.find(
        (sm) => sm.manager === projectConfig.value.manager
      )?.requiredFiles || [];
    const requiredFilesForConfig = [
      ...new Set([...requiredByFramework, ...requiredByPackageManager]),
    ];

    return requiredFilesForConfig.filter(
      (f) =>
        !repositoryFiles.value.find((id) => {
          if (typeof f === "string") return id.fileName === f;
          return f.find((fc) => id.fileName === fc);
        })
    );
  });

  const isOutputFileInvalid = computed(() => {
    // If has buildCommand, outputFile is not required
    if (projectConfig.value.buildCommand) return false;

    return !repositoryFiles.value.find(
      (f) => f.fileName === projectConfig.value.outputFile
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
        (e) => e.key === newEnv.key
      );
      if (!origEnv) e.added.push(newEnv);
      else if (origEnv.value !== newEnv.value) e.modified.push(newEnv);
    });

    e.removed = originalEnvironmentVariables.value.filter(
      (origEnv) =>
        !environmentVariables.value.some((newEnv) => newEnv.key === origEnv.key)
    );

    return e;
  });

  // Sync selectors with projectConfig
  watch(
    () => frameworkSelector.value,
    (newFramework) => {
      if (newFramework !== projectConfig.value.framework) {
        // Update projectConfig with the new framework
        projectConfig.value = getDefaultProjectConfig(
          newFramework,
          managerSelector.value
        );

        // Check if the selected manager is supported by the new framework
        const supportedManagers = frameworksConfig[
          newFramework
        ].supportedManagers.map((m) => m.manager);

        if (!supportedManagers.includes(managerSelector.value)) {
          managerSelector.value = frameworksConfig[newFramework].defaultManager;
          projectConfig.value.manager = managerSelector.value;
        }
      }
    }
  );

  watch(
    () => managerSelector.value,
    (newManager) => {
      if (newManager !== projectConfig.value.manager) {
        projectConfig.value.manager = newManager;
      }
    }
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
    frameworkSelector.value = detectedConfig.framework;
    managerSelector.value = detectedConfig.manager;

    isLoading.value = false;
  }

  async function handleDeploy() {
    if (!authStore.session || !project.value) {
      toast.error(t("components.deployHandler.script.errors.unauthorized"));
      return;
    }

    const invalidEnvs = environmentVariables.value.filter(
      (e) => !e.key || !e.value
    );
    if (invalidEnvs.length) {
      toast.error(
        t("components.deployHandler.script.errors.invalidEnvs", {
          keys: invalidEnvs.map((e) => e.key).join(", "),
        })
      );
      return;
    }

    isLoading.value = true;
    injectFiles.value = [];

    const generatedFiles = await generateFiles(
      projectConfig.value,
      project.value,
      authStore.session.user.nickname
    );

    if (!generatedFiles.success) {
      console.error("File generation error:", generatedFiles.error);
      toast.error(
        t("components.deployHandler.script.errors.fileGenerationFailed", {
          error: generatedFiles.error,
        })
      );
      isLoading.value = false;
      return;
    }

    injectFiles.value = generatedFiles.content.reduce((fs, file) => {
      const originalFile = repositoryFiles.value.find(
        (original) => original.fileName === file.fileName
      );
      if (!originalFile) {
        fs.push({ ...file, action: "create", isChecked: true });
      } else if (originalFile.content !== file.content) {
        fs.push({ ...file, action: "update", isChecked: true });
      }
      return fs;
    }, [] as { fileName: string; content: string; action: CommitAction; isChecked: boolean }[]);

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
          .reduce((data, byte) => data + String.fromCharCode(byte), "")
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
          }
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
          }
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
          }
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        result.env = { success: false, error: errorMessage };
        toast.error(
          t("components.deployHandler.script.errors.envUpdateFailed"),
          {
            id: envToastId,
          }
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
            "components.deployHandler.script.success.deployMessages.firstDeploy"
          ),
          t(
            "components.deployHandler.script.success.deployMessages.trackProgress"
          )
        );
      }
    } else {
      if (hasCommitAttempt && !result.commit?.success) {
        deploymentInfo.value.errors.push(
          `Failed to commit files: ${result.commit?.error || "Unknown error"}`
        );
      }
      if (hasEnvAttempt && !result.env?.success) {
        deploymentInfo.value.errors.push(
          `Failed to update environment variables: ${
            result.env?.error || "Unknown error"
          }`
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

  async function identifyProject(): Promise<ProjectConfig> {
    if (!project.value?.languages.length || !authStore.session)
      return getDefaultProjectConfig("unknown");

    const mainLang = project.value.languages[0].name;

    // Get all files that we might need
    const allConfigFiles = getConfigFiles();

    if (!allConfigFiles.length) return getDefaultProjectConfig("unknown");

    const files = await getGitLabFiles({
      access_token: authStore.session.auth_token.access_token,
      paths: allConfigFiles,
      project: project.value,
    });

    if (!files.success) return getDefaultProjectConfig("unknown");

    repositoryFiles.value = files.data;

    for (const framework of Object.values(frameworksConfig)) {
      if (!framework.configFiles || !framework.langs?.includes(mainLang))
        continue;

      const hasFramework = framework.configFiles.some((configFile) => {
        const file = files.data.find((f) => {
          if (typeof configFile.file === "string")
            return f.fileName === configFile.file;
          return configFile.file.includes(f.fileName);
        });
        return (
          file &&
          configFile.checkFor.some((check) => file.content.includes(check))
        );
      });

      if (hasFramework) {
        let detectedManager: AcceptedPackageManager | undefined;
        for (const manager of framework.supportedManagers) {
          const pmConfig = packageManagers[manager.manager];
          const hasManager = pmConfig.detectionFiles.some((df) => {
            const file = files.data.find((f) => f.fileName === df.file);
            return file && (!df.checkFor || file.content.includes(df.checkFor));
          });
          if (hasManager) {
            detectedManager = manager.manager;
            break;
          }
        }

        const packageManager =
          detectedManager &&
          framework.supportedManagers.some(
            (sm) => sm.manager === detectedManager
          )
            ? detectedManager
            : framework.defaultManager;

        return getDefaultProjectConfig(framework.id, packageManager);
      }
    }
    return getDefaultProjectConfig("unknown");
  }

  async function searchFile(file: string) {
    if (!authStore.session || !project.value) return;

    const filesData = await getGitLabFiles({
      access_token: authStore.session.auth_token.access_token,
      paths: [file],
      project: project.value,
    });

    if (filesData.success && filesData.data.length === 1) {
      const fileData = filesData.data[0];
      const existingFileIndex = repositoryFiles.value.findIndex(
        (f) => f.fileName === file
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

  return {
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
