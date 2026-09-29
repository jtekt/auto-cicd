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
      <v-container class="d-flex align-center ga-2">
        <RouterLink
          to="/"
          class="d-flex align-center mr-auto text-decoration-none"
        >
          <AppIcon class="app-icon" />
        </RouterLink>
        <h1 class="text-h5 font-weight-bold ml-2">Auto CICD</h1>
        <v-spacer />
        <v-btn
          :icon="
            !theme.current.value.dark
              ? 'mdi-weather-night'
              : 'mdi-weather-sunny'
          "
          size="small"
          rounded="lg"
          variant="elevated"
          border
          @click="toggleTheme"
        />
        <v-btn
          :text="current === 'en' ? '日本語' : 'EN'"
          size="small"
          icon
          rounded="lg"
          variant="elevated"
          border
          @click="setLanguage(current === 'en' ? 'ja' : 'en')"
        />
        <v-btn
          v-if="!!appsUrl"
          size="small"
          rounded="lg"
          variant="elevated"
          border
          icon="mdi-view-grid-outline"
          :href="appsUrl"
        />
        <v-btn
          v-if="!!helpUrl"
          size="small"
          rounded="lg"
          variant="elevated"
          border
          icon="mdi-help"
          :href="helpUrl"
        />
        <v-btn
          v-if="!!authStore.session"
          size="small"
          rounded="lg"
          variant="elevated"
          border
          icon="mdi-logout"
          @click="handleLogout"
        />
      </v-container>
    </v-app-bar>

    <v-main>
      <router-view v-if="!route.meta.protected || authStore.session" />
      <div v-else-if="route.meta.protected" class="d-flex justify-center">
        <h3 class="h3">You are not Authenticated</h3>
      </div>
    </v-main>

    <v-footer
      app
      class="d-flex align-center justify-center ga-2 pa-4 border-t-sm"
      :style="{
        backgroundColor: theme.current.value.dark ? '#000' : '#fff',
      }"
    >
      <span>Auto CICD | JTEKT Corporation | {{ appVersion }}</span>
    </v-footer>
  </v-app>

  <Toaster />
</template>

<script setup lang="ts">
import { useLocale, useTheme } from "vuetify";
import { setLanguage } from "@/plugins/vuetify";
import Toaster from "./Toaster.vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import AppIcon from "./AppIcon.vue";
import runtimeEnv from "@/runtimeEnv.ts";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();

const { current } = useLocale();

const theme = useTheme();

const appVersion = runtimeEnv.VITE_APP_VERSION ?? "dev";
const helpUrl = runtimeEnv.VITE_HELP_URL;
const appsUrl = runtimeEnv.VITE_APPS_URL;

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
  localStorage.setItem("theme", theme.global.name.value);
}

function handleLogout() {
  authStore.logout();

  router.push("Auth");
}
</script>

<style scoped>
.app-icon {
  /* the glyph uses currentColor; don't inherit the link colour */
  color: rgb(var(--v-theme-on-surface));
}
</style>
