<template>
  <div class="text-center pa-4">
    <v-btn :color="'success'" variant="tonal" @click="handleDeployBtn()">
      <v-icon start icon="mdi-rocket-launch-outline"></v-icon>
      Deploy
    </v-btn>

    <v-dialog v-model="dialog" width="900" max-width="90vw" max-height="90vh">
      <v-card style="height: 100%; width: 100%" prepend-icon="mdi-update">
        <template v-slot:title>
          Deploy
          <strong style="text-transform: capitalize">{{ project.name }}</strong>
        </template>

        <div v-if="!dockerLoadingError" class="pa-4">
          <v-alert type="info" variant="tonal">
            <p>
              <strong>Valid .Dockerfile:</strong> Ensure your project has a
              valid <strong>.Dockerfile</strong> in the root directory. This
              file contains the instructions to build your Docker image.
            </p>
            <p>
              <strong>Expose Port 80:</strong> The Docker container must expose
              the application on <strong>port 80</strong>.
            </p>
            <p>
              <strong>Deploy Button:</strong> Clicking “Deploy” will overwrite
              the <strong>.gitlab-ci.yml</strong> file in your repository.
            </p>
            <p>
              <strong>About environment variables:</strong> You can setup the
              variables in your gitlab project in Settings > CICD > Variables >
              Add variable.
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
                {{ !!originalDockerfile ? "Reset to original" : "Reset" }}
              </v-btn>

              <v-btn color="primary" variant="tonal">
                Select Template

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
              language="dockerfile"
              :show-line-numbers="true"
              placeholder="Enter your Dockerfile here..."
              max-height="400"
            />

            <p
              :class="`text-body-2 ${
                originalDockerfile && originalDockerfile !== editedDockerfile
                  ? 'text-info'
                  : 'text-transparent'
              }`"
            >
              You are altering your repository Dockerfile.
            </p>
          </div>
        </template>

        <!-- Actions and Deploy Button -->
        <template v-slot:actions>
          <v-btn
            color="success"
            variant="tonal"
            text="Deploy"
            @click="handleDeploy"
            :disabled="!editedDockerfile && !originalDockerfile"
          ></v-btn>
          <v-btn variant="tonal" text="Cancel" @click="dialog = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="nextStepsDialog"
      width="500"
      max-width="90vw"
      max-height="90vh"
    >
      <v-card>
        <template v-slot:title>
          <strong style="text-transform: capitalize">{{ project.name }}</strong>
          Was deployed
        </template>
        <div class="pa-4">
          <v-alert variant="tonal">
            <p>
              <strong>1.</strong> Go to the 'Pipelines' section to view the
              build process and errors, if any.
            </p>
            <p>
              <strong>2.</strong> Once the build is finished, you will receive
              an email with the deployed URL.
            </p>
          </v-alert>
        </div>
      </v-card>
    </v-dialog>
  </div>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="6000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios, { AxiosError } from "axios";
import dockerTemplates from "../templates/dockerfile-templates.json";
import { env } from "@/config/env";
import type { Project } from "@/views/index.vue";
import AppLoader from "./AppLoader.vue";

const { project } = defineProps<{ project: Project }>();

const dialog = ref(false);
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
        editedDockerfile.value = "# Write your .Dockerfile here.\n";
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
  // Check if there is no Dockerfile to deploy or if it's not changed
  if (!authStore.session) {
    snackbar.value = {
      show: true,
      text: "Error: Unauthorized.",
      color: "error",
    };
    return;
  }

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

  try {
    // Check if there is no Dockerfile to deploy or if it's not changed
    if (!editedDockerfile.value && !originalDockerfile.value) {
      snackbar.value = {
        show: true,
        text: "Error: No Dockerfile found. Please create a valid .Dockerfile in your repository.",
        color: "error",
      };
      return;
    }

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

    // Open a new dialog to show next steps
    setTimeout(() => {
      nextStepsDialog.value = true;
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
