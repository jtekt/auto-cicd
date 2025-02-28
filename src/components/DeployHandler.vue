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
  <v-dialog
    v-model="deployDialog"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card :loading="isLoading" style="height: 100%">
      <v-toolbar style="position: relative">
        <v-btn
          style="position: absolute; left: 0"
          icon="mdi-close"
          @click="deployDialog = false"
        ></v-btn>

        <v-toolbar-items
          style="display: flex; justify-content: center; width: 100%"
        >
          <a
            :href="project.webUrl"
            target="_blank"
            rel="noopener noreferrer"
            style="
              text-decoration: inherit;
              color: inherit;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: start;
            "
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
        <template v-else-if="!isLoading || frameworkSelected.id !== 'unknown'">
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

          <v-expansion-panels>
            <!-- Build and Output Settings -->
            <v-expansion-panel v-if="!!frameworkSelected.userConfigurable">
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

            <!-- Environment Variables Settings -->
            <v-expansion-panel>
              <v-expansion-panel-title
                >Environment Variables</v-expansion-panel-title
              >
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  Add environment variables for your project.
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
                    :warni="!!env.value && !env.key"
                    :disabled="env.protected"
                    @paste="(e: ClipboardEvent) => handlePaste(e, index)"
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
                    :error="!!env.key && !env.value"
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
                <p
                  v-if="environmentVariables.length"
                  class="text-caption text-center mt-2 mb-2"
                >
                  You can paste the contents of a valid .env file directly into
                  one of the key input fields, and it will automatically
                  populate the corresponding values for you.
                </p>
                <v-btn color="primary" variant="tonal" @click="addEnv"
                  >Add More</v-btn
                >
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <template v-if="frameworkSelected.tips">
            <v-alert
              v-for="tip in frameworkSelected.tips"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              <div class="d-flex align-center ga-4">
                <p class="flex-fill">
                  {{ tip.text }}
                </p>
                <a
                  v-if="tip.link"
                  :href="tip.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  ><v-icon>mdi-link-variant</v-icon></a
                >
              </div>
            </v-alert>
          </template>
        </template>
      </div>
      <!-- Actions -->
      <template #actions>
        <div
          class="d-flex justify-end ga-2"
          style="
            padding: 0 24px;
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
            :disabled="isLoading || frameworkSelector === 'unknown'"
            @click="handleDeploy"
          />
          <v-btn
            variant="tonal"
            :text="t('pages.home.deploy.cancel')"
            @click="deployDialog = false"
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
        <span class="text-h5 font-weight-bold">
          {{ t("pages.home.deploy.confirmDeployTitle") }}
        </span>
      </template>

      <v-card-text class="mt-4">
        <!-- Main instruction message -->
        <p class="text-body-1 mb-4">
          Are you sure you want to continue? The following changes will be made:
        </p>

        <!-- Files Section -->
        <div class="mb-6">
          <h3 class="text-subtitle-s font-weight-medium mb-2">
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
                <div class="d-flex align-center ga-4">
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
          <h3 class="text-subtitle-s font-weight-medium mb-2">
            Included Environment Variables
          </h3>
          <p class="text-body-2 text-grey-darken-1 mb-2">
            These variables will be available in your deployment:
          </p>
          <v-alert
            v-for="(env, index) in environmentVariables"
            :key="index"
            class="mb-2"
            density="compact"
          >
            <span class="font-weight-medium">{{ env.key }}</span>
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          v-if="injectFiles.length || environmentVariables.length"
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
      <v-card-title
        class="text-h5 font-weight-bold text-center py-4"
        :class="{
          'text-success':
            deploymentInfo?.messages.length && !deploymentInfo?.errors.length,
          'text-warning':
            deploymentInfo?.messages.length && deploymentInfo?.errors.length,
          'text-error':
            deploymentInfo?.errors.length && !deploymentInfo?.messages.length,
        }"
      >
        <v-icon
          left
          :color="deploymentInfo?.errors.length ? 'error' : 'success'"
        >
          {{
            deploymentInfo?.errors.length
              ? "mdi-alert-circle"
              : "mdi-check-circle"
          }}
        </v-icon>
        {{
          deploymentInfo?.errors.length && !deploymentInfo?.messages.length
            ? "Deployment Failed"
            : deploymentInfo?.messages.length
            ? "Deployment Completed"
            : "Deployment Update"
        }}
      </v-card-title>

      <v-card-text v-if="deploymentInfo" class="py-0 pt-4">
        <!-- Files Committed Section -->
        <div class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2">Files Committed</h3>
          <v-alert
            :type="deploymentInfo.filesCommitted.length ? 'info' : 'warning'"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{
              deploymentInfo.filesCommitted.length > 0
                ? "These changes have been pushed to your GitLab repository. Please pull the latest updates."
                : "No file was changed in your GitLab repository"
            }}
          </v-alert>
          <v-alert
            v-for="f in deploymentInfo.filesCommitted"
            :key="f"
            variant="tonal"
            density="compact"
            class="mb-1"
          >
            {{ f }}
          </v-alert>
        </div>

        <!-- Environment varibles Section -->
        <div v-if="deploymentInfo.envs.length" class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2">
            Environment Variables added
          </h3>
          <v-alert
            v-for="env in deploymentInfo.envs"
            :key="env"
            variant="tonal"
            density="compact"
            class="mb-1"
          >
            {{ env }}
          </v-alert>
        </div>

        <!-- Success Messages Section -->
        <div v-if="deploymentInfo.messages.length" class="mb-6">
          <h3 class="text-h5 font-weight-medium mb-2">Important Notes</h3>
          <v-alert
            v-for="f in deploymentInfo.messages"
            :key="f"
            class="mb-1"
            density="compact"
          >
            <span class="text-body-2">{{ f }}</span>
          </v-alert>
        </div>

        <!-- Errors Section -->
        <div v-if="deploymentInfo.errors?.length">
          <h3 class="text-subtitle-1 font-weight-medium mb-2 text-error">
            Errors Encountered
          </h3>
          <v-alert type="error" variant="tonal" density="compact" class="mb-3">
            Please review the following issues and try again or contact support.
          </v-alert>
          <v-list density="compact">
            <v-list-item v-for="error in deploymentInfo.errors" :key="error">
              <span class="text-body-2">● {{ error }}</span>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          :color="deploymentInfo?.errors.length ? 'error' : 'primary'"
          variant="tonal"
          class="px-4"
          @click="nextStepsDialog = false"
        >
          {{ deploymentInfo?.errors.length ? "Close and Review" : "Close" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios, { AxiosError } from "axios";
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
import { useSnackbarStore } from "@/stores/snackbar";

const authStore = useAuthStore();
const snackbarStore = useSnackbarStore();

const { t } = useLocale();
const { project } = defineProps<{ project: ProjectNode }>();

const deployDialog = ref(false);
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
  envs: string[];
  messages: string[];
  errors: string[];
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
    environmentVariables.value[index] = newVariables[0]; // Only update the first line

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
  if (!authStore.session)
    return snackbarStore.showSnackbar("Error: Unauthorized", "error");

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

  isLoading.value = true;
  deployDialog.value = true;
  // Get envs
  environmentVariables.value = (await getEnvs()) || [];

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
    return snackbarStore.showSnackbar("Error: Unauthorized", "error");
  }

  // Validate envs
  const invalidEnvs = environmentVariables.value.filter(
    (e) => !e.key || !e.value
  );

  if (invalidEnvs.length) {
    return snackbarStore.showSnackbar(
      `The environment variables ${invalidEnvs
        .map((e) => e.key)
        .join(", ")} are invalid`,
      "error"
    );
  }

  isLoading.value = true;

  injectFiles.value = [];

  // Check if the files have been changed
  const files = await getRepositoryFiles([
    "Dockerfile",
    ".gitlab-ci.yml",
    "kubernetes_manifest.yml",
    ...projectConfig.value.files,
  ]);

  if (!files.success) {
    isLoading.value = false;
    return snackbarStore.showSnackbar("Error: " + files.error, "error");
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
      fs.push({
        ...file,
        action: "update",
      });
    }

    return fs;
  }, []);

  isLoading.value = false;
  confirmDeployDialog.value = true; // Open confirmation dialog
};

// Confirm deployment
const confirmDeploy = async () => {
  confirmDeployDialog.value = false;
  if (!authStore.session) {
    return snackbarStore.showSnackbar("Error: Unauthorized", "error");
  }

  isLoading.value = true;

  // Modern base64 encoding replacing deprecated unescape
  const encodeBase64 = (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  };

  let commitActions: {
    action: CommitAction;
    file_path: string;
    content: string;
    encoding: string;
  }[] = [];

  let commitResult: { success: boolean; error?: string } = { success: false };
  let envUpdateResult: { success: boolean; error?: string } = {
    success: false,
  };

  // Try committing files
  if (injectFiles.value.length) {
    commitActions = injectFiles.value.map((f) => ({
      action: f.action || "create",
      file_path: f.fileName,
      content: encodeBase64(f.content),
      encoding: "base64",
    }));

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
      commitResult = { success: true };
      snackbarStore.showSnackbar(
        "Deployment files committed successfully!",
        "success"
      );
    } catch (err) {
      if (err instanceof AxiosError || err instanceof Error) {
        commitResult = {
          success: false,
          error: err.message || "Unknown error",
        };
      } else {
        commitResult = { success: false, error: "Unknown error" };
      }

      snackbarStore.showSnackbar(
        "Error: Failed to commit deployment files.",
        "error"
      );
      console.error("Commit error:", err);
    }
  }

  // Try updating environment variables
  try {
    await updateEnvs();
    envUpdateResult = { success: true };
    snackbarStore.showSnackbar(
      "Environment variables updated successfully!",
      "success"
    );
  } catch (err) {
    if (err instanceof AxiosError || err instanceof Error) {
      envUpdateResult = {
        success: false,
        error: err.message || "Unknown error",
      };
    } else {
      envUpdateResult = { success: false, error: "Unknown error" };
    }

    snackbarStore.showSnackbar(
      "Error: Failed to update environment variables.",
      "error"
    );
    console.error("Env update error:", err);
  }

  // Set Deployment Info based on results
  deploymentInfo.value = {
    filesCommitted: commitResult.success
      ? commitActions.map((a) => a.file_path)
      : [],
    envs: envUpdateResult.success
      ? environmentVariables.value.map((env) => env.key)
      : [],
    messages: [],
    errors: [],
  };

  if (commitResult.success && envUpdateResult.success) {
    deploymentInfo.value.messages.push(
      "Your project will be deployed within a few minutes.",
      "If this is your first auto deployment, you will receive an email with the URL of your application.",
      "You can track the progress of your build by accessing the GitLab project under Build > Pipelines."
    );
  } else {
    if (!commitResult.success && injectFiles.value.length) {
      deploymentInfo.value.errors.push(
        `Failed to commit files: ${commitResult.error || "Unknown error"}`
      );
    }
    if (!envUpdateResult.success) {
      deploymentInfo.value.errors.push(
        `Failed to update environment variables: ${
          envUpdateResult.error || "Unknown error"
        }`
      );
    }
    if (!commitResult.success && !envUpdateResult.success) {
      deploymentInfo.value.errors.push(
        "Deployment failed. Please check the logs for more details."
      );
    }
  }

  isLoading.value = false;
  deployDialog.value = false;
  nextStepsDialog.value = true; // Show dialog regardless of success/failure
};

// Update or create environment variables in GitLab
const updateEnvs = async () => {
  if (environmentVariables.value.length === 0) return;

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
    } else if (response.data.variable_type === "env_var") {
      return [
        {
          key: response.data.key,
          value: response.data.value,
          protected:
            response.data.masked ||
            response.data.hidden ||
            response.data.protected,
          visible: false,
        },
      ];
    }
  } catch (error) {
    console.error(error);
  }
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
