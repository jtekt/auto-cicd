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
      <!-- <template v-slot:title>{{ t("actionNeededTitle") }}</template> -->
      <template #title> Actions needed to deploy the app </template>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(action, index) in actionNeeded" :key="index">
            {{ index + 1 }}.
            {{ action.descripton }}
            <a v-if="action.link" :href="action.link.url" target="_blank">{{
              action.link.text
            }}</a
            >{{ action.posDescription }}.
          </v-list-item>
        </v-list>
        <RouterLink to="/faq#move-project">
          How to move a project to another group
        </RouterLink>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="actionNeededDialog = false">
          {{ t("close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
                  v-if="item.raw.image.type === 'img'"
                  :src="`${item.raw.image.value}`"
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
          <v-expansion-panels v-if="projectConfig.id !== 'unknown'">
            <v-expansion-panel>
              <v-expansion-panel-title>
                Build and Output Settings
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="mb-4 text-subtitle-2 font-weight-light">
                  These are the default configurations for a
                  <strong>{{ projectConfig.name }}</strong> project. If your
                  project requires different settings, you can modify them as
                  needed
                </p>
                <v-text-field
                  v-model="projectConfig.rootDir"
                  label="Root Directory"
                  variant="outlined"
                  :class="
                    projectConfig.rootDir ===
                    selectedFrameworkOriginalConfig.rootDir
                      ? ''
                      : 'text-warning'
                  "
                />
                <v-text-field
                  v-model="projectConfig.buildCommand"
                  label="Build Command"
                  variant="outlined"
                  :class="
                    projectConfig.buildCommand ===
                    selectedFrameworkOriginalConfig.buildCommand
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
                    selectedFrameworkOriginalConfig.outputDir
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
                    selectedFrameworkOriginalConfig.installCommand
                      ? ''
                      : 'text-warning'
                  "
                >
                  <p />
                </v-text-field>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </template>

      <!-- Actions and Deploy Button -->
      <template #actions>
        <v-btn
          color="success"
          variant="tonal"
          :text="t('pages.home.deploy.deploy')"
          :disabled="projectConfig.id === 'unknown'"
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
      <template #title>
        {{ t("pages.home.deploy.confirmDeployTitle") }}
      </template>
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

  <!-- Next Steps Dialog (show after deployment) -->
  <v-dialog
    v-model="nextStepsDialog"
    width="500"
    max-width="90vw"
    max-height="90vh"
  >
    <v-card>
      <template #title> Process Completed! </template>
      <v-card-text>
        <v-alert variant="tonal">
          <p v-for="m in nextStepsMessages" :key="m">
            {{ m }}
          </p>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="nextStepsDialog = false">
          {{ t("close") }}
        </v-btn>
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
import axios, { AxiosError } from "axios";
import { env } from "@/config/env";
import AppLoader from "./AppLoader.vue";
import { useLocale } from "vuetify";
import type { ProjectNode } from "@/types/project";
import { generateFiles } from "@/libs/templates";
import frameworksConfig, {
  acceptedJavascriptManagers,
  type AcceptedFrameworks,
  type ManagedFile,
  type ProjectConfig,
} from "@/config/frameworks-config";

const { t } = useLocale();

const { project } = defineProps<{ project: ProjectNode }>();

const dialog = ref(false);
const actionNeededDialog = ref(false);
const actionNeeded = ref<
  {
    link?: {
      text: string;
      url: string;
    };
    descripton: string;
    posDescription?: string;
  }[]
>([]);
const confirmDeployDialog = ref(false);
const nextStepsDialog = ref(false);

const nextStepsMessages = ref<string[]>([]);

const frameworkSelector = ref<AcceptedFrameworks>("unknown");

const frameworks = Object.values(frameworksConfig);

const projectConfig = ref<ProjectConfig>({
  ...frameworksConfig.unknown,
});

const selectedFrameworkOriginalConfig = computed(() => {
  const originalConfig = frameworks.find(
    (f) => f.id === projectConfig.value.id
  );

  if (originalConfig) return originalConfig;

  return frameworksConfig.unknown;
});

const originalFiles = ref<{ fileName: ManagedFile; content: string }[]>([]);

const injectFiles = ref<
  { fileName: ManagedFile; content: string; action?: CommitActions }[]
>([]);

const error = ref<string[] | null>(null);

const isLoading = ref<boolean>(false);

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

const authStore = useAuthStore();

type CommitActions = "create" | "update" | "delete" | "move" | "chmod";

// Called to open the dialog
const handleDeployBtn = async () => {
  if (!authStore.session) {
    return showSnackbar("Error: Unauthorized", "error");
  }

  // Determine if and what actions the user needs to take
  actionNeeded.value = [];
  if (
    !project.namespace ||
    !env.ALLOWED_NAMESPACES.includes(project.namespace.fullPath.split("/")[0])
  ) {
    actionNeeded.value.push({
      descripton:
        "The project is not in an allowed group. Please transfer the project to an approved group. If you do not have access to the allowed group, request access using the following link:",
      link: {
        url: `${env.GITLAB_URL}/${env.ALLOWED_NAMESPACES[0]}`,
        text: "Allowed Group",
      },
      posDescription: ", then move your project to the new group",
    });
    // actionNeeded.value.push(t("actionNeeded.changeNamespace"));
  }

  if (actionNeeded.value.length > 0) {
    return (actionNeededDialog.value = true);
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
    return showSnackbar(
      "You can only deploy if choose one framework",
      "warning"
    );
  }

  // Validate commands
  const res = invalidCommands();
  if (res.length > 0)
    return showSnackbar(
      "The commands are not accepted: " + res.join(", "),
      "warning"
    );

  injectFiles.value = [];

  // Check if the files have been changed
  const files = await getRepositoryFiles(projectConfig.value.files);

  if (!files.success) {
    return showSnackbar("Error: " + files.error, "error");
  }

  originalFiles.value = files.data;

  // Create the files to insert in the repository
  const generatedFiles = await generateFiles(projectConfig.value, project);

  injectFiles.value = generatedFiles.reduce<
    {
      fileName: ManagedFile;
      content: string;
      action: CommitActions;
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

const invalidCommands = (): string[] => {
  const errors: string[] = [];

  // TODO: Add to other languages
  if (["vite", "express", "nuxt"].includes(projectConfig.value.id)) {
    // Validate install
    const installPackageManager =
      projectConfig.value.installCommand?.split(" ")[0];
    if (
      !installPackageManager ||
      !acceptedJavascriptManagers.includes(installPackageManager)
    ) {
      errors.push(
        `JavaScript package manager "${installPackageManager}"" is not accepted for install`
      );
    }

    // Validate build
    const buildPackageManager = projectConfig.value.buildCommand?.split(" ")[0];
    if (
      !buildPackageManager ||
      !acceptedJavascriptManagers.includes(buildPackageManager)
    ) {
      errors.push(
        `JavaScript package manager "${buildPackageManager}"" is not accepted for build`
      );
    }

    // Validate root
    const rootDir = projectConfig.value.rootDir?.split(" ")[0];
    if (!rootDir || !rootDir.startsWith("./")) {
      errors.push(`Root Directory "${rootDir}"" is not accepted`);
    }
  }

  return errors;
};

const cancelDeploy = () => {
  confirmDeployDialog.value = false;
};

const confirmDeploy = async () => {
  confirmDeployDialog.value = false;

  if (!authStore.session) {
    return showSnackbar("Error: Unauthorized.", "error");
  }

  if (projectConfig.value.id === "unknown") {
    return showSnackbar(
      "You can only deploy if choose one framework",
      "warning"
    );
  }

  // Base64 encode the contents of the Dockerfile and .gitlab-ci.yml
  const encodeBase64 = (str: string): string => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    let binary = "";
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const commitActions: {
    action: CommitActions;
    file_path: string;
    content: string;
    encoding: string;
  }[] = [];

  injectFiles.value.forEach((f) => {
    if (!f.action) return;

    return commitActions.push({
      action: f.action, // Update if exists, else create
      file_path: f.fileName,
      content: encodeBase64(f.content),
      encoding: "base64",
    });
  });

  try {
    // If no changes were made to either file, show a message to the user
    if (commitActions.length === 0) {
      return showSnackbar(
        "No changes detected, there is no need for a deployment",
        "info"
      );
    }

    const commitMessage = `Auto-generated [${commitActions
      .map((c) => c.file_path)
      .join(", ")}] for auto CI/CD setup`;

    // GitLab API endpoint to commit changes
    const commitUrl = `${env.GITLAB_URL}/api/v4/projects/${project.id}/repository/commits`;

    // Make API request to commit the Dockerfile and GitLab CI file
    await axios.post(
      commitUrl,
      {
        branch: project.repository.rootRef,
        commit_message: commitMessage,
        actions: commitActions,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      }
    );

    // If commit is successful, show success message
    showSnackbar(commitMessage, "success");

    nextStepsMessages.value = [
      "The deployment has been successfully completed, and the following files have been inserted into your repository:",
      ...commitActions.map((c, i) => `${i + 1}. ${c.file_path} - ${c.action}`),
      "You can now review the changes by checking the job logs in GitLab. If this is your first deployment, you will also receive an email with the URL to your project.",
    ];

    // Close the dialog after deployment
    dialog.value = false;

    // Show the next steps dialog after a successful deployment
    setTimeout(() => {
      nextStepsDialog.value = true; // Show the next steps dialog
    }, 2000);
  } catch (err) {
    console.error("Deployment error:", err);
    snackbar.value = {
      show: true,
      text: "Failed to deploy. Please check the logs or try again.",
      color: "error",
    };
  }
};

const handleChangeConfig = (id: string | null) => {
  if (!id) return (projectConfig.value = { ...frameworksConfig.unknown });

  if (projectConfig.value.id === id) return;

  projectConfig.value = {
    ...(frameworksConfig[id] || frameworksConfig.unknown),
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
    }>(`${env.GITLAB_URL}/api/graphql`, query, {
      headers: {
        Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        "Content-Type": "application/json",
      },
    });

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
  const langs = [...project.languages].sort((a, b) => b.share - a.share);

  if (langs.length === 0) {
    return (projectConfig.value = {
      ...frameworksConfig.unknown,
    });
  }

  const mainLang = langs[0].name.toLowerCase();

  // Loop through all frameworks in frameworksConfig to find a match
  for (const framework of Object.keys(frameworksConfig)) {
    const frameworkConfig = frameworksConfig[framework];

    // Check if the main language matches any of the supported languages for this framework
    if (frameworkConfig.langs && frameworkConfig.langs.includes(mainLang)) {
      let isFrameworkMatch = false;

      // Check framework-specific conditions
      if (frameworkConfig.configFiles) {
        const configFileContent = await getRepositoryFiles(
          frameworkConfig.configFiles.map((f) => f.file)
        );

        if (configFileContent.success) {
          for (let i = 0; i < configFileContent.data.length; i++) {
            const element = configFileContent.data[i];

            const lookFor = frameworkConfig.configFiles?.find(
              (e) => e.file === element.fileName
            );

            if (!lookFor) continue;

            if (!element.content.includes(lookFor.checkFor)) continue;

            isFrameworkMatch = true;
            break;
          }
        }
      }

      if (isFrameworkMatch) {
        return (projectConfig.value = { ...frameworkConfig });
      }
    }
  }

  // Default unknown framework if no match
  return (projectConfig.value = {
    ...frameworksConfig.unknown,
  });
};

// Helper function to show snackbar messages
const showSnackbar = (
  message: string,
  color: "success" | "error" | "warning" | "info"
) => {
  snackbar.value = {
    show: true,
    text: message,
    color: color,
  };
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
