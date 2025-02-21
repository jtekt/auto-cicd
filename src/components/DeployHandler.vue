<template>
  <div class="text-center pa-4">
    <v-btn :color="'success'" variant="tonal" @click="handleDeployBtn()">
      <v-icon start icon="mdi-rocket-launch-outline"></v-icon>
      {{ t("pages.home.deploy.deploy") }}
    </v-btn>

    <v-dialog v-model="dialog" width="900" max-width="90vw" max-height="90vh">
      <v-card style="height: 100%; width: 100%" prepend-icon="mdi-update">
        <template v-slot:title> Deploy </template>

        <!-- Loading and error handling -->
        <v-row v-if="isLoading" justify="center" align="center" class="pa-4">
          <AppLoader />
        </v-row>

        <div v-else-if="error" class="pa-5">
          <v-alert type="error" variant="tonal">
            <p>{{ error }}</p>
          </v-alert>
        </div>

        <template v-else>
          <div
            style="
              margin-left: auto;
              margin-right: auto;
              max-width: 400px;
              width: 100%;
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
            <v-select
              v-model="frameworkSelector"
              :items="frameworks"
              item-title="name"
              item-value="id"
              label="Select Framework"
              variant="outlined"
              :error="projectConfig.id === 'unknown'"
              @update:model-value="handleChangeConfig"
            >
              <template #selection="{ item }">
                <div class="d-flex align-center" style="gap: 16px">
                  <v-img
                    :src="`${item.raw.image}`"
                    alt="Framework Image"
                    width="28"
                  />
                  {{ item.raw.name }}
                </div>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  class="d-flex align-center pa-2"
                  style="gap: 16px"
                  :prepend-avatar="item.raw.image"
                >
                </v-list-item>
              </template>
            </v-select>
            <v-expansion-panels :disabled="projectConfig.id === 'unknown'">
              <v-expansion-panel>
                <v-expansion-panel-title
                  >Build and Output Settings</v-expansion-panel-title
                >
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="projectConfig.rootDir"
                    label="Root Directory"
                    variant="outlined"
                    :class="
                      projectConfig.rootDir ===
                      selectedFrameworkOriginalConfig.rootDir
                        ? 'font-weight-thin'
                        : ''
                    "
                  ></v-text-field>
                  <v-text-field
                    v-model="projectConfig.buildCommand"
                    label="Build Command"
                    variant="outlined"
                    :class="
                      projectConfig.buildCommand ===
                      selectedFrameworkOriginalConfig.buildCommand
                        ? 'font-weight-thin'
                        : ''
                    "
                  ></v-text-field>
                  <v-text-field
                    v-model="projectConfig.outputDir"
                    label="Output Directory"
                    variant="outlined"
                    :class="
                      projectConfig.outputDir ===
                      selectedFrameworkOriginalConfig.outputDir
                        ? 'font-weight-thin'
                        : ''
                    "
                  ></v-text-field>
                  <v-text-field
                    v-model="projectConfig.installCommand"
                    label="Install Command"
                    variant="outlined"
                    :class="
                      projectConfig.installCommand ===
                      selectedFrameworkOriginalConfig.installCommand
                        ? 'font-weight-thin'
                        : ''
                    "
                  ></v-text-field
                ></v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </template>

        <!-- Actions and Deploy Button -->
        <template v-slot:actions>
          <v-btn
            color="success"
            variant="tonal"
            :text="t('pages.home.deploy.deploy')"
            @click="handleDeploy"
            :disabled="projectConfig.id === 'unknown'"
          ></v-btn>
          <v-btn
            variant="tonal"
            :text="t('pages.home.deploy.cancel')"
            @click="dialog = false"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <v-dialog
      v-model="confirmDeployDialog"
      persistent
      width="600"
      max-width="90vw"
      max-height="90vh"
    >
      <v-card prepend-icon="mdi-check-all">
        <template v-slot:title>
          {{ t("pages.home.deploy.confirmDeployTitle") }}
        </template>
        <v-card-text>
          <template v-if="deployFileInfo.length > 0">
            <p>{{ t("pages.home.deploy.confirmDeployMessage") }}</p>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="(fileInfo, index) in deployFileInfo"
                :key="index"
              >
                <template v-slot:title>
                  <div class="d-flex flex-column">
                    <h4>{{ fileInfo.file }}</h4>
                    <p
                      :class="`font-weight-bold ${
                        fileInfo.action === 'update'
                          ? 'text-info'
                          : 'text-success'
                      }`"
                    >
                      {{ fileInfo.action }}
                    </p>
                  </div>
                </template>
                <template v-slot:text>
                  <CodeEditor
                    :defaultValue="getDeployableFile(fileInfo.file)"
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
            v-if="deployFileInfo.length > 0"
            color="primary"
            variant="tonal"
            >{{ t("pages.home.deploy.continue") }}</v-btn
          >
          <v-btn variant="tonal" @click="cancelDeploy()">{{
            t("pages.home.deploy.cancel")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Next Steps Dialog (show after deployment) -->
    <v-dialog
      v-model="nextStepsDialog"
      width="500"
      max-width="90vw"
      max-height="90vh"
    >
      <v-card>
        <template v-slot:title>
          {{ t("nextStepsTitle") }}
        </template>
        <v-card-text>
          <v-alert variant="tonal">
            <p>{{ t("nextStepsMessage1") }}</p>
            <p>{{ t("nextStepsMessage2") }}</p>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="nextStepsDialog = false">{{
            t("close")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="6000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios, { AxiosError } from "axios";
import { env } from "@/config/env";
import AppLoader from "./AppLoader.vue";
import { useLocale } from "vuetify";
import type { Project } from "@/types/project";
import { generateDockerfile } from "@/libs/templates/dockerfile-template";
import { generateFiles } from "@/libs/templates";

const { t } = useLocale();

const { project } = defineProps<{ project: Project }>();

const dialog = ref(false);
const confirmDeployDialog = ref(false);
const nextStepsDialog = ref(false);

type AcceptedFrameworks = "vite" | "fastapi" | "unknown";

const frameworkSelector = ref<AcceptedFrameworks>("unknown");

export type ManagedFile =
  | "Dockerfile"
  | ".gitlab-ci.yml"
  | "nginx.conf"
  | "kubernetes_manifest.yml";

export type ProjectConfig = {
  id: AcceptedFrameworks;
  name: string;
  image: string;

  // Config
  buildCommand: string;
  installCommand: string;
  outputDir: string;
  rootDir: string;

  // Deploy
  files: ManagedFile[];
};

const viteConfig: ProjectConfig = {
  id: "vite",
  name: "Vite",
  image: "/icons/Vite.js.svg",

  buildCommand: "npm run build",
  installCommand: "npm install",
  outputDir: "dist",
  rootDir: "./",

  files: [
    ".gitlab-ci.yml",
    "Dockerfile",
    "kubernetes_manifest.yml",
    "nginx.conf",
  ],
};

const fastapiConfig: ProjectConfig = {
  id: "fastapi",
  name: "FastAPI",
  image: "/icons/FastAPI.svg",

  buildCommand: "uvicorn app:app --reload",
  installCommand: "pip install -r requirements.txt",
  outputDir: "static",
  rootDir: "./",

  files: [".gitlab-ci.yml", "Dockerfile", "kubernetes_manifest.yml"],
};

const unknownConfig: ProjectConfig = {
  id: "unknown",
  name: "Unknown",
  image: "react.png",

  buildCommand: "npm run build",
  installCommand: "npm install",
  outputDir: "dist",
  rootDir: "./",

  files: [],
};

const frameworks: ProjectConfig[] = [viteConfig, fastapiConfig, unknownConfig];

const projectConfig = ref<ProjectConfig>({
  ...unknownConfig,
});

const selectedFrameworkOriginalConfig = computed(
  () => frameworks.find((f) => f.id === projectConfig.value.id) || unknownConfig
);

const originalFiles = ref<{ fileName: ManagedFile; content: string }[]>([]);

const injectFiles = ref<{ fileName: ManagedFile; content: string }[]>([]);

const error = ref<string[] | null>(null);

const isLoading = ref<boolean>(false);

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

const authStore = useAuthStore();

// Tracks the information of files that will be inserted or updated
const deployFileInfo = ref<{ file: ManagedFile; action: string }[]>([]);

// Called to open the dialg
const handleDeployBtn = async () => {
  if (!authStore.session) {
    return (snackbar.value = {
      show: true,
      text: "Error: Unauthorized",
      color: "error",
    });
  }

  dialog.value = true;
  isLoading.value = true;

  const projectConfigLang = await identifyProjectLanguage();

  // Set the project config
  projectConfig.value = projectConfigLang;

  // Set the select
  frameworkSelector.value = projectConfigLang.id;

  isLoading.value = false;
};

const handleDeploy = async () => {
  if (projectConfig.value.id === "unknown") {
    return (snackbar.value = {
      color: "warning",
      show: true,
      text: "You can only deploy if choose one framework",
    });
  }
  // Prepare file changes info for the confirmation dialog
  deployFileInfo.value = [];

  // Check if the files have been changed
  const files = await getRepositoryFiles(projectConfig.value.files);

  if (!files.success) {
    return (snackbar.value = {
      color: "error",
      show: true,
      text: "Error: " + files.error,
    });
  }

  originalFiles.value = files.data;

  // Create the files to insert in the repository
  injectFiles.value = generateFiles(projectConfig.value);

  injectFiles.value.forEach((f, i) => {
    const originalFile = originalFiles.value.find(
      (f) => f.fileName === f.fileName
    );

    if (!originalFile) {
      return deployFileInfo.value.push({
        file: f.fileName,
        action: "insert",
      });
    } else if (originalFile.content !== f.content) {
      return deployFileInfo.value.push({
        file: f.fileName,
        action: "update",
      });
    }
  });

  confirmDeployDialog.value = true; // Open confirmation dialog
};

const cancelDeploy = () => {
  confirmDeployDialog.value = false;
};

const handleChangeConfig = (id: string | null) => {
  if (!id) return (projectConfig.value = { ...unknownConfig });

  if (projectConfig.value.id === id) return;

  projectConfig.value = {
    ...(frameworks.find((f) => f.id === id) || unknownConfig),
  };
};

const getRepositoryFiles = async (
  filesPaths: string[]
): Promise<
  | {
      success: true;
      data: { fileName: ManagedFile; content: string }[];
      error: null;
    }
  | { success: false; data: null; error: string }
> => {
  if (!authStore.session) {
    return {
      success: false,
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    const query = {
      query: `{
        project(fullPath: "${project.fullPath}") {
          repository {
            blobs(ref: "${
              project.repository.rootRef
            }", paths: ["${filesPaths.join('", "')}"]) {
              edges {
                node {
                  name
                  rawBlob
                }
              }
            }
          }
        }
      }`,
    };

    const res = await axios.post<{
      data: {
        project: {
          repository: {
            blobs: {
              edges: Array<{
                node: {
                  name: ManagedFile;
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
      query,

      {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: res.data.data.project.repository.blobs.edges.map((n) => ({
        fileName: n.node.name,
        content: n.node.rawBlob,
      })),
      error: null,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  return {
    success: false,
    data: null,
    error: "Unknown",
  };
};

const identifyProjectLanguage = async () => {
  const langs = project.languages.sort((a, b) => b.share - a.share);
  const mainLang = langs[0].name.toLowerCase();

  // JavaScript-based projects
  if (["vue", "tsx", "jsx", "javascript", "typescript"].includes(mainLang)) {
    // Check if it's a JavaScript project with Vite
    const packageJsonContent = await getFileContent("package.json");

    if (packageJsonContent && packageJsonContent.includes("vite")) {
      return (projectConfig.value = { ...viteConfig });
    }
  }

  // Python-based projects
  else if (["python"].includes(mainLang)) {
    // Check if FastAPI is present in the project (e.g., in requirements.txt or setup.py)
    const requirementsContent = await getFileContent("requirements.txt");

    if (requirementsContent && requirementsContent.includes("fastapi")) {
      return (projectConfig.value = { ...fastapiConfig });
    }

    const setupPyContent = await getFileContent("setup.py");
    if (setupPyContent && setupPyContent.includes("fastapi")) {
      return (projectConfig.value = { ...fastapiConfig });
    }
  }

  // Default unknown framework
  return (projectConfig.value = { ...unknownConfig });
};

const getFileContent = async (filePath: string): Promise<string> => {
  try {
    const res = await axios.get<string>(
      `${env.GITLAB_URL}/api/v4/projects/${
        project.id
      }/repository/files/${encodeURIComponent(filePath)}/raw`,
      {
        headers: {
          Authorization: `Bearer ${authStore.session?.auth_token.access_token}`,
        },
      }
    );

    return JSON.stringify(res.data);
  } catch (error) {
    if (error instanceof AxiosError && error.status === 404) {
      return "";
    }

    throw error;
  }
};

const getDeployableFile = (fileName: ManagedFile) => {
  const file = injectFiles.value.find((f) => f.fileName === fileName);

  if (!file) return;

  return file.content;
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
