<template>
  <v-app :theme="theme.current.value.dark ? 'dark' : 'light'">
    <v-app-bar
      elevation="0"
      class="border-b-sm"
      :style="{
        position: 'fixed',
        backgroundColor: theme.current.value.dark ? '#000' : '#fff',
      }"
    >
      <v-container class="d-flex align-center">
        <RouterLink
          to="/"
          class="d-flex align-center mr-auto text-decoration-none"
        >
          <v-img
            :src="
              theme.current.value.dark
                ? '/JTEKT_logo_negative.jpg'
                : '/JTEKT_logo.jpg'
            "
            alt="JTEK logo"
            width="120"
            contain
          />
        </RouterLink>
        <v-divider class="mx-4" vertical></v-divider>
        <h1 class="text-h5 font-weight-bold">Auto CI&DC</h1>
        <v-spacer />
        <v-btn
          :icon="
            !theme.current.value.dark
              ? 'mdi-weather-night'
              : 'mdi-weather-sunny'
          "
          @click="toggleTheme"
        />
        <v-btn
          :text="current === 'en' ? '日本語' : 'EN'"
          @click="setLanguage(current === 'en' ? 'ja' : 'en')"
        />
        <v-btn
          v-if="!!authStore.session"
          icon="mdi-logout"
          class="ml-4"
          @click="authStore.logout"
        />
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container style="height: 100%" class="py-8 d-flex flex-column">
        <v-row v-if="isLoading" justify="center" align="center" style="flex: 1">
          <AppLoader />
        </v-row>
        <template v-else-if="!route.meta.protected || authStore.session">
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

    <v-footer
      app
      class="d-flex flex-column border-t-sm"
      :style="{
        backgroundColor: theme.current.value.dark ? '#000' : '#fff',
      }"
    >
      <div class="px-4 py-2 text-center w-100">
        {{ new Date().getFullYear() }} — <strong>JTEKT Corporation</strong>
      </div>
    </v-footer>
  </v-app>

  <Toaster />
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref } from "vue";
import AppLoader from "./AppLoader.vue";
import { refreshAccessToken } from "@/libs/gitlab";
import { useRoute, useRouter } from "vue-router";
import { useLocale, useTheme } from "vuetify";
import { setLanguage } from "@/plugins/vuetify";
import { Toaster } from "vue3-toaster";

const { current } = useLocale();

const authStore = useAuthStore();
const isLoading = ref(true);

const router = useRouter();
const route = useRoute();

const theme = useTheme();

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
  localStorage.setItem("theme", theme.global.name.value);
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
  isLoading.value = false;
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
