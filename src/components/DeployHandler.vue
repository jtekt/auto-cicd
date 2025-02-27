<template>
  <v-btn :color="'success'" variant="tonal" @click="handleDeployBtn()">
    <v-icon start icon="mdi-rocket-launch-outline" />
    {{ t("pages.home.deploy.deploy") }}
  </v-btn>

  <!-- Action Needed Dialog -->
  <v-dialog
    v-model="actionNeededDialog"
    width="600"
    max-width="90vw"
    max-height="90vh"
  >
    <v-card>
      <template #title>Actions needed to deploy the app</template>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(action, index) in actionNeeded" :key="index">
            {{ index + 1 }}. {{ action.descripton }}
            <a v-if="action.link" :href="action.link.url" target="_blank">{{
              action.link.text
            }}</a
            >{{ action.posDescription }}.
          </v-list-item>
        </v-list>
        <RouterLink to="/faq#move-project"
          >How to move a project to another group</RouterLink
        >
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="actionNeededDialog = false">
          {{ t("close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Deploy Dialog -->
  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
    <v-card :loading="isLoading" style="height: 100%">
      <v-toolbar style="position: relative">
        <v-btn
          style="position: absolute; left: 0"
          icon="mdi-close"
          @click="dialog = false"
        ></v-btn>

        <v-toolbar-items
          style="display: flex; justify-content: center; width: 100%"
        >
          <a
            :href="project.webUrl"
            target="_blank"
            rel="noopener noreferrer"
            style="text-decoration: inherit; color: inherit"
          >
            <p class="text-caption">Deploying from GitLab</p>
            <div class="d-flex ga-2 align-center">
              <v-avatar image="/icons/GitLab.svg" size="24"></v-avatar>
              <p class="text-body-1 font-weight-medium">
                {{ project.fullPath }}
              </p>
              <span class="d-flex align-center" style="color: gray">
                <v-icon size="18">mdi-source-branch</v-icon>
                <p>{{ project.repository.rootRef }}</p>
              </span>
            </div>
          </a>
        </v-toolbar-items>
      </v-toolbar>
      <div style="padding: 24px; width: 100%; max-width: 800px; margin: 0 auto">
        <div v-if="error" class="pa-5">
          <v-alert type="error" variant="tonal">
            <p>{{ error }}</p>
          </v-alert>
        </div>

        <!-- Configuration Form -->
        <template v-else>
          <!-- Framework Selector -->
          <v-select
            v-model="frameworkSelector"
            :items="frameworks"
            item-title="name"
            item-value="id"
            label="Select Framework"
            variant="outlined"
            :error="frameworkSelector === 'unknown'"
            @update:model-value="handleChangeFramework"
          >
            <template #selection="{ item }">
              <div class="d-flex align-center" style="gap: 16px">
                <v-img
                  v-if="item.raw.image.type === 'img'"
                  :src="item.raw.image.value"
                  alt="Framework Image"
                  width="28"
                  height="28"
                />
                <v-icon v-else style="font-size: 28px">
                  {{ item.raw.image.value }}
                </v-icon>
                {{ item.raw.name }}
              </div>
            </template>
            <template #item="{ item, props }">
              <v-list-item
                v-bind="props"
                :prepend-avatar="
                  item.raw.image.type === 'img'
                    ? item.raw.image.value
                    : undefined
                "
                :prepend-icon="
                  item.raw.image.type === 'icon'
                    ? item.raw.image.value
                    : undefined
                "
                style="font-size: 28px"
              />
            </template>
          </v-select>

          <!-- Package Manager Selector -->
          <v-select
            v-if="
              packageManagersOptions.length > 0 &&
              frameworkSelected.id !== 'unknown'
            "
            v-model="managerSelector"
            :items="packageManagersOptions"
            item-title="title"
            item-value="value"
            label="Select Package Manager"
            variant="outlined"
            @update:model-value="handleChangeManager"
          />

          <!-- Build and Output Settings -->
          <v-expansion-panels v-if="!!frameworkSelected.userConfigurable">
            <v-expansion-panel>
              <v-expansion-panel-title
                >Build and Output Settings</v-expansion-panel-title
              >
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  These are the default configurations for a
                  <strong>{{ frameworkSelected.name }}</strong>
                  project. If your project requires different settings, you can
                  modify them as needed.
                </p>
                <v-text-field
                  v-if="frameworkSelected.userConfigurable.rootDir"
                  v-model="projectConfig.rootDir"
                  label="Root Directory"
                  variant="outlined"
                  :class="
                    projectConfig.rootDir ===
                    frameworksConfig[frameworkSelector].rootDir
                      ? ''
                      : 'text-warning'
                  "
                />
                <v-text-field
                  v-if="frameworkSelected.userConfigurable.outputDir"
                  v-model="projectConfig.outputDir"
                  label="Output Directory"
                  variant="outlined"
                  :class="
                    projectConfig.outputDir ===
                    frameworksConfig[frameworkSelector].outputDir
                      ? ''
                      : 'text-warning'
                  "
                />
                <v-text-field
                  v-if="frameworkSelected.userConfigurable.installCommand"
                  v-model="projectConfig.installCommand"
                  label="Install Command"
                  variant="outlined"
                  :class="
                    projectConfig.installCommand ===
                    packageManagers[managerSelector].commands.install
                      ? ''
                      : 'text-warning'
                  "
                />
                <v-text-field
                  v-if="frameworkSelected.userConfigurable.buildCommand"
                  v-model="projectConfig.buildCommand"
                  label="Build Command"
                  variant="outlined"
                  :class="
                    projectConfig.buildCommand ===
                    packageManagers[managerSelector].commands.build
                      ? ''
                      : 'text-warning'
                  "
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-title
                >Environment Variables</v-expansion-panel-title
              >
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  Add environment variables for your project. Sensitive values
                  will be hidden.
                </p>

                <div
                  class="d-flex ga-4 align-center mb-4"
                  v-for="(env, index) in environmentVariables"
                  :key="index"
                >
                  <v-text-field
                    v-model="env.key"
                    label="Key"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :error="!!env.value && !env.key"
                    @paste="handlePaste($event, index)"
                    :disabled="env.protected"
                  />
                  <v-text-field
                    v-model="env.value"
                    label="Value"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="env.protected"
                    :append-inner-icon="env.visible ? 'mdi-eye-off' : 'mdi-eye'"
                    :type="env.visible && !env.protected ? 'text' : 'password'"
                    @click:append-inner="
                      env.visible = !env.protected && !env.visible
                    "
                  />
                  <v-btn
                    :disabled="env.protected"
                    density="comfortable"
                    icon
                    variant="tonal"
                    color="error"
                    @click="removeEnv(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>

                <v-btn color="primary" variant="tonal" @click="addEnv"
                  >Add More</v-btn
                >
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>

        <!-- Actions -->
      </div>
      <template #actions>
        <div
          class="d-flex justify-end ga-2"
          style="
            padding: 24px;
            width: 100%;
            max-width: 800px;
            margin-top: auto;
            margin-left: auto;
            margin-right: auto;
          "
        >
          <v-btn
            color="success"
            variant="tonal"
            :text="t('pages.home.deploy.deploy')"
            :disabled="frameworkSelector === 'unknown'"
            @click="handleDeploy"
          />
          <v-btn
            variant="tonal"
            :text="t('pages.home.deploy.cancel')"
            @click="dialog = false"
          />
        </div>
      </template>
    </v-card>
  </v-dialog>

  <!-- Confirmation Dialog -->
  <v-dialog
    v-model="confirmDeployDialog"
    persistent
    width="700"
    max-width="90vw"
    max-height="90vh"
  >
    <v-card prepend-icon="mdi-check-all" class="pa-2">
      <template #title>
        <span class="text-h6 font-weight-bold">
          {{ t("pages.home.deploy.confirmDeployTitle") }}
        </span>
      </template>

      <v-card-text class="mt-4">
        <!-- Main instruction message -->
        <p class="text-body-1 mb-4">
          {{ t("pages.home.deploy.confirmDeployMessage") }}
        </p>

        <!-- Files Section -->
        <div class="mb-6">
          <h3 class="text-subtitle-1 font-weight-medium mb-2">
            Files to be Deployed
          </h3>
          <v-expansion-panels
            v-if="injectFiles.length"
            variant="accordion"
            elevation="1"
            class="rounded-lg"
          >
            <v-expansion-panel
              v-for="(fileInfo, index) in injectFiles"
              :key="index"
              class="mb-1"
            >
              <template #title>
                <div class="d-flex align-center gap-2">
                  <v-chip
                    :color="fileInfo.action === 'update' ? 'info' : 'success'"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{ fileInfo.action === "update" ? "Update" : "Create" }}
                  </v-chip>
                  <span class="font-weight-medium">
                    {{ fileInfo.fileName }}
                  </span>
                </div>
              </template>
              <template #text>
                <CodeEditor
                  :default-value="fileInfo.content"
                  max-height="300"
                  readonly
                  class="mt-2 text-body-2"
                />
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-alert
            v-else
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            {{ t("pages.home.deploy.noChangesMade") }}
          </v-alert>
        </div>

        <!-- Environment Variables Section -->
        <div v-if="environmentVariables.length" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-medium mb-2">
            Included Environment Variables
          </h3>
          <p class="text-body-2 text-grey-darken-1 mb-2">
            These variables will be available in your deployment:
          </p>
          <v-list density="compact" class="bg-grey-lighten-4 rounded-lg py-1">
            <v-list-item
              v-for="(env, index) in environmentVariables"
              :key="index"
              class="text-body-2"
            >
              <span class="font-weight-medium">{{ env.key }}</span>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          v-if="injectFiles.length > 0"
          color="success"
          class="px-4"
          variant="tonal"
          @click="confirmDeploy"
        >
          {{ t("pages.home.deploy.continue") }}
        </v-btn>
        <v-btn variant="tonal" class="px-4" @click="cancelDeploy">
          {{ t("pages.home.deploy.cancel") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Next Steps Dialog -->
  <v-dialog v-model="nextStepsDialog" max-width="600px">
    <v-card class="pa-2">
      <v-card-title class="text-h5 font-weight-bold text-center py-4">
        <v-icon left color="success">mdi-check-circle</v-icon>
        Deployment Completed Successfully! 🎉
      </v-card-title>

      <v-card-text v-if="deploymentInfo" class="py-4">
        <!-- Files Committed Section -->
        <div v-if="deploymentInfo.filesCommitted.length" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-medium mb-2">
            Files Committed to Repository
          </h3>
          <v-alert type="info" variant="tonal" density="compact" class="mb-3">
            These changes have been pushed to your GitLab repository. Please
            pull the latest updates.
          </v-alert>
          <v-list density="compact" class="bg-grey-lighten-4 rounded-lg py-1">
            <v-list-item v-for="f in deploymentInfo.filesCommitted" :key="f">
              <span class="text-body-2">{{ f }}</span>
            </v-list-item>
          </v-list>
        </div>

        <!-- Important Notes Section -->
        <div v-if="deploymentInfo.messages.length" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-medium mb-2">
            Important Notes
          </h3>
          <v-list density="compact">
            <v-list-item v-for="f in deploymentInfo.messages" :key="f">
              <span class="text-body-2">{{ f }}</span>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="tonal"
          class="px-4"
          @click="nextStepsDialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Multiple Snackbars -->
  <v-snackbar
    v-for="(snack, index) in snackbarQueue"
    :key="index"
    v-model="snack.show"
    :color="snack.color"
    :timeout="5000"
    :style="{ 'margin-bottom': `${index * 60}px`, zIndex: 1000 }"
    location="bottom"
  >
    {{ snack.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import { env } from "@/config/env";
import { useLocale } from "vuetify";
import type { ProjectNode } from "@/types/project";
import { generateFiles } from "@/libs/templates";
import {
  frameworksConfig,
  packageManagers,
  getDefaultProjectConfig,
  type AcceptedFramework,
  type ProjectConfig,
  type AcceptedPackageManager,
  type FrameworkConfig,
} from "@/config/frameworks-config";
import type { CommitAction } from "@/libs/gitlab";

const authStore = useAuthStore();

const { t } = useLocale();
const { project } = defineProps<{ project: ProjectNode }>();

// Define the snackbar queue as a reactive array
const snackbarQueue = ref<
  Array<{ show: boolean; text: string; color: string }>
>([]);

const dialog = ref(false);
const actionNeededDialog = ref(false);
const actionNeeded = ref<
  {
    descripton: string;
    link?: { text: string; url: string };
    posDescription?: string;
  }[]
>([]);
const confirmDeployDialog = ref(false);
const nextStepsDialog = ref(false);
const deploymentInfo = ref<{
  filesCommitted: string[];
  messages: string[];
} | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const frameworkSelector = ref<AcceptedFramework>("unknown");
const managerSelector = ref<AcceptedPackageManager>("npm");
const projectConfig = ref<ProjectConfig>(getDefaultProjectConfig("unknown"));
const originalFiles = ref<{ fileName: string; content: string }[]>([]);
const injectFiles = ref<
  { fileName: string; content: string; action: CommitAction }[]
>([]);

const envKey = "ENV";
const environmentVariables = ref<
  { key: string; value: string; visible: boolean; protected?: boolean }[]
>([]);

const addEnv = () => {
  environmentVariables.value.push({ key: "", value: "", visible: false });
};

const removeEnv = (index: number) => {
  environmentVariables.value.splice(index, 1);
};

const handlePaste = (event: ClipboardEvent, index: number) => {
  // Prevent default paste action
  event.preventDefault();

  // Get pasted text
  const pastedText = event.clipboardData?.getData("text");

  if (!pastedText) return;

  // Normalize the pasted text: Remove carriage return characters (\r) and normalize line breaks
  const normalizedText = pastedText.replace(/\r/g, ""); // Remove \r characters
  const envLines = normalizedText
    .split("\n")
    .filter((line) => line.trim() !== "");

  const newVariables: { key: string; value: string; visible: boolean }[] = [];
  let isValidEnv = true;

  // Validate if the pasted lines are in valid .env format
  for (const line of envLines) {
    const match = line.match(/^([^#=]+)\s*=\s*(.*)$/); // Match key=value pairs and ignore comments
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ""); // Remove surrounding quotes
      newVariables.push({ key, value, visible: false });
    } else {
      // If any line is not valid .env format, we flag as invalid
      isValidEnv = false;
      break;
    }
  }

  // If the paste is a valid .env format, update the environment variables
  if (isValidEnv && newVariables.length > 0) {
    // If there is a focus on a particular key (index is provided), update that key
    if (index !== undefined && environmentVariables.value[index]) {
      environmentVariables.value[index] = newVariables[0]; // Only update the first line
    } else {
      // If no index, or this is the first key, clear previous and set new variables
      environmentVariables.value = [...newVariables]; // Replace old values with new ones
    }

    // If there are more than one key-value pairs, add the rest as new entries
    if (newVariables.length > 1) {
      // Append the remaining new variables
      environmentVariables.value.push(...newVariables.slice(1));
    }
  } else {
    // If the .env format is invalid, let the browser handle the paste normally
    const focusedElement = document.activeElement as HTMLInputElement;
    if (focusedElement) {
      const value = focusedElement.value;
      const cursorPosition = focusedElement.selectionStart || 0;
      const textBefore = value.slice(0, cursorPosition);
      const textAfter = value.slice(cursorPosition);

      // Insert the pasted text at the cursor position
      focusedElement.value = textBefore + pastedText + textAfter;
    }
  }
};

// Framework and package manager options
const frameworks = Object.values(frameworksConfig);
const packageManagersOptions = computed(() =>
  frameworksConfig[frameworkSelector.value].supportedManagers.map((m) => ({
    title: m,
    value: m,
  }))
);
const frameworkSelected = computed(
  () => frameworksConfig[frameworkSelector.value]
);

// Open deploy dialog and detect framework/language
const handleDeployBtn = async () => {
  if (!authStore.session) return showSnackbar("Error: Unauthorized", "error");

  // Check namespace (example logic, adjust as needed)
  if (
    !project.namespace ||
    !env.ALLOWED_NAMESPACES.includes(project.namespace.fullPath.split("/")[0])
  ) {
    actionNeeded.value = [
      {
        descripton:
          "The project is not in an allowed group. Please transfer the project to an approved group:",
        link: {
          url: `${env.GITLAB_URL}/${env.ALLOWED_NAMESPACES[0]}`,
          text: "Allowed Group",
        },
        posDescription: ", then move your project to the new group",
      },
    ];
    actionNeededDialog.value = true;
    return;
  }

  // Get envs
  environmentVariables.value = (await getEnvs()) || [];

  dialog.value = true;
  isLoading.value = true;

  const detectedConfig = await identifyProject();

  frameworkSelector.value = detectedConfig.framework;
  managerSelector.value = detectedConfig.manager;
  projectConfig.value = detectedConfig;

  isLoading.value = false;
};

// Handle framework change
const handleChangeFramework = (id: AcceptedFramework) => {
  const newConfig = getDefaultProjectConfig(id);
  managerSelector.value = newConfig.manager; // Reset to default manager
  projectConfig.value = { ...newConfig };
};

// Handle package manager change
const handleChangeManager = (manager: AcceptedPackageManager) => {
  const managerConfig = packageManagers[manager];
  projectConfig.value = {
    ...projectConfig.value,
    manager,
    installCommand: managerConfig.commands.install,
    buildCommand:
      projectConfig.value.language === "javascript"
        ? managerConfig.commands.build
        : undefined,
  };
};

// Deploy logic
const handleDeploy = async () => {
  if (!authStore.session) {
    return showSnackbar("Error: Unauthorized", "error");
  }

  injectFiles.value = [];

  // Check if the files have been changed
  const files = await getRepositoryFiles([
    "Dockerfile",
    ".gitlab-ci.yml",
    "kubernetes_manifest.yml",
    ...projectConfig.value.files,
  ]);

  if (!files.success) {
    return showSnackbar("Error: " + files.error, "error");
  }

  originalFiles.value = files.data;

  // Create the files to insert in the repository
  const generatedFiles = await generateFiles(projectConfig.value, project);

  injectFiles.value = generatedFiles.reduce<
    {
      fileName: string;
      content: string;
      action: CommitAction;
    }[]
  >((fs, file) => {
    const originalFile = originalFiles.value.find(
      (original) => original.fileName === file.fileName
    );

    if (!originalFile) {
      fs.push({
        ...file,
        action: "create",
      });
    } else if (originalFile.content !== file.content) {
      console.log({ original: originalFile.content, new: file.content });
      fs.push({
        ...file,
        action: "update",
      });
    }

    return fs;
  }, []);

  confirmDeployDialog.value = true; // Open confirmation dialog
};

// Confirm deployment
const confirmDeploy = async () => {
  confirmDeployDialog.value = false;
  if (!authStore.session) return showSnackbar("Error: Unauthorized", "error");

  const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
  const commitActions = injectFiles.value.map((f) => ({
    action: f.action || "create",
    file_path: f.fileName,
    content: encodeBase64(f.content),
    encoding: "base64",
  }));

  if (commitActions.length === 0) {
    return showSnackbar("No changes to deploy", "info");
  }

  try {
    const commitUrl = `${env.GITLAB_URL}/api/v4/projects/${project.id}/repository/commits`;

    await axios.post(
      commitUrl,
      {
        branch: project.repository.rootRef,
        commit_message: `Auto-generated deployment files`,
        actions: commitActions,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      }
    );

    showSnackbar("Deployment successful", "success");

    await updateEnvs();

    deploymentInfo.value = {
      filesCommitted: commitActions.map((a) => a.file_path),
      messages: [
        "Your project will be deployed within a few minutes.",
        "If this is your first auto deployment, you will receive an email with the URL of your application.",
        "You can track the progress of your build by accessing the GitLab project under Build > Pipelines.",
      ],
    };

    dialog.value = false;
    nextStepsDialog.value = true;
  } catch (err) {
    showSnackbar("Deployment failed", "error");
    console.error(err);
  }
};

// Update or create environment variables in GitLab
const updateEnvs = async () => {
  try {
    if (!authStore.session) throw new Error("Unauthorized");

    const existingEnvs = await getEnvs();

    // Add or update new variables
    const method = existingEnvs ? "put" : "post";
    const url = existingEnvs
      ? `${env.GITLAB_URL}/api/v4/projects/${project.id}/variables/${envKey}`
      : `${env.GITLAB_URL}/api/v4/projects/${project.id}/variables`;

    await axios[method](
      url,
      {
        key: envKey,
        value: environmentVariables.value
          .map((e) => `${e.key}=${e.value}`)
          .join("\n"),
        description: "Generated in the Auto CI/CD App",
        variable_type: "file",
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      }
    );

    showSnackbar("Environment variables updated successfully", "success");
  } catch (err) {
    showSnackbar("Failed to update environment variables", "error");
    console.error(err);
  }
};

// Cancel deployment
const cancelDeploy = () => {
  confirmDeployDialog.value = false;
};

// Identify project language and framework
const identifyProject = async (): Promise<ProjectConfig> => {
  if (!project.languages.length) return getDefaultProjectConfig("unknown");
  const mainLang = project.languages[0].name;

  const allConfigFiles = new Set<string>();
  const frameworkFileMap = new Map<string, FrameworkConfig>();

  for (const framework of Object.values(frameworksConfig)) {
    if (!framework.configFiles || !framework.langs?.includes(mainLang))
      continue;

    framework.configFiles.forEach((config) => {
      allConfigFiles.add(config.file);
      frameworkFileMap.set(framework.id, framework);
    });
  }

  if (allConfigFiles.size === 0) return getDefaultProjectConfig("unknown");

  for (const framework of Object.values(frameworksConfig)) {
    if (!framework.langs?.includes(mainLang)) continue;
    framework.supportedManagers.forEach((manager) => {
      packageManagers[manager].detectionFiles.forEach((df) =>
        allConfigFiles.add(df.file)
      );
    });
  }

  const files = await getRepositoryFiles(Array.from(allConfigFiles));
  if (!files.success) return getDefaultProjectConfig("unknown");

  for (const framework of Object.values(frameworksConfig)) {
    if (!framework.configFiles || !framework.langs?.includes(mainLang))
      continue;

    const hasFramework = framework.configFiles.some((configFile) => {
      const file = files.data.find((f) => f.fileName === configFile.file);
      return (
        file &&
        configFile.checkFor.some((check) => file.content.includes(check))
      );
    });

    if (hasFramework) {
      let detectedManager: AcceptedPackageManager | undefined;
      for (const manager of framework.supportedManagers) {
        const pmConfig = packageManagers[manager];
        const hasManager = pmConfig.detectionFiles.some((df) => {
          const file = files.data.find((f) => f.fileName === df.file);
          return file && (!df.checkFor || file.content.includes(df.checkFor));
        });
        if (hasManager) {
          detectedManager = manager;
          break;
        }
      }

      const packageManager =
        detectedManager && framework.supportedManagers.includes(detectedManager)
          ? detectedManager
          : framework.defaultManager;

      return getDefaultProjectConfig(framework.id, packageManager);
    }
  }

  return getDefaultProjectConfig("unknown");
};

// Fetch repository files
const getRepositoryFiles = async (paths: string[]) => {
  try {
    if (!authStore.session) throw new Error("Unauthorized");

    const res = await axios.post<{
      data: {
        project: {
          repository: {
            blobs: {
              edges: Array<{
                node: {
                  name: string;
                  rawBlob: string; // Raw content of the file
                };
              }>;
            };
          };
        };
      };
      correlationId: string;
    }>(
      `${env.GITLAB_URL}/api/graphql`,
      {
        query: `{
          project(fullPath: "${project.fullPath}") {
            repository {
              blobs(ref: "${
                project.repository.rootRef
              }", paths: ${JSON.stringify(paths)}) {
                edges { node { name rawBlob } }
              }
            }
          }
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      }
    );
    return {
      success: true,
      data: res.data.data.project.repository.blobs.edges.map((e) => ({
        fileName: e.node.name,
        content: e.node.rawBlob,
      })),
    };
  } catch (err) {
    return { success: false, data: [], error: (err as Error).message };
  }
};

// Fetch envs
const getEnvs = async () => {
  if (!authStore.session) return;

  const apiUrl = `${env.GITLAB_URL}/api/v4/projects/${project.id}/variables/${envKey}`;

  try {
    // Check if the variable already exists
    const response = await axios.get<{
      description: string | null;
      environment_scope: string;
      hidden: boolean;
      key: string;
      masked: boolean;
      protected: boolean;
      raw: boolean;
      value: string; // KEY=VALUE\nKEY=VALUE
      variable_type: "file" | "env_var";
    }>(apiUrl, {
      headers: {
        Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
      },
    });

    if (response.data.variable_type === "file") {
      const vars = response.data.value.split("\n").map((e) => {
        const [key, value] = e.split("=");

        return {
          key,
          value,
          protected:
            response.data.masked ||
            response.data.hidden ||
            response.data.protected,
          visible: false,
        };
      });

      return vars;
    }
  } catch (error) {
    console.log(error);
  }
};

// Snackbar helper
const showSnackbar = (text: string, color: string) => {
  // Add new snackbar to the queue
  snackbarQueue.value.push({ show: true, text, color });

  // Optional: Auto-remove after timeout to prevent memory buildup
  setTimeout(() => {
    const index = snackbarQueue.value.findIndex(
      (s) => s.text === text && s.color === color
    );
    if (index !== -1) {
      snackbarQueue.value.splice(index, 1);
    }
  }, 5500); // Slightly longer than timeout to ensure it disappears smoothly
};
</script>

<style scoped>
.info-container {
  padding: 16px;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin-top: 10px;
}
.template-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  height: 250px; /* Fixed height */
}
.template-card:hover {
  transform: scale(1.05);
}
.highlight {
  background-color: #ffeb3b;
  color: #000;
}
.v-dialog__content {
  overflow: auto;
  max-height: 75vh;
}
</style>
