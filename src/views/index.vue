<template>
  <DefaultLayout>
    <v-menu class="m-auto">
      <template v-slot:activator="{ props }">
        <v-btn color="primary" v-bind="props"> Gitlab Account </v-btn>
      </template>

      <v-list>
        <a v-bind:href="url.toString()">
          <v-list-item>
            <v-list-item-title class="text-center"
              >+ Add account</v-list-item-title
            >
          </v-list-item>
        </a>
        <RouterLink
          v-for="(item, index) in authStore.session?.gitlabTokens"
          :key="index"
          :to="`projects/${item.userId}`"
        >
          <v-list-item :prepend-avatar="item.avatar || undefined">
            <v-list-item-title>{{ item.username }}</v-list-item-title>
          </v-list-item>
        </RouterLink>
      </v-list>
    </v-menu>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";

const scopes = "api profile openid email read_api read_user write_repository";

const url = new URL(env.GITLAB_URL + "/oauth/authorize");
url.searchParams.append("client_id", env.GITLAB_OAUTH_ID);
url.searchParams.append("redirect_uri", "http://localhost:3000/auth/gitlab");
url.searchParams.append("response_type", "code");
url.searchParams.append("scope", scopes);
url.searchParams.append("state", "oidc-front");

const authStore = useAuthStore();
</script>
