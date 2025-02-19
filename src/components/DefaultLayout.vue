<template>
  <v-app :theme="theme">
    <v-app-bar elevation="1">
      <v-container class="d-flex align-center">
        <RouterLink
          to="/"
          class="d-flex align-center mr-auto text-decoration-none"
        >
          <v-img
            src="https://cdn-au.onetrust.com/logos/a3e2bc3c-266a-4de4-ad77-66a8ebcaf869/2d0ab49a-5c52-4f4f-90d0-e46c8181978e/a4a20d9b-9875-42b8-8854-8b56d1ec81c5/%E2%91%A3JTEKT_logo_Positive_type,_Black_+_Red.jpg"
            alt="JTEK logo"
            width="120"
            contain
          />
        </RouterLink>
        <v-spacer></v-spacer>
        <v-btn
          :icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          @click="toggleTheme"
        ></v-btn>
        <v-btn
          v-if="!!authStore.session"
          prepend-icon="mdi-logout"
          class="ml-4"
          @click="authStore.logout"
        >
          Logout
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-8">
        <v-row
          v-if="isLoading"
          justify="center"
          align="center"
          style="height: 80vh"
        >
          <AppLoader />
        </v-row>
        <template v-else-if="authStore.session">
          <v-row class="mb-6" align="center">
            <v-col cols="auto">
              <v-avatar
                v-if="authStore.session.user.picture"
                size="48"
                color="primary"
              >
                <v-img
                  :src="authStore.session.user.picture"
                  alt="User Avatar"
                />
              </v-avatar>
              <v-avatar v-else size="48" color="primary">
                {{ authStore.session.user.name.charAt(0).toUpperCase() }}
              </v-avatar>
            </v-col>
            <v-col>
              <h2 class="text-h5">
                Welcome, {{ authStore.session.user.name }}!
              </h2>
            </v-col>
          </v-row>
        </template>
        <template v-else-if="route.name !== 'Auth'">
          <div class="d-flex justify-center">
            <h3 class="h3">You are not Authenticated</h3>
          </div>
        </template>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app class="d-flex flex-column bg-black">
      <div class="px-4 py-2 text-center w-100">
        {{ new Date().getFullYear() }} — <strong>JTEKT Corporation</strong>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref } from "vue";
import AppLoader from "./AppLoader.vue";
import { createGitlabAuthUrl, refreshAccessToken } from "@/libs/gitlab";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const isLoading = ref(true);

const router = useRouter();
const route = useRoute();

const theme = ref(localStorage.getItem("theme") || "light");

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
}

onMounted(() => {
  setupTokenRefresh();

  setInterval(async () => {
    setupTokenRefresh();
  }, 60 * 1000); // Check every minute

  if (route.name === "Auth") {
    isLoading.value = false;
    return;
  }

  if (authStore.session) {
    isLoading.value = false;
    return;
  }

  window.location.href = createGitlabAuthUrl();
});

// Set up automatic token refresh
const setupTokenRefresh = async () => {
  if (authStore.isAuthenticated() && authStore.session) {
    const timeUntilExpiry =
      authStore.session.auth_token.expires_at - Math.ceil(Date.now() / 1000);

    if (timeUntilExpiry < 2 * 60) {
      // Refresh if less than 2 minutes until expiry
      const accessToken = await refreshAccessToken(authStore.session);

      if (!accessToken) {
        return router.push("/auth");
      }

      // Save the new access token
      authStore.setAuthToken({
        access_token: accessToken.access_token,
        refresh_token: accessToken.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + accessToken.expires_in,
      });
    }
  }
};
</script>
