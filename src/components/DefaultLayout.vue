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
      <v-container class="d-flex align-center ga-1">
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
        <v-divider vertical></v-divider>
        <h1 class="text-h5 font-weight-bold px-2">Auto CI&CD</h1>
        <v-spacer />
        <v-btn
          :icon="
            !theme.current.value.dark
              ? 'mdi-weather-night'
              : 'mdi-weather-sunny'
          "
          size="small"
          @click="toggleTheme"
        />
        <v-btn
          :text="current === 'en' ? '日本語' : 'EN'"
          size="small"
          icon
          @click="setLanguage(current === 'en' ? 'ja' : 'en')"
        />
        <v-btn
          v-if="!!authStore.session"
          size="small"
          icon="mdi-logout"
          @click="authStore.logout"
        />
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container style="height: 100%" class="py-2 d-flex flex-column">
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
      <div class="d-flex align-center justify-center ga-2 px-4 py-2 w-100">
        <span>
          {{ new Date().getFullYear() }} — <strong>JTEKT Corporation</strong>
        </span>
        <v-divider v-if="supportContacts.length" vertical />
        <v-tooltip v-for="(c, i) in supportContacts" :key="i" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              :href="c.url"
              target="_blank"
              rel="noopener"
              size="small"
            >
              <v-icon>{{ c.icon || "mdi-help-circle-outline" }}</v-icon>
            </v-btn>
          </template>

          <span>{{ c.label }}</span>
        </v-tooltip>
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
import Toaster from "./Toaster.vue";
import { supportContacts } from "@/config";

const { current, t } = useLocale();

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
  if (authStore.isSessionExpiringSoon() && authStore.session) {
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
};
</script>
