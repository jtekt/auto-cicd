<template>
  <v-row v-if="isLoading">
    <v-col cols="12" class="text-center">
      <AppLoader />
    </v-col>
  </v-row>
  <v-container v-else class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-8">
          <v-card-text class="text-center pa-8">
            <v-img
              src="https://about.gitlab.com/images/press/logo/svg/gitlab-logo-500.svg"
              alt="GitLab Logo"
              contain
              height="100"
              class="mb-6"
            />
            <h1 class="text-h4 font-weight-bold mb-6">
              JTEKT GitLab Auto CI&CD
            </h1>
            <p class="mb-6">
              {{ t("views.auth.signInMessage") }}
            </p>
            <v-btn
              :href="url"
              color="primary"
              size="x-large"
              block
              class="mt-6"
              elevation="2"
              :ripple="false"
            >
              <v-icon left class="mr-4"> mdi-gitlab </v-icon>
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
  createAccessToken,
  createGitlabAuthUrl,
  getGitlabProfile,
} from "@/libs/gitlab";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@jtekt-private/vue3-toaster";
import axios from "axios";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLocale } from "vuetify";

const { t } = useLocale();

const url = createGitlabAuthUrl();

const isLoading = ref(true);

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

onMounted(async () => {
  if (
    typeof route.query.code !== "string" ||
    route.query.state !== import.meta.env.VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR
  ) {
    isLoading.value = false;
    return;
  }

  // Create access token
  const accessToken = await createAccessToken(route.query.code);

  if (!accessToken) {
    isLoading.value = false;
    return toast.error(t("views.auth.errors.token"));
  }

  // Get user info
  const profile = await getGitlabProfile(accessToken.access_token);

  if (!profile?.user) {
    isLoading.value = false;
    return toast.error(t("views.auth.errors.profile"));
    // } else if (!profile.hasGroup) {
  } else if (!profile.hasGroup) {
    // Generate group by fetching user groups
    const url = `${import.meta.env.VITE_APP_GITLAB_GROUP_MANAGER_URL}/groups`;

    try {
      const res = await axios.post(url);

      if (res.status !== 200) {
        console.error("Failed to generate group, status code:", res.status);

        throw new Error("Failed to generate group");
      }

      profile.hasGroup = true;
      isLoading.value = false;
    } catch (error) {
      console.error("Error generating group:", error);

      isLoading.value = false;
      return toast.error(t("views.auth.errors.group"));
    }
  }

  // Set the session state
  authStore.setSession({
    auth_token: {
      access_token: accessToken.access_token,
      code: route.query.code,
      refresh_token: accessToken.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + accessToken.expires_in,
    },
    user: {
      nickname: profile.user.nickname,
      sub: profile.user.sub,
      email: profile.user.email,
      picture: profile.user.picture,
      name: profile.user.name,
    },
  });

  router.push("/");
});
</script>

<style scoped>
.v-btn {
  transition: all 0.2s ease-in-out;
}

.v-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
}

.v-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
