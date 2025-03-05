<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-8">
          <v-card-text class="pa-8">
            <v-img
              src="https://about.gitlab.com/images/press/logo/svg/gitlab-logo-500.svg"
              alt="GitLab Logo"
              contain
              height="100"
              class="mb-6 mx-auto"
              style="max-width: 200px"
            />
            <h1 class="text-h5 font-weight-bold mb-4 text-center">
              {{ t("views.noGroup.title") }}
            </h1>
            <v-alert type="warning" class="mb-6" outlined>
              {{ t("views.noGroup.alert") }}
            </v-alert>

            <div class="text-body-1 mb-6">
              <p class="mb-4">{{ t("views.noGroup.instructions") }}</p>
              <ol class="pl-4">
                <li class="mb-2">
                  {{ t("views.noGroup.step1") }}
                </li>
                <li class="mb-2">
                  {{ t("views.noGroup.step2") }}
                </li>
              </ol>
            </div>

            <v-btn
              href="http://172.16.98.151:30173/"
              target="_blank"
              color="primary"
              size="large"
              block
              class="mb-4"
              elevation="2"
              :ripple="false"
            >
              <v-icon left class="mr-4">mdi-gitlab</v-icon>
              {{ t("views.noGroup.createButton") }}
            </v-btn>

            <v-btn
              to="/"
              color="secondary"
              size="large"
              block
              outlined
              elevation="0"
              :ripple="false"
            >
              {{ t("views.noGroup.backButton") }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";

const { t } = useLocale();
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

ol {
  list-style-position: outside;
}
</style>
