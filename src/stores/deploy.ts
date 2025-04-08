import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import axios, { AxiosError } from "axios";
import type { ProjectNode } from "@/types/project";
import { generateFiles } from "@/libs/templates";
import {
  getGitLabFiles,
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
import { useToast } from "@/stores/toast";
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

  // State
  const project = ref<ProjectNode | null>(null);
  const frameworkSelector = ref<AcceptedFramework>("unknown");
  const managerSelector = ref<AcceptedPackageManager>("npm");
  const deployDialog = ref(false);
  const confirmDeployDialog = ref(false);
  const nextStepsDialog = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const projectConfig = ref<ProjectConfig>(getDefaultProjectConfig("unknown"));
  const environmentVariables = ref<Env[]>([]);
  const originalEnvironmentVariables = ref<Env[]>([]);
  const injectFiles = ref<
    {
      fileName: string;
      content: string;
      action: CommitAction;
      isChecked: boolean;
    }[]
  >([]);
  const repositoryFiles = ref<{ fileName: string; content: string }[]>([]);
  const deploymentInfo = ref<{
    filesCommitted: string[];
    envs: string[];
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
        projectConfig.value = getDefaultProjectConfig(
          newFramework,
          managerSelector.value
        );

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

    const envs = await getEnvs();
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
      try {
        const commitUrl = `${
          import.meta.env.VITE_APP_GITLAB_URL
        }/api/v4/projects/${project.value.id}/repository/commits`;
        await axios.post(
          commitUrl,
          {
            branch: project.value.repository.rootRef,
            commit_message: `Auto-generated deployment files`,
            actions: actions.commit,
          },
          {
            headers: {
              Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
            },
          }
        );
        result.commit = { success: true };
        toast.success(
          t("components.deployHandler.script.success.commitSuccess")
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        result.commit = { success: false, error: errorMessage };
        toast.error(t("components.deployHandler.script.errors.commitFailed"));
        console.error("Commit error:", err);
      }
    }

    try {
      if (actions.env) {
        await updateEnvs();
        result.env = { success: true };
        toast.success(
          t("components.deployHandler.script.success.envUpdateSuccess")
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      result.env = { success: false, error: errorMessage };
      toast.error(t("components.deployHandler.script.errors.envUpdateFailed"));
      console.error("Env update error:", err);
    }

    deploymentInfo.value = {
      filesCommitted: result.commit?.success
        ? actions.commit.map((c) => c.file_path)
        : [],
      envs: result.env?.success
        ? environmentVariables.value.map((env) => env.key)
        : [],
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
      } else {
        deploymentInfo.value.messages.push(
          t("components.deployHandler.confirmDialog.noChanges") ||
            "No changes to deploy"
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

  async function updateEnvs() {
    if (!authStore.session || !project.value) return;

    const existingEnvs = await getEnvs();
    const url = `${import.meta.env.VITE_APP_GITLAB_URL}/api/v4/projects/${
      project.value.id
    }/variables`;
    const config = {
      headers: {
        Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
      },
    };

    if (environmentVariables.value.length === 0) {
      if (existingEnvs.length === 0) return;
      return await axios.delete(`${url}/${envKey}`, config);
    }

    const body = {
      key: envKey,
      value: environmentVariables.value
        .map((e) => `${e.key}=${e.value}`)
        .join("\n"),
      description: "Generated in the Auto CI/CD App",
      variable_type: "file",
    };

    if (existingEnvs.length) {
      return await axios.put(`${url}/${envKey}`, body, config);
    }
    return await axios.post(url, body, config);
  }

  async function getEnvs() {
    if (!authStore.session || !project.value) return [];

    const apiUrl = `${import.meta.env.VITE_APP_GITLAB_URL}/api/v4/projects/${
      project.value.id
    }/variables/${envKey}`;
    try {
      const response = await axios.get<{
        description: string | null;
        environment_scope: string;
        hidden: boolean;
        key: string;
        masked: boolean;
        protected: boolean;
        raw: boolean;
        value: string;
        variable_type: "file" | "env_var";
      }>(apiUrl, {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      });

      if (response.data.variable_type === "file") {
        return response.data.value.split("\n").map((e) => {
          const [key, value] = e.split("=");
          return {
            key,
            value,
            protected: response.data.protected,
            visible: false,
          };
        });
      } else if (response.data.variable_type === "env_var") {
        return [
          {
            key: response.data.key,
            value: response.data.value,
            protected: response.data.protected,
            visible: false,
          },
        ];
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status !== 404) {
        console.error("Unknown Error", error);
        toast.error(error.message);
        throw error;
      }
    }
    return [];
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
    environmentVariables,
    originalEnvironmentVariables,
    envChanges,
    injectFiles,
    deploymentInfo,
    frameworks,
    packageManagersOptions,
    filesMightHaveMissed,
    frameworkSelector,
    managerSelector,
    repositoryFiles,
    openDeployment,
    handleDeploy,
    confirmDeploy,
    cancelDeploy,
    searchFile,
  };
});
