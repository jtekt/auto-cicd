<template>
  <div class="text-center pa-4">
    <v-btn
      color="success"
      variant="tonal"
      @click="() => handleDeployBtn().then(() => (isDockerLoading = false))"
    >
      <v-icon start icon="mdi-rocket-launch-outline"></v-icon>
      Deploy
    </v-btn>

    <v-dialog v-model="dialog" width="800" max-width="90vw" max-height="70vh">
      <v-card style="height: 100%; width: 100%" prepend-icon="mdi-update">
        <template v-slot:title>
          Deploy
          <strong style="text-transform: capitalize">{{
            project.name
          }}</strong></template
        >
        <v-row v-if="isDockerLoading" justify="center" align="center">
          <AppLoader />
        </v-row>
        <template v-else-if="dockerFile">
          <div class="px-4 flex-1">
            <CodeEditor
              v-model="dockerFile"
              language="javascript"
              :show-line-numbers="true"
              placeholder="Enter your JavaScript code here..."
            />
          </div>
        </template>
        <template v-else>
          <div class="templates-container">
            <h3>
              To use the auto deploy you need to have a
              <strong>.Dockerfile</strong> in the root of your project
            </h3>
            <p>
              You can choose one of these templates to start or use the
              <a href="*" target="_blank" rel="noopener noreferrer"
                >guide how to create a .Dockerfile</a
              >
              to create your own
            </p>
            <v-row no-gutters>
              <v-col
                v-for="t in dockerTemplates.templates"
                :key="t.name"
                cols="12"
                sm="4"
              >
                <v-card
                  :title="t.name"
                  style="cursor: pointer"
                  @click="() => (dockerFile = t.raw)"
                  class="ma-2"
                >
                  <pre class="text-caption pa-4">{{ t.raw }}</pre>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </template>
        <template v-slot:actions>
          <v-btn
            color="success"
            variant="tonal"
            text="Deploy"
            @click="dialog = false"
          ></v-btn>
          <v-btn variant="tonal" text="Cancel" @click="dialog = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";
import type { Project } from "@/views/index.vue";
import axios, { AxiosError } from "axios";
import dockerTemplates from "../templates/dockerfile-templates.json";

const { project } = defineProps<{ project: Project }>();

const dockerFile = ref<string | null>(null);

const isDockerLoading = ref(true);

const dialog = ref(false);

const snackbar = ref({ show: false, text: "", color: "success" });

const authStore = useAuthStore();

const deployProject = async () => {
  project.deploying = true;
  try {
    if (!authStore.session) {
      throw new Error("No active session");
    }

    const projectId = encodeURIComponent(project.id);
    const filePath = ".gitlab-ci.yml";
    const fileUrl = `${
      env.GITLAB_URL
    }/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(
      filePath
    )}`;

    const fileContent = `image: moreillon/ci-dind:v1.0.4
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

    const commitMessage = "Update .gitlab-ci.yml auto deploy";

    // Check if the file exists
    let fileExists = false;
    try {
      const checkResponse = await axios.get(fileUrl, {
        params: { ref: "main" },
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      });
      fileExists = checkResponse.status === 200;
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response && err.response.status !== 404) {
          throw err;
        }
        // If 404, file doesn't exist, which is fine
      }
    }

    let response;
    if (fileExists) {
      // Update existing file
      response = await axios.put(
        fileUrl,
        {
          branch: "main",
          content: fileContent,
          commit_message: commitMessage,
          encoding: "text",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
          },
        }
      );
    } else {
      // Create new file
      response = await axios.post(
        fileUrl,
        {
          branch: "main",
          content: fileContent,
          commit_message: commitMessage,
          encoding: "text",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
          },
        }
      );
    }

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(
        `Failed to ${fileExists ? "update" : "create"} .gitlab-ci.yml file`
      );
    }

    snackbar.value = {
      show: true,
      text: `${fileExists ? "Updated" : "Created"} .gitlab-ci.yml in ${
        project.name
      }`,
      color: "success",
    };
  } catch (err) {
    console.error("Deployment error:", err);

    let errMessage = `Failed to deploy to ${project.name}: `;
    if (err instanceof Error || err instanceof AxiosError) {
      errMessage += err.message;
    } else {
      errMessage += "Unknown error";
    }

    snackbar.value = {
      show: true,
      text: errMessage,
      color: "error",
    };
  } finally {
    project.deploying = false;
  }
};

const handleDeployBtn = async () => {
  if (!authStore.session) return;

  dialog.value = true;

  const dockerFileUrl = `${env.GITLAB_URL}/api/v4/projects/${
    project.id
  }/repository/files/${encodeURIComponent(".gitlab-ci.yml")}/raw`;

  if (!dockerFile.value) {
    try {
      const res = await axios.get<string>(dockerFileUrl, {
        params: { ref: "main" },
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      });

      if (res.status === 200) {
        dockerFile.value = res.data;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.status === 404) {
          return;
        }
      }
      console.log(error);
    }
  }
};

onMounted(async () => {});
</script>

<style scoped>
.templates-container {
  padding: 10px;
}
</style>
