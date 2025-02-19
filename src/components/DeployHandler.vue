<template>
  <div class="text-center pa-4">
    <v-btn :color="'success'" variant="tonal" @click="handleDeployBtn()">
      <v-icon start icon="mdi-rocket-launch-outline"></v-icon>
      {{ t("pages.home.deploy.deploy") }}
    </v-btn>

    <v-dialog v-model="dialog" width="900" max-width="90vw" max-height="90vh">
      <v-card style="height: 100%; width: 100%" prepend-icon="mdi-update">
        <template v-slot:title>
          {{ t("pages.home.deploy.deploy") }}
          <strong style="text-transform: capitalize">{{ project.name }}</strong>
        </template>

        <div v-if="!dockerLoadingError" class="pa-4">
          <v-alert type="info" variant="tonal">
            <p v-for="i in 3">
              {{ t("pages.home.deploy.info." + i) }}
            </p>
          </v-alert>
        </div>

        <v-row
          v-if="isDockerLoading"
          justify="center"
          align="center"
          class="pa-4"
        >
          <AppLoader />
        </v-row>

        <div v-else-if="dockerLoadingError" class="pa-5">
          <v-alert type="error" variant="tonal">
            <p>{{ dockerLoadingError }}</p>
          </v-alert>
        </div>

        <template v-else>
          <div class="px-4 flex-1">
            <div class="d-flex justify-end align-center pb-4" style="gap: 8px">
              <h3 class="mr-auto">.Dockerfile</h3>
              <v-btn
                v-if="originalDockerfile !== editedDockerfile"
                color="error"
                variant="tonal"
                @click="handleClearDockerfile"
              >
                <v-icon start icon="mdi-cancel"></v-icon>
                {{
                  !!originalDockerfile
                    ? t("pages.home.deploy.resetOriginal")
                    : t("pages.home.deploy.reset")
                }}
              </v-btn>

              <v-btn color="primary" variant="tonal">
                {{ t("pages.home.deploy.template") }}

                <v-menu activator="parent" location="bottom end">
                  <v-list>
                    <v-list-item
                      v-for="(item, index) in dockerTemplates.templates"
                      :key="index"
                      :value="index"
                      @click="setEditDockerfile(item.raw)"
                    >
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <div>
                        <v-badge
                          v-for="l in item.languages"
                          :content="l"
                          inline
                          color="primary"
                          varian
                        >
                        </v-badge>
                      </div>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-btn>
            </div>

            <CodeEditor
              v-model="editedDockerfile"
              :placeholder="t('pages.home.deploy.codeEditor.placeholder')"
              max-height="400"
            />

            <p
              :class="`text-body-2 ${
                originalDockerfile && originalDockerfile !== editedDockerfile
                  ? 'text-info'
                  : 'text-transparent'
              }`"
            >
              {{ t("pages.home.deploy.codeEditor.originalChanged") }}
            </p>
          </div>
        </template>

        <!-- Actions and Deploy Button -->
        <template v-slot:actions>
          <v-btn
            color="success"
            variant="tonal"
            :text="t('pages.home.deploy.deploy')"
            @click="handleDeploy"
            :disabled="
              (!editedDockerfile || editedDockerfile.trim().length === 0) &&
              !originalDockerfile
            "
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
            @click="confirmDeploy()"
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
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios, { AxiosError } from "axios";
import dockerTemplates from "../templates/dockerfile-templates.json";
import { env } from "@/config/env";
import type { Project } from "@/views/index.vue";
import AppLoader from "./AppLoader.vue";
import { useLocale } from "vuetify";

const { t } = useLocale();

const { project } = defineProps<{ project: Project }>();

const dialog = ref(false);
const confirmDeployDialog = ref(false);
const nextStepsDialog = ref(false);

const editedDockerfile = ref<string | null>(null);
const originalDockerfile = ref<string | null>(null);
const dockerLoadingError = ref<string | null>(null);
const isDockerLoading = ref(false);
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});
const authStore = useAuthStore();

type ManagedFiles = ".Dockerfile" | ".gitlab-ci.yml" | ".dockerignore";

// Tracks the information of files that will be inserted or updated
const deployFileInfo = ref<{ file: ManagedFiles; action: string }[]>([]);

const handleDeployBtn = async () => {
  isDockerLoading.value = true;
  dialog.value = true;
  dockerLoadingError.value = null;

  if (originalDockerfile.value) {
    editedDockerfile.value = originalDockerfile.value;
    isDockerLoading.value = false;
    return;
  }

  // Check if original Dockerfile exists in the repository
  const dockerFileUrl = `${env.GITLAB_URL}/api/v4/projects/${project.id}/repository/files/.Dockerfile/raw`;

  try {
    const response = await axios.get(dockerFileUrl, {
      headers: {
        Authorization: `Bearer ${authStore.session?.auth_token.access_token}`,
      },
    });

    originalDockerfile.value = response.data;
    editedDockerfile.value = response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        originalDockerfile.value = null;
        editedDockerfile.value = null;
      } else {
        console.error(error);
        // Comunication error
        dockerLoadingError.value =
          error.response?.data || `Error ${error.code}: ${error.message}`;
      }
    }
  } finally {
    isDockerLoading.value = false;
  }
};

const handleDeploy = async () => {
  // Prepare file changes info for the confirmation dialog
  deployFileInfo.value = [];

  // Check if the Dockerfile has been changed
  const isDockerfileChanged =
    (editedDockerfile.value &&
      editedDockerfile.value !== originalDockerfile.value) ||
    (!originalDockerfile.value && editedDockerfile.value);

  if (isDockerfileChanged) {
    deployFileInfo.value.push({
      file: ".Dockerfile",
      action: originalDockerfile.value ? "update" : "insert",
    });
  }

  const existingCiFileContent = await getFileContent(".gitlab-ci.yml");
  if (!existingCiFileContent || existingCiFileContent !== autoCiFile) {
    deployFileInfo.value.push({
      file: ".gitlab-ci.yml",
      action: existingCiFileContent ? "update" : "insert",
    });
  }

  // Check if the .dockerignore file needs to be created/updated
  const existsDockerignore = await getFileContent(".dockerignore");
  if (!existsDockerignore) {
    deployFileInfo.value.push({
      file: ".dockerignore",
      action: "insert",
    });
  }

  confirmDeployDialog.value = true; // Open confirmation dialog
};

const confirmDeploy = async () => {
  confirmDeployDialog.value = false;

  if (!authStore.session) {
    snackbar.value = {
      show: true,
      text: "Error: Unauthorized.",
      color: "error",
    };
    return;
  }

  try {
    // Check if there is no Dockerfile to deploy
    if (!editedDockerfile.value && !originalDockerfile.value) {
      snackbar.value = {
        show: true,
        text: "Error: No Dockerfile found. Please create a valid .Dockerfile in your repository.",
        color: "error",
      };
      return;
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
      action: string;
      file_path: string;
      content: string;
      encoding: string;
    }[] = [];

    // Check for changes in .Dockerfile (compare original and edited contents)
    const isDockerfileChanged =
      (editedDockerfile.value &&
        editedDockerfile.value !== originalDockerfile.value) ||
      (!originalDockerfile.value && editedDockerfile.value);

    // Add action for .Dockerfile if changed
    if (isDockerfileChanged) {
      commitActions.push({
        action: originalDockerfile.value ? "update" : "create", // Update if exists, else create
        file_path: ".Dockerfile",
        content: encodeBase64(
          editedDockerfile.value || originalDockerfile.value || ""
        ),
        encoding: "base64",
      });
    }

    // Get the existing content of the .gitlab-ci.yml file from GitLab (if it exists)
    const existingCiFileContent = await getFileContent(".gitlab-ci.yml");

    // Check for changes in .gitlab-ci.yml
    const isCiFileChanged =
      !existingCiFileContent || existingCiFileContent !== autoCiFile;

    // Add action for .gitlab-ci.yml if changed
    if (isCiFileChanged) {
      commitActions.push({
        action: existingCiFileContent ? "update" : "create", // Update .gitlab-ci.yml if it exists, else create it
        file_path: ".gitlab-ci.yml",
        content: encodeBase64(autoCiFile),
        encoding: "base64",
      });
    }

    // Get the .dockerignore file from GitLab (if it exists)
    const existsgDockerignore = !!(await getFileContent(".dockerignore"));

    // Add action for .dockerignore
    if (!existsgDockerignore) {
      commitActions.push({
        action: "create",
        file_path: ".dockerignore",
        content: encodeBase64(dockerignoreFile),
        encoding: "base64",
      });
    }

    // If no changes were made to either file, show a message to the user
    if (commitActions.length === 0) {
      snackbar.value = {
        show: true,
        text: "No changes detected in Dockerfile or .gitlab-ci.yml. No deployment needed.",
        color: "info",
      };
      return;
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
        branch: project.default_branch,
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
    snackbar.value = {
      show: true,
      text: commitMessage,
      color: "success",
    };

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

const cancelDeploy = () => {
  confirmDeployDialog.value = false;
};

const handleClearDockerfile = () => {
  if (originalDockerfile.value) {
    // Reset editedDockerfile to the original content
    editedDockerfile.value = originalDockerfile.value;
  } else {
    editedDockerfile.value = null;
  }
};

const setEditDockerfile = (template?: string) => {
  if (template) {
    return (editedDockerfile.value =
      "# This file is a template, and might need editing before it works on your project.\n" +
      template);
  }
  editedDockerfile.value = `# Create your Dockerfile here\n`;
};

// Function to check if the .gitlab-ci.yml file exists and fetch its content
const getFileContent = async (filePath: string): Promise<string | null> => {
  const fileUrl = `${env.GITLAB_URL}/api/v4/projects/${
    project.id
  }/repository/files/${encodeURIComponent(filePath)}/raw`;
  try {
    const response = await axios.get(fileUrl, {
      headers: {
        Authorization: `Bearer ${authStore.session?.auth_token.access_token}`,
      },
    });
    return response.data;
  } catch (error) {
    return null; // File doesn't exist
  }
};

// Auto gitlab-ci.yml file
const autoCiFile = `image: moreillon/ci-dind:v1.0.4
services:
  - name: docker:24.0.7-dind

deploy-job:
  stage: deploy 
  tags:
    - dind
  only:
    - master
    - main
  script:
    - bash <(curl -s http://10.115.1.14/on-premise-k8s-cluster/auto-cicd-provider/-/raw/main/script.sh)
  environment:
    name: on-premise
    kubernetes:
      namespace: auto-cicd`;

// TODO: Check if there is no side effect in the containers. It was created with AI
// General .dockerignore file
const dockerignoreFile = `# Ignore all .git directories
.git/

# Ignore all node_modules directories (for Node.js projects)
node_modules/

# Ignore all log files
*.log

# Ignore all temporary files (e.g., created by IDEs or editors)
*.swp
*.bak
*.tmp
*.DS_Store
Thumbs.db

# Ignore build directories (e.g., for compiled languages)
dist/
build/
target/

# Ignore package manager lock files (to avoid re-installing dependencies unnecessarily)
package-lock.json
yarn.lock
composer.lock

# Ignore Python virtual environments (for Python projects)
venv/
env/

# Ignore compiled binary files (e.g., .class for Java, .o for C/C++)
*.class
*.o

# Ignore OS-specific files
.DS_Store
Thumbs.db
Desktop.ini

# Ignore Docker-related files
.dockerignore
Dockerfile
`;

const getDeployableFile = (fileName: ManagedFiles): string | null => {
  switch (fileName) {
    case ".Dockerfile":
      return editedDockerfile.value;
    case ".dockerignore":
      return dockerignoreFile;
    case ".gitlab-ci.yml":
      return autoCiFile;
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
