<template>
  <v-responsive min-height="100">
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
          <slot />
          <router-view />
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>

<script setup lang="ts">
import { ref } from "vue";

const theme = ref(localStorage.getItem("theme") || undefined);

function onClick() {
  theme.value = theme.value === "light" ? "dark" : "light";

  localStorage.setItem("theme", theme.value);
}
</script>
