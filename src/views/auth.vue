<template>
  <v-row v-if="isLoading">
    <v-col
      cols="12"
      class="text-center"
    >
      <AppLoader />
    </v-col>
  </v-row>
  <v-container
    v-else
    class="fill-height"
    fluid
  >
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
        lg="4"
      >
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
              {{ t("pages.auth.signInMessage") }}
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
              <v-icon
                left
                class="mr-4"
              >
                mdi-gitlab
              </v-icon>
              Login with GitLab
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="5000"
  >
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { env } from "@/config/env";
import {
  createAccessToken,
  createGitlabAuthUrl,
  getGitlabProfile,
} from "@/libs/gitlab";
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLocale } from "vuetify";

const { t } = useLocale();

const url = createGitlabAuthUrl();

const isLoading = ref(true);

const authStore = useAuthStore();

const router = useRouter();
const route = useRoute();

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

onMounted(async () => {
  if (
    typeof route.query.code !== "string" ||
    route.query.state !== env.OAUTH_STATE_VALIDATOR
  ) {
    isLoading.value = false;
    return;
  }

  // Create access token
  const accessToken = await createAccessToken(route.query.code);

  if (!accessToken) {
    isLoading.value = false;

    snackbar.value = {
      show: true,
      color: "error",
      text: t("pages.auth.errors.token"),
    };
    return;
  }

  // Get user info
  const user = await getGitlabProfile(accessToken.access_token);

  if (!user) {
    isLoading.value = false;

    snackbar.value = {
      show: true,
      color: "error",
      text: t("pages.auth.errors.profile"),
    };
    return;
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
      nickname: user.nickname,
      sub: user.sub,
      email: user.email,
      picture: user.picture,
      name: user.name,
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
