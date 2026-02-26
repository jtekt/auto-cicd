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
        <h1 class="text-h5 font-weight-bold px-2">Auto CICD</h1>
        <v-spacer />
        <template v-if="supportContact">
          <v-btn
            icon="mdi-help-circle"
            variant="text"
            :href="supportContact"
            target="_blank"
            rel="noopener"
            size="small"
          />
        </template>
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
        <span>
          {{ new Date().getFullYear() }} — <strong>JTEKT Corporation</strong>
        </span>
        <template v-if="supportContact">
          <v-divider vertical />
          <v-btn
            icon="mdi-help-circle"
            variant="text"
            :href="supportContact"
            target="_blank"
            rel="noopener"
            size="small"
          />
        </template>
      </div>
      <div v-if="footerMessage" v-html="footerMessage" class="text-caption text-medium-emphasis" />
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

const supportContact = import.meta.env.VITE_APP_MORE_INFORMATION;
const footerMessage = import.meta.env.VITE_APP_FOOTER_MESSAGE;

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore();

const { current } = useLocale();

const theme = useTheme();

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
  localStorage.setItem("theme", theme.global.name.value);
}

function handleLogout() {
  authStore.logout()

  router.push("Auth")
}
</script>
