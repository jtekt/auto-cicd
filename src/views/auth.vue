<template>
  <!-- OAuth callback loading -->
  <v-row v-if="isLoading">
    <v-col cols="12" class="text-center">
      <AppLoader />
    </v-col>
  </v-row>

  <!-- Login screen -->
  <v-container v-else class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-8">
          <v-card-text class="text-center pa-8">
            <v-img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/gitlab/gitlab-original.svg"
              height="100"
              contain
              class="mb-6"
            />

            <h1 class="text-h4 font-weight-bold mb-6">
              JTEKT GitLab Auto CI&CD
            </h1>

            <p class="mb-6">
              {{ t("views.auth.signInMessage") }}
            </p>

            <v-btn
              :loading="loginLoading"
              color="primary"
              size="x-large"
              block
              elevation="2"
              @click="login"
            >
              <v-icon class="mr-4">mdi-gitlab</v-icon>
              Login with GitLab
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLocale } from "vuetify";

import AppLoader from "@/components/AppLoader.vue";

import {
  createGitlabAuthUrl,
  exchangeCodeForTokens,
  getGitlabProfile,
} from "@/libs/gitlab";

import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/stores/toast";

const { t } = useLocale();

const route = useRoute();
const router = useRouter();

const toast = useToast();
const authStore = useAuthStore();

const isLoading = ref(true);
const loginLoading = ref(false);

async function login() {
  try {
    loginLoading.value = true;

    const url = await createGitlabAuthUrl();

    window.location.href = url;
  } catch (err) {
    console.error("Failed to create OAuth URL", err);

    toast.error(t("views.auth.errors.oauthInit"));
  } finally {
    loginLoading.value = false;
  }
}

async function handleOAuthCallback() {
  const code = route.query.code;
  const state = route.query.state;
  const error = route.query.error;

  // OAuth provider returned an error
  if (typeof error === "string") {
    toast.error(error);

    isLoading.value = false;

    return;
  }

  // Not a callback request
  if (typeof code !== "string") {
    isLoading.value = false;

    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      typeof state === "string" ? state : null,
    );

    if (!tokens) {
      toast.error(t("views.auth.errors.token"));

      isLoading.value = false;

      return;
    }

    const profile = await getGitlabProfile(tokens.access_token);

    if (!profile) {
      toast.error(t("views.auth.errors.profile"));

      isLoading.value = false;

      return;
    }

    authStore.setSession({
      auth_token: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      },

      user: {
        nickname: profile.nickname,
        sub: profile.sub,
        email: profile.email,
        picture: profile.picture,
        name: profile.name,
      },
    });

    await router.replace({
      name: "Home",
    });
  } catch (err) {
    console.error("OAuth login error:", err);

    toast.error(t("views.auth.errors.authentication"));

    isLoading.value = false;
  }
}

onMounted(async () => {
  await handleOAuthCallback();
});
</script>
