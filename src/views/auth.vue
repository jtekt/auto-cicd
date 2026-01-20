<template>
  <!-- Show loader during code->token exchange -->
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
            <p class="mb-6">{{ t("views.auth.signInMessage") }}</p>
            <v-btn
              :href="url"
              color="primary"
              size="x-large"
              block
              elevation="2"
            >
              <v-icon left class="mr-4">mdi-gitlab</v-icon>
              Login with GitLab
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import {
  createGitlabAuthUrl,
  exchangeCodeForTokens,
  getGitlabProfile,
} from "@/libs/gitlab";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/stores/toast";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLocale } from "vuetify";

const { t } = useLocale();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// The login URL for users when no ?code= is present
const url = createGitlabAuthUrl();

const isLoading = ref(true);

onMounted(async () => {
  const code = route.query.code;

  // No code: user is just visiting /auth → show login UI
  if (typeof code !== "string") {
    isLoading.value = false;
    return;
  }

  // Code present: start login
  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens) {
      isLoading.value = false;
      return toast.error(t("views.auth.errors.token"));
    }

    const profile = await getGitlabProfile(tokens.access_token);
    if (!profile) {
      isLoading.value = false;
      return toast.error(t("views.auth.errors.profile"));
    }

    // Save session
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

    // Redirect to the actual application
    router.push({
      name: "Home"
    });
  } catch (error) {
    console.error("OAuth login error:", error);
    toast.error("Authentication failed");
    isLoading.value = false;
  }
});
</script>
