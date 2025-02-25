<template>
  <v-app :theme="theme">
    <v-app-bar elevation="1" style="position: fixed">
      <v-container class="d-flex align-center">
        <RouterLink
          to="/"
          class="d-flex align-center mr-auto text-decoration-none"
        >
          <v-img src="/JTEKT_logo.jpg" alt="JTEK logo" width="120" contain />
        </RouterLink>
        <v-spacer></v-spacer>
        <v-btn
          :icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          @click="toggleTheme"
        ></v-btn>
        <v-btn
          :text="current === 'en' ? '日本語' : 'EN'"
          @click="setLanguage(current === 'en' ? 'ja' : 'en')"
        ></v-btn>
        <v-btn
          v-if="!!authStore.session"
          icon="mdi-logout"
          class="ml-4"
          @click="authStore.logout"
        >
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container style="height: 100%" class="py-8 d-flex flex-column">
        <v-row v-if="isLoading" justify="center" align="center" style="flex: 1">
          <AppLoader />
        </v-row>
        <template v-else-if="authStore.session">
          <div style="flex: 1; display: flex; flex-direction: column">
            <router-view />
          </div>
        </template>
        <template v-else-if="route.meta.protected">
          <div class="d-flex justify-center">
            <h3 class="h3">You are not Authenticated</h3>
          </div>
        </template>
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
import { useLocale } from "vuetify";
import { setLanguage } from "@/plugins/vuetify";

const { current } = useLocale();

const authStore = useAuthStore();
const isLoading = ref(true);

const router = useRouter();
const route = useRoute();

const theme = ref(localStorage.getItem("theme") || "light");

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
}

onMounted(async () => {
  await setupTokenRefresh();

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

  // Reset Auth session
  authStore.setSession(null);

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
