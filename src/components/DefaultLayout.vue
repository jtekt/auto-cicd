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
          <AppIcon class="app-icon" />
        </RouterLink>
        <h1 class="text-h5 font-weight-bold px-2">Auto CICD</h1>
        <v-spacer />
        <MoreInformation id="tour-home-information-btn" v-if="(config?.usefulLinks?.length || 0) > 0" />
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
          @click="handleLogout"
        />
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container style="height: 100%" class="py-2 d-flex flex-column">
        <template v-if="!route.meta.protected || authStore.session">
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
      <div class="d-flex align-center justify-center ga-2 px-4 w-100">
        <span>Auto CICD | JTEKT Corporation | {{ appVersion }}</span>
      </div>
      <div
        v-if="footerMessage"
        v-html="footerMessage"
        class="text-caption text-medium-emphasis"
      />
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
import { getConfig } from "@/config";
import { computed } from "vue";
import MoreInformation from "./MoreInformation.vue";
import AppIcon from "./AppIcon.vue";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();

const config = getConfig();

const { current } = useLocale();

const theme = useTheme();

const appVersion = import.meta.env.VITE_APP_VERSION ?? "dev";

const footerMessage = computed(() => {
  if (!config) return null;
  const message =
    config.footerMessage[current.value as "ja"] ??
    Object.values(config.footerMessage)[0];
  return message ? message.replace(/\n/g, "<br>") : null;
});

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
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  /* the glyph uses currentColor; don't inherit the link colour */
  color: rgb(var(--v-theme-on-surface));
}
</style>
