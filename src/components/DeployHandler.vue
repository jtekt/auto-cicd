<template>
  <v-btn :color="'success'" variant="tonal" @click="handleDeployBtn()">
    <v-icon start icon="mdi-rocket-launch-outline" />
    {{ t("components.deployHandler.actionBtn") }}
  </v-btn>

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
            <p class="text-caption">
              {{
                t("components.deployHandler.deployDialog.deployingFromGitlab")
              }}
            </p>
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
          <v-alert
            variant="tonal"
            color="warning"
            class="mb-5"
            v-if="filesMightHaveMissed?.length"
          >
            Files [
            <template v-for="(fm, index) in filesMightHaveMissed">
              <strong>{{ fm }}</strong
              ><template v-if="index < filesMightHaveMissed.length - 1"
                >,
              </template></template
            >
            ] are required in the repository to use the auto deploy with
            <strong>{{ managerSelector }}</strong
            >-<strong>{{ frameworkSelected.name }}</strong>
          </v-alert>
          <!-- Framework Selector -->
          <v-select
            v-model="frameworkSelector"
            :items="frameworks"
            item-title="name"
            item-value="id"
            :label="t('components.deployHandler.deployDialog.selectFramework')"
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
            :label="
              t('components.deployHandler.deployDialog.selectPackageManager')
            "
            variant="outlined"
            @update:model-value="handleChangeManager"
          />

          <v-expansion-panels>
            <!-- Build and Output Settings -->
            <v-expansion-panel v-if="!!frameworkSelected.userConfigurable">
              <v-expansion-panel-title>
                {{
                  t("components.deployHandler.deployDialog.buildSettings.title")
                }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  {{
                    t(
                      "components.deployHandler.deployDialog.buildSettings.description",
                      { framework: frameworkSelected.name }
                    )
                  }}
                </p>
                <v-text-field
                  v-if="frameworkSelected.userConfigurable.rootDir"
                  v-model="projectConfig.rootDir"
                  :label="
                    t(
                      'components.deployHandler.deployDialog.buildSettings.rootDir'
                    )
                  "
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
                  :label="
                    t(
                      'components.deployHandler.deployDialog.buildSettings.outputDir'
                    )
                  "
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
                  :label="
                    t(
                      'components.deployHandler.deployDialog.buildSettings.installCommand'
                    )
                  "
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
                  :label="
                    t(
                      'components.deployHandler.deployDialog.buildSettings.buildCommand'
                    )
                  "
                  variant="outlined"
                  :class="
                    (frameworkSelected.userConfigurable.buildCommand
                      .defaultEmpty &&
                      !projectConfig.buildCommand) ||
                    projectConfig.buildCommand ===
                      packageManagers[managerSelector].commands.build
                      ? ''
                      : 'text-warning'
                  "
                />
                <v-text-field
                  v-if="frameworkSelected.userConfigurable.outputFileName"
                  v-model="projectConfig.outputFileName"
                  :label="
                    t(
                      'components.deployHandler.deployDialog.buildSettings.outputFileName'
                    )
                  "
                  variant="outlined"
                  :class="
                    projectConfig.outputFileName ===
                    frameworkSelected.outputFileName
                      ? ''
                      : 'text-warning'
                  "
                />
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Environment Variables Settings -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                {{
                  t("components.deployHandler.deployDialog.envSettings.title")
                }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  {{
                    t(
                      "components.deployHandler.deployDialog.envSettings.description"
                    )
                  }}
                </p>

                <div
                  class="d-flex ga-4 align-center mb-4"
                  v-for="(env, index) in environmentVariables"
                  :key="index"
                >
                  <v-text-field
                    v-model="env.key"
                    :label="
                      t('components.deployHandler.deployDialog.envSettings.key')
                    "
                    variant="outlined"
                    density="compact"
                    hide-details
                    :error="!!env.value && !env.key"
                    :disabled="env.protected"
                    @paste="(e: ClipboardEvent) => handlePaste(e, index)"
                  />
                  <v-text-field
                    v-model="env.value"
                    :label="
                      t(
                        'components.deployHandler.deployDialog.envSettings.value'
                      )
                    "
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
                  {{
                    t(
                      "components.deployHandler.deployDialog.envSettings.pasteHint"
                    )
                  }}
                </p>
                <v-btn color="primary" variant="tonal" @click="addEnv">
                  {{
                    t(
                      "components.deployHandler.deployDialog.envSettings.addMore"
                    )
                  }}
                </v-btn>
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
            :text="t('components.deployHandler.actionBtn')"
            :disabled="isLoading || frameworkSelector === 'unknown'"
            @click="handleDeploy"
          />
          <v-btn
            variant="tonal"
            :text="t('components.deployHandler.cancelBtn')"
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
          {{ t("components.deployHandler.confirmDialog.title") }}
        </span>
      </template>

      <v-card-text class="mt-4">
        <v-alert
          variant="tonal"
          color="warning"
          class="mb-5"
          v-if="filesMightHaveMissed?.length"
        >
          Files [
          <template v-for="(fm, index) in filesMightHaveMissed">
            <strong>{{ fm }}</strong
            ><template v-if="index < filesMightHaveMissed.length - 1"
              >,
            </template></template
          >
          ] are required in the repository to use the auto deploy with
          <strong>{{ managerSelector }}</strong
          >-<strong>{{ frameworkSelected.name }}</strong>
        </v-alert>

        <!-- Main instruction message -->
        <p class="text-body-1 mb-4">
          {{ t("components.deployHandler.confirmDialog.message") }}
        </p>

        <!-- Files Section -->
        <div class="mb-6">
          <h3 class="text-subtitle-s font-weight-medium mb-2">
            {{ t("components.deployHandler.confirmDialog.filesSection") }}
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
            >
              <template #title>
                <div class="d-flex align-center ga-4">
                  <v-checkbox
                    v-model="fileInfo.isChecked"
                    color="success"
                    hide-details
                    @click.stop
                  ></v-checkbox>
                  <v-chip
                    :color="fileInfo.action === 'update' ? 'info' : 'success'"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{
                      fileInfo.action === "update"
                        ? t("components.deployHandler.confirmDialog.update")
                        : t("components.deployHandler.confirmDialog.create")
                    }}
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
            {{ t("components.deployHandler.confirmDialog.noChanges") }}
          </v-alert>
        </div>

        <!-- Environment Variables Section -->
        <div
          v-if="
            environmentVariables.length || originalEnvironmentVariables.length
          "
          class="mb-6"
        >
          <h3 class="text-subtitle-s font-weight-medium mb-2">
            {{ t("components.deployHandler.confirmDialog.envSection") }}
          </h3>
          <p
            v-if="environmentVariables.length"
            class="text-body-2 text-grey-darken-1 mb-2"
          >
            {{ t("components.deployHandler.confirmDialog.envDescription") }}
          </p>

          <!-- Added Variables -->
          <div v-if="envChanges.added.length" class="mb-2">
            <p class="text-body-2 font-weight-medium">Added Variables:</p>
            <v-alert
              v-for="(env, index) in envChanges.added"
              :key="`added-${index}`"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-1"
            >
              <span class="font-weight-medium">{{ env.key }}</span>
            </v-alert>
          </div>

          <!-- Modified Variables -->
          <div v-if="envChanges.modified.length" class="mb-2">
            <p class="text-body-2 font-weight-medium">Modified Variables:</p>
            <v-alert
              v-for="(env, index) in envChanges.modified"
              :key="`modified-${index}`"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-1"
            >
              <span class="font-weight-medium">{{ env.key }}</span>
            </v-alert>
          </div>

          <!-- Removed Variables -->
          <div v-if="envChanges.removed.length" class="mb-2">
            <p class="text-body-2 font-weight-medium">Removed Variables:</p>
            <v-alert
              v-for="(env, index) in envChanges.removed"
              :key="`removed-${index}`"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-1"
            >
              <span class="font-weight-medium">{{ env.key }}</span>
            </v-alert>
          </div>

          <!-- No changes message -->
          <v-alert
            v-if="
              !envChanges.added.length &&
              !envChanges.modified.length &&
              !envChanges.removed.length
            "
            type="info"
            variant="tonal"
            density="compact"
          >
            No changes to environment variables
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          v-if="
            injectFiles.length ||
            environmentVariables.length ||
            originalEnvironmentVariables.length
          "
          color="success"
          class="px-4"
          variant="tonal"
          @click="confirmDeploy"
        >
          {{ t("components.deployHandler.confirmDialog.continue") }}
        </v-btn>
        <v-btn variant="tonal" class="px-4" @click="cancelDeploy">
          {{ t("components.deployHandler.cancelBtn") }}
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
            ? t("components.deployHandler.nextStepsDialog.warningTitle")
            : deploymentInfo?.messages.length
            ? t("components.deployHandler.nextStepsDialog.successTitle")
            : t("components.deployHandler.nextStepsDialog.updateTitle")
        }}
      </v-card-title>

      <v-card-text v-if="deploymentInfo" class="py-0 pt-4">
        <!-- Files Committed Section -->
        <div class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2">
            {{
              t("components.deployHandler.nextStepsDialog.filesCommitted.title")
            }}
          </h3>
          <v-alert
            :type="deploymentInfo.filesCommitted.length ? 'info' : 'warning'"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{
              deploymentInfo.filesCommitted.length > 0
                ? t(
                    "components.deployHandler.nextStepsDialog.filesCommitted.success"
                  )
                : t(
                    "components.deployHandler.nextStepsDialog.filesCommitted.empty"
                  )
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

        <!-- Environment variables Section -->
        <div v-if="deploymentInfo.envs.length" class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2">
            {{ t("components.deployHandler.nextStepsDialog.envAdded.title") }}
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
          <h3 class="text-h6 font-weight-medium mb-2">
            {{ t("components.deployHandler.nextStepsDialog.notes.title") }}
          </h3>
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
          <h3 class="text-h6 font-weight-medium mb-2 text-error">
            {{ t("components.deployHandler.nextStepsDialog.errors.title") }}
          </h3>
          <v-alert type="error" variant="tonal" density="compact" class="mb-3">
            {{ t("components.deployHandler.nextStepsDialog.errors.message") }}
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
          {{
            deploymentInfo?.errors.length
              ? t("components.deployHandler.nextStepsDialog.closeReview")
              : t("components.deployHandler.nextStepsDialog.close")
          }}
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
  envKey,
} from "@/config/frameworks-config";
import type { CommitAction, CommitActionObject } from "@/libs/gitlab";
import { useSnackbarStore } from "@/stores/snackbar";

const authStore = useAuthStore();
const snackbarStore = useSnackbarStore();

const { t } = useLocale();
const { project } = defineProps<{ project: ProjectNode }>();

const deployDialog = ref(false);
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
const identificationFiles = ref<{ fileName: string; content: string }[]>([]);
const originalFiles = ref<{ fileName: string; content: string }[]>([]);
const injectFiles = ref<
  {
    fileName: string;
    content: string;
    action: CommitAction;
    isChecked: boolean;
  }[]
>([]);

const filesMightHaveMissed = computed(() => {
  const requiredByFramework = frameworkSelected.value.requiredFiles || [];

  const requiredByPackageManager =
    frameworkSelected.value.supportedManagers.find(
      (sm) => sm.manager === projectConfig.value.manager
    )?.requiredFiles || [];

  const requiredFilesForConfig = [
    ...new Set([...requiredByFramework, ...requiredByPackageManager]),
  ];

  return requiredFilesForConfig.filter(
    (f) =>
      !identificationFiles.value.find((id) => {
        if (typeof f === "string") {
          return id.fileName === f;
        }

        return f.find((fc) => id.fileName === fc);
      })
  );
});

type Env = {
  key: string;
  value: string;
  visible: boolean;
  protected?: boolean;
};
const originalEnvironmentVariables = ref<Env[]>([]);
const environmentVariables = ref<Env[]>([]);

const envChanges = ref<{
  added: Env[];
  modified: Env[];
  removed: Env[];
}>({
  added: [],
  modified: [],
  removed: [],
});

const updateEnvChanges = () => {
  envChanges.value = {
    added: [],
    modified: [],
    removed: [],
  };

  // Process new environment variables
  environmentVariables.value.forEach((newEnv) => {
    const origEnv = originalEnvironmentVariables.value.find(
      (e) => e.key === newEnv.key
    );

    if (!origEnv) {
      // New variable (added)
      envChanges.value.added.push(newEnv);
    } else if (origEnv.value !== newEnv.value) {
      // Existing variable with different value (modified)
      envChanges.value.modified.push(newEnv);
    }
  });

  // Find removed variables
  envChanges.value.removed = originalEnvironmentVariables.value.filter(
    (origEnv) =>
      !environmentVariables.value.some((newEnv) => newEnv.key === origEnv.key)
  );
};

const addEnv = () => {
  environmentVariables.value.push({ key: "", value: "", visible: false });
};

const removeEnv = (index: number) => {
  environmentVariables.value.splice(index, 1);
};

// Framework and package manager options
const frameworks = Object.values(frameworksConfig);
const packageManagersOptions = computed(() =>
  frameworksConfig[frameworkSelector.value].supportedManagers.map((m) => ({
    title: m.manager,
    value: m.manager,
  }))
);

const frameworkSelected = computed(
  () => frameworksConfig[frameworkSelector.value]
);

// Open deploy dialog and detect framework/language
const handleDeployBtn = async () => {
  if (!authStore.session)
    return snackbarStore.showSnackbar(
      t("components.deployHandler.script.errors.unauthorized"),
      "error"
    );

  isLoading.value = true;
  deployDialog.value = true;

  // Get envs
  const envs = await getEnvs();

  // Create deep copies of the array
  originalEnvironmentVariables.value = JSON.parse(JSON.stringify(envs));
  environmentVariables.value = JSON.parse(JSON.stringify(envs));

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

// Handle past environment variables directly from .env file
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
    .map((l) => l.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));

  const newVariables: { key: string; value: string; visible: boolean }[] = [];

  let isValidEnv = true;
  // Validate if the pasted lines are in valid .env format
  for (const line of envLines) {
    // If starts with #
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

// Deploy logic
const handleDeploy = async () => {
  if (!authStore.session) {
    return snackbarStore.showSnackbar(
      t("components.deployHandler.script.errors.unauthorized"),
      "error"
    );
  }

  // Validate envs
  const invalidEnvs = environmentVariables.value.filter(
    (e) => !e.key || !e.value
  );

  if (invalidEnvs.length) {
    return snackbarStore.showSnackbar(
      t("components.deployHandler.script.errors.invalidEnvs", {
        keys: invalidEnvs.map((e) => e.key).join(", "),
      }),
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
    return snackbarStore.showSnackbar(
      t("components.deployHandler.script.errors.fetchFilesFailed", {
        error: files.error,
      }),
      "error"
    );
  }

  originalFiles.value = files.data;

  // Create the files to insert in the repository
  const generatedFiles = await generateFiles(
    projectConfig.value,
    project,
    authStore.session.user.nickname
  );

  injectFiles.value = generatedFiles.reduce<
    {
      fileName: string;
      content: string;
      action: CommitAction;
      isChecked: boolean;
    }[]
  >((fs, file) => {
    const originalFile = originalFiles.value.find(
      (original) => original.fileName === file.fileName
    );

    if (!originalFile) {
      fs.push({
        ...file,
        action: "create",
        isChecked: true,
      });
    } else if (originalFile.content !== file.content) {
      fs.push({
        ...file,
        action: "update",
        isChecked: true,
      });
    }

    return fs;
  }, []);

  updateEnvChanges();

  isLoading.value = false;
  confirmDeployDialog.value = true; // Open confirmation dialog
};

// Confirm deployment
const confirmDeploy = async () => {
  confirmDeployDialog.value = false;
  if (!authStore.session) {
    return snackbarStore.showSnackbar(
      t("components.deployHandler.script.errors.unauthorized"),
      "error"
    );
  }

  isLoading.value = true;

  const encodeBase64 = (str: string) => {
    return btoa(
      new TextEncoder()
        .encode(str)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
  };

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

  // Try committing files
  if (actions.commit.length) {
    try {
      const commitUrl = `${env.GITLAB_URL}/api/v4/projects/${project.id}/repository/commits`;
      await axios.post(
        commitUrl,
        {
          branch: project.repository.rootRef,
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
      snackbarStore.showSnackbar(
        t("components.deployHandler.script.success.commitSuccess"),
        "success"
      );
    } catch (err) {
      let errorMessage = "Unknown error";
      if (err instanceof AxiosError || err instanceof Error) {
        errorMessage = err.message;
      }

      result.commit = { success: false, error: errorMessage };

      snackbarStore.showSnackbar(
        t("components.deployHandler.script.errors.commitFailed"),
        "error"
      );
      console.error("Commit error:", err);
    }
  }

  // Try updating environment variables
  try {
    if (actions.env) {
      await updateEnvs();

      result.env = { success: true };
      snackbarStore.showSnackbar(
        t("components.deployHandler.script.success.envUpdateSuccess"),
        "success"
      );
    }
  } catch (err) {
    let errorMessage = "Unknown error";
    if (err instanceof AxiosError || err instanceof Error) {
      errorMessage = err.message;
    }

    result.env = { success: false, error: errorMessage };

    snackbarStore.showSnackbar(
      t("components.deployHandler.script.errors.envUpdateFailed"),
      "error"
    );
    console.error("Env update error:", err);
  }

  // Set Deployment Info based on results
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

  // Determine overall deployment status and set messages/errors
  const hasCommitAttempt = actions.commit.length > 0;
  const hasEnvAttempt = actions.env;
  const commitSuccess = result.commit?.success ?? !hasCommitAttempt; // Success if no commit needed
  const envSuccess = result.env?.success ?? !hasEnvAttempt; // Success if no env update needed

  if (commitSuccess && envSuccess) {
    if (hasCommitAttempt || hasEnvAttempt) {
      deploymentInfo.value.messages.push(
        t("components.deployHandler.script.success.deployMessages.deploying"),
        t("components.deployHandler.script.success.deployMessages.firstDeploy"),
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
  nextStepsDialog.value = true; // Show dialog regardless of success/failure
};

// Update or create environment variables in GitLab
const updateEnvs = async () => {
  if (!authStore.session) return;

  const existingEnvs = await getEnvs();

  const url = `${env.GITLAB_URL}/api/v4/projects/${project.id}/variables`;
  const config = {
    headers: {
      Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
    },
  };

  if (environmentVariables.value.length === 0) {
    // Delete
    if (existingEnvs.length === 0) return; // There are no envs to delete

    return await axios.delete(url + `/${envKey}`, config);
  }

  const body = {
    key: envKey,
    value: environmentVariables.value
      .map((e) => `${e.key}=${e.value}`)
      .join("\n"),
    description: "Generated in the Auto CI/CD App",
    variable_type: "file",
  };

  // Upsert
  if (existingEnvs.length) {
    // Update
    return await axios.put(url + `/${envKey}`, body, config);
  }

  // Insert
  return await axios.post(url, body, config);
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
      frameworkFileMap.set(framework.id, framework);

      if (typeof config.file === "string") {
        allConfigFiles.add(config.file);
      } else {
        config.file.forEach((cf) => allConfigFiles.add(cf));
      }
    });
  }

  if (allConfigFiles.size === 0) return getDefaultProjectConfig("unknown");

  for (const framework of Object.values(frameworksConfig)) {
    if (!framework.langs?.includes(mainLang)) continue;

    // Package Managers
    framework.supportedManagers.forEach((manager) => {
      packageManagers[manager.manager].detectionFiles.forEach((df) =>
        allConfigFiles.add(df.file)
      );
    });

    // Required FIles
    framework.requiredFiles?.forEach((f) => {
      if (typeof f === "string") {
        allConfigFiles.add(f);
      } else {
        f.forEach((cf) => allConfigFiles.add(cf));
      }
    });
  }

  const files = await getRepositoryFiles(Array.from(allConfigFiles));
  if (!files.success) return getDefaultProjectConfig("unknown");
  identificationFiles.value = files.data;

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
        framework.supportedManagers.some((sm) => sm.manager === detectedManager)
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
  if (!authStore.session) return [];

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
    if (error instanceof AxiosError) {
      if (error.status !== 404) {
        console.error("Unknown Error", error);

        snackbarStore.showSnackbar(error.message, "error");
        throw error;
      }
    } else {
      console.error(error);
    }
  }

  return [];
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
