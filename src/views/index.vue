<template>
  <DefaultLayout>
    <v-row v-if="isLoading">
      <v-col cols="12" class="text-center">
        <AppLoader />
      </v-col>
    </v-row>

    <v-row v-else-if="error">
      <v-col cols="12">
        <p class="text-center text-red text-h5">
          {{ error }}
        </p>
      </v-col>
    </v-row>

    <v-row v-else-if="projects.length < 1">
      <v-col cols="12">
        <p class="text-center text-grey text-h5">No projects found</p>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="project in projects"
        :key="project.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>
          <v-card-title>{{ project.name }}</v-card-title>
          <v-card-text>
            <p>{{ project.description || "No description available" }}</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" :href="project.web_url" target="_blank">
              GitLab
            </v-btn>
            <v-btn
              color="success"
              @click="deployProject(project)"
              :loading="project.deploying"
              :disabled="project.deploying"
            >
              Deploy
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";
import axios, { AxiosError } from "axios";
import { onMounted, ref } from "vue";

const authStore = useAuthStore();

const isLoading = ref(true);
const error = ref<string | null>(null);

type Project = {
  id: number;
  description: string | null;
  name: string;
  web_url: string;
  deploying?: boolean;
};

const projects = ref<Project[]>([]);
const snackbar = ref({ show: false, text: "", color: "success" });

const min_access_level = 30; // 30 = developer

onMounted(async () => {
  try {
    if (!authStore.session) {
      error.value = "No active session. Please log in.";
      return;
    }

    const res = await axios.get<Project[]>(
      `${env.GITLAB_URL}/api/v4/projects?min_access_level=${min_access_level}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.session.accessToken}`,
        },
      }
    );

    projects.value = res.data.map((project) => ({
      ...project,
      deploying: false,
    }));
  } catch (err) {
    console.error(err);
    error.value = "Failed to fetch projects. Please try again.";
  } finally {
    isLoading.value = false;
  }
});

const deployProject = async (project: Project) => {
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

    const fileContent = `
      stages:
        - test

      test_job:
        stage: test
        script:
          - echo "This is a test pipeline"
      `;

    const commitMessage = "Update .gitlab-ci.yml for testing pipeline";

    // Check if the file exists
    let fileExists = false;
    try {
      const checkResponse = await axios.get(fileUrl, {
        params: { ref: "main" },
        headers: {
          Authorization: `Bearer ${authStore.session.accessToken}`,
        },
      });
      fileExists = checkResponse.status === 200;
    } catch (err) {
      if (err instanceof AxiosError) {
        if(err.response && err.response.status !== 404) {
          throw error
        }
      }
      // If 404, file doesn't exist, which is fine
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
            Authorization: `Bearer ${authStore.session.accessToken}`,
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
            Authorization: `Bearer ${authStore.session.accessToken}`,
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
</script>
