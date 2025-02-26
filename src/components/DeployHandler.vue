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
  <v-dialog v-model="dialog" width="500" max-width="90vw" max-height="90vh">
    <v-card style="height: 100%; width: 100%">
      <template #title>
        <h3 class="text-lg-center">Deploy Project</h3>
      </template>

      <!-- Loading and error handling -->
      <v-row v-if="isLoading" justify="center" align="center" class="pa-4">
        <AppLoader />
      </v-row>
      <div v-else-if="error" class="pa-5">
        <v-alert type="error" variant="tonal">
          <p>{{ error }}</p>
        </v-alert>
      </div>

      <!-- Configuration Form -->
      <template v-else>
        <div
          style="
            margin-left: auto;
            margin-right: auto;
            max-width: 400px;
            width: 100%;
            margin-bottom: 24px;
          "
        >
          <v-btn
            variant="outlined"
            :href="project.webUrl"
            target="_blank"
            width="100%"
            height="60"
            class="pa-4 mb-5 text-h6 font-weight-bold"
          >
            {{ project.name }}
          </v-btn>

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
            v-model="managerSelector"
            :items="packageManagersOptions"
            item-title="title"
            item-value="value"
            label="Select Package Manager"
            variant="outlined"
            @update:model-value="handleChangeManager"
          />

          <!-- Build and Output Settings -->
          <v-expansion-panels v-if="frameworkSelector !== 'unknown'">
            <v-expansion-panel>
              <v-expansion-panel-title
                >Build and Output Settings</v-expansion-panel-title
              >
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  These are the default configurations for a
                  <strong>{{
                    frameworksConfig[frameworkSelector].name
                  }}</strong>
                  project. If your project requires different settings, you can
                  modify them as needed.
                </p>
                <v-text-field
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
                  v-if="projectConfig.language === 'javascript'"
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
          </v-expansion-panels>
        </div>
      </template>

      <!-- Actions -->
      <template #actions>
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
    <v-card prepend-icon="mdi-check-all">
      <template #title>{{
        t("pages.home.deploy.confirmDeployTitle")
      }}</template>
      <v-card-text>
        <template v-if="injectFiles.length > 0">
          <p>{{ t("pages.home.deploy.confirmDeployMessage") }}</p>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(fileInfo, index) in injectFiles"
              :key="index"
            >
              <template #title>
                <div class="d-flex flex-column">
                  <h4
                    :class="`font-weight-bold ${
                      fileInfo.action === 'update'
                        ? 'text-info'
                        : 'text-success'
                    }`"
                  >
                    {{ fileInfo.fileName }}
                  </h4>
                </div>
              </template>
              <template #text>
                <CodeEditor
                  :default-value="fileInfo.content"
                  max-height="300"
                  readonly
                  style="font-size: 12px"
                />
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
        <p v-else class="text-warning">
          {{ t("pages.home.deploy.noChangesMade") }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="injectFiles.length > 0"
          color="primary"
          variant="tonal"
          @click="confirmDeploy"
        >
          {{ t("pages.home.deploy.continue") }}
        </v-btn>
        <v-btn variant="tonal" @click="cancelDeploy">
          {{ t("pages.home.deploy.cancel") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Next Steps Dialog -->
  <v-dialog v-model="nextStepsDialog" max-width="600px">
    <v-card>
      <v-card-title class="headline">
        Deployment Completed Successfully! 🎉
      </v-card-title>
      <v-card-text v-if="deploymentInfo">
        <v-row>
          <v-col>
            <strong>Files Committed:</strong>
            <v-list>
              <v-list-item>
                <v-list-item-title
                  v-for="f in deploymentInfo.filesCommitted"
                  :key="f"
                  >{{ f }}</v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <v-divider></v-divider>

        <v-row>
          <v-col>
            <strong>Important Notes:</strong>
            <v-list dense>
              <v-list-item v-for="f in deploymentInfo.messages" :key="f">
                <v-list-item-title>{{ f }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <v-divider></v-divider>

        <v-row>
          <v-col>
            <strong>Next Steps:</strong>
            <v-list dense>
              <v-list-item v-for="s in deploymentInfo.nextSteps" :key="s">
                <v-list-item-title>{{ s }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import { env } from "@/config/env";
import AppLoader from "./AppLoader.vue";
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

const { t } = useLocale();
const { project } = defineProps<{ project: ProjectNode }>();

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
  nextSteps: string[];
} | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const snackbar = ref({ show: false, text: "", color: "success" });

const frameworkSelector = ref<AcceptedFramework>("unknown");
const managerSelector = ref<AcceptedPackageManager>("npm");
const projectConfig = ref<ProjectConfig>(getDefaultProjectConfig("unknown"));
const originalFiles = ref<{ fileName: string; content: string }[]>([]);
const injectFiles = ref<
  { fileName: string; content: string; action: CommitAction }[]
>([]);

const authStore = useAuthStore();

// Framework and package manager options
const frameworks = Object.values(frameworksConfig);
const packageManagersOptions = computed(() =>
  frameworksConfig[frameworkSelector.value].supportedManagers.map((m) => ({
    title: m,
    value: m,
  }))
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

  if (commitActions.length === 0)
    return showSnackbar("No changes to deploy", "info");

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

    deploymentInfo.value = {
      filesCommitted: commitActions.map((a) => a.file_path),
      messages: [
        "Your project will be deployed within a few minutes.",
        "If this is your first auto deployment, you will receive an email with the URL of your application.",
        "You can track the progress of your build by accessing the GitLab project under Build > Pipelines.",
      ],
      nextSteps: [
        "Make sure to pull from GitLab into your local branch to stay updated with the latest changes.",
      ],
    };

    dialog.value = false;
    nextStepsDialog.value = true;
  } catch (err) {
    showSnackbar("Deployment failed", "error");
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

// Snackbar helper
const showSnackbar = (text: string, color: string) => {
  snackbar.value = { show: true, text, color };
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
