<template>
  <DefaultLayout>
    <div
      class="position-absolute"
      v-if="isLoading"
      style="left: 50%; top: 50%; transform: translate(-50%, -50%)"
    >
      <v-progress-circular
        indeterminate
        :size="50"
        color="red lighten-4"
      ></v-progress-circular>
    </div>
    <v-container v-else>
      <v-row no-gutters>
        <v-col v-for="p in projects" :key="p.id" cols="12" sm="4">
          <v-card
            :text="p.description || undefined"
            :title="p.name"
            link
            class="ma-2"
          >
            <v-card-actions class="pt-0 d-flex">
              <a :href="p.web_url" target="_blank" rel="noopener noreferrer">
                <v-btn
                  color="blue-accent-2"
                  text="Open Git"
                  variant="text"
                ></v-btn>
              </a>
              <v-btn color="teal-accent-4" text="Deploy" variant="text"></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const authStore = useAuthStore();

const isLoading = ref(true);

type Project = {
  id: number;
  description: string | null;
  name: string;
  web_url: string;
};
const projects = ref<Project[]>([]);

const min_access_level = 30; // 30 = developer

onMounted(async () => {
  try {
    const account = authStore.session?.gitlabTokens.find(
      (t) => t.userId === route.params.id
    );

    if (!account) return;

    const res = await axios.get<Project[]>(
      `${env.GITLAB_URL}/api/v4/projects?min_access_level=${min_access_level}`,
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
        },
      }
    );

    projects.value = res.data;
  } catch (error) {}
});
</script>
