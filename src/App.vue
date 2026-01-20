<template>
  <v-app>
    <template v-if="isLoading">
      <div class="w-100 h-100 d-flex align-center justify-center">
        <AppLoader />
      </div>
    </template>

    <v-main v-else>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppLoader from "./components/AppLoader.vue";
import { refreshAccessToken } from "./libs/gitlab";

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(true);

const refreshIfNeeded = async () => {
  if (!authStore.session) return;

  const expiresAt = authStore.session.auth_token.expires_at;
  const now = Math.floor(Date.now() / 1000);

  // If there is only 2 minutes update the session
  if (expiresAt - now > 7199) return;

  const newTokens = await refreshAccessToken(authStore.session);
  if (!newTokens) {
    authStore.logout();
    router.push("/auth");
    return;
  }

  authStore.updateTokens(
    newTokens.access_token,
    newTokens.refresh_token,
    newTokens.expires_in
  );
};

let refreshInterval: number | null = null;

onMounted(async () => {
  const session = authStore.loadSession();

  if (!session) {
    isLoading.value = false;
    return;
  }

  await refreshIfNeeded();

  // Run every 1 min
  refreshInterval = setInterval(refreshIfNeeded, 60 * 1000);

  isLoading.value = false;
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>
