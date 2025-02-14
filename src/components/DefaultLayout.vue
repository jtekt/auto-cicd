<template>
  <v-responsive v-if="isLoading" min-height="100%">
    <div
      class="position-absolute"
      style="left: 50%; top: 50%; transform: translate(-50%, -50%)"
    >
      <AppLoader />
    </div>
  </v-responsive>
  <v-responsive v-else-if="!isLoading && authStore.session" min-height="100">
    <v-app :theme="theme">
      <v-app-bar class="px-3">
        <nav class="px-3 d-flex align-center justify-space-between w-100">
          <RouterLink to="/" class="d-flex align-center">
            <img
              src="https://cdn-au.onetrust.com/logos/a3e2bc3c-266a-4de4-ad77-66a8ebcaf869/2d0ab49a-5c52-4f4f-90d0-e46c8181978e/a4a20d9b-9875-42b8-8854-8b56d1ec81c5/%E2%91%A3JTEKT_logo_Positive_type,_Black_+_Red.jpg"
              alt="JTEK logo"
              style="width: 120px"
            />
          </RouterLink>
          <v-btn
            :prepend-icon="
              theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'
            "
            text="Toggle Theme"
            slim
            @click="onClick"
          ></v-btn>
        </nav>
      </v-app-bar>

      <v-main>
        <v-container>
          <div class="d-flex align-center mb-4" style="gap: 16px">
            <v-avatar
              v-if="authStore.session.avatar"
              size="40px"
              color="red"
            >
              <img :src="authStore.session.avatar" alt="alt" />
            </v-avatar>
            <h2>{{ authStore.session.username }}</h2>
          </div>
          <slot />
          <router-view />
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>

<script setup lang="ts">
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref } from "vue";
import AppLoader from "./AppLoader.vue";

const authStore = useAuthStore();

const isLoading = ref(true);

const theme = ref(localStorage.getItem("theme") || undefined);

function onClick() {
  theme.value = theme.value === "light" ? "dark" : "light";

  localStorage.setItem("theme", theme.value);
}

onMounted(() => {
  // check if logged in
  isLoading.value = true;

  if (authStore.isAuthenticated()) {
    isLoading.value = false;
    return;
  }

  // Redirect to gitlab
  const scopes = "api profile openid email read_api read_user write_repository";

  const url = new URL(env.GITLAB_URL + "/oauth/authorize");
  url.searchParams.append("client_id", env.GITLAB_OAUTH_ID);
  url.searchParams.append("redirect_uri", "http://localhost:3000/auth/gitlab");
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scopes);
  url.searchParams.append("state", "auth-ci-front");

  window.location.href = url.toString();
});
</script>
