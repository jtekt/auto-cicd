<template>
  <v-dialog v-model="deployStore.nextStepsDialog" max-width="600px">
    <v-card class="pa-4">
      <v-card-title
        class="text-h5 font-weight-bold text-center py-4"
        :class="{
          'text-success': deploymentStatus.isSuccess,
          'text-warning': deploymentStatus.hasPartialSuccess,
          'text-error': deploymentStatus.isErrorOnly,
        }"
      >
        <v-icon
          left
          :color="
            deployStore.deploymentInfo?.errors.length ? 'error' : 'success'
          "
        >
          {{
            deployStore.deploymentInfo?.errors.length
              ? "mdi-alert-circle"
              : "mdi-check-circle"
          }}
        </v-icon>
        {{ dialogTitle }}
      </v-card-title>

      <v-card-text v-if="deployStore.deploymentInfo" class="py-0 pt-4">
        <!-- Summary Message -->
        <p class="text-body-1 mb-6">
          {{ dialogMessage }}
        </p>

        <!-- Files Committed -->
        <div
          v-if="deployStore.deploymentInfo.filesCommitted.length"
          class="mb-6"
        >
          <h3 class="text-h6 font-weight-medium mb-2">
            {{
              t("components.deployHandler.nextStepsDialog.filesCommitted.title")
            }}
          </h3>
          <div class="pl-4">
            <p
              v-for="file in deployStore.deploymentInfo.filesCommitted"
              :key="file"
              class="text-body-2 d-flex align-center ga-3 mb-1"
            >
              <v-icon style="font-size: 6px">mdi-circle</v-icon>
              {{ file }}
            </p>
          </div>
        </div>

        <!-- Environment Variables Updated -->
        <div v-if="deployStore.deploymentInfo.envs.length" class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2">
            {{ t("components.deployHandler.nextStepsDialog.envAdded.title") }}
          </h3>
          <div class="pl-4">
            <p
              v-for="env in deployStore.deploymentInfo.envs"
              :key="env"
              class="text-body-2 d-flex align-center ga-3 mb-1"
            >
              <v-icon style="font-size: 6px">mdi-circle</v-icon>
              {{ env }}
            </p>
          </div>
        </div>

        <!-- Success Messages / Next Steps -->
        <div v-if="deployStore.deploymentInfo.messages.length" class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2">
            {{ t("components.deployHandler.nextStepsDialog.nextSteps.title") }}
          </h3>
          <div class="pl-4">
            <p
              v-for="message in deployStore.deploymentInfo.messages"
              :key="message"
              class="text-body-2 d-flex align-center ga-3 mb-1"
            >
              <v-icon style="font-size: 6px">mdi-circle</v-icon>
              {{ message }}
            </p>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="deployStore.deploymentInfo.errors?.length" class="mb-6">
          <h3 class="text-h6 font-weight-medium mb-2 text-error">
            {{ t("components.deployHandler.nextStepsDialog.errors.title") }}
          </h3>
          <div class="pl-4">
            <p
              v-for="error in deployStore.deploymentInfo.errors"
              :key="error"
              class="text-body-2 d-flex align-center ga-3 mb-1"
            >
              <v-icon style="font-size: 6px">mdi-circle</v-icon>
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Debugging Information Section -->
        <div class="mb-6">
          <h3 class="text-subtitle-s font-weight-medium mb-2">
            {{ t("components.deployHandler.nextStepsDialog.debugSection") }}
          </h3>
          <v-alert type="info" variant="tonal" density="compact" class="mt-2">
            <p class="text-body-2 mb-2">
              {{ t("components.deployHandler.nextStepsDialog.debugIntro") }}
            </p>
            <ul class="text-body-2">
              <li>
                <strong
                  >{{
                    t("components.deployHandler.nextStepsDialog.buildLogs")
                  }}:</strong
                >
                {{
                  t(
                    "components.deployHandler.nextStepsDialog.buildLogsDescription"
                  )
                }}
                <div class="my-4">
                  <a
                    :href="`${deployStore.project?.webUrl}/-/jobs`"
                    target="_blank"
                  >
                    <img
                      src="/icons/GitLab.svg"
                      alt="gitLab"
                      style="
                        width: 30px;
                        height: 30px;
                        margin-right: 10px;
                        vertical-align: middle;
                      "
                    />
                    <span>Gitlab</span>
                  </a>
                </div>
              </li>
              <li v-if="env.POD_VIEWER_URL" class="mt-2">
                <strong
                  >{{
                    t("components.deployHandler.nextStepsDialog.appStatus")
                  }}:</strong
                >
                {{
                  t(
                    "components.deployHandler.nextStepsDialog.appStatusDescription"
                  )
                }}
                <div class="my-4">
                  <a :href="env.POD_VIEWER_URL" target="_blank">
                    <img
                      src="/icons/podviewer.png"
                      alt="podViewer"
                      style="
                        width: 30px;
                        height: 30px;
                        margin-right: 10px;
                        vertical-align: middle;
                      "
                    />
                    <span>PodViewer</span>
                  </a>
                </div>
                {{
                  t("components.deployHandler.nextStepsDialog.appStatusPattern")
                }}
                <strong>username-projectname-deploymentId</strong>.
              </li>
            </ul>
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          :color="
            deployStore.deploymentInfo?.errors.length ? 'error' : 'primary'
          "
          variant="tonal"
          class="px-4"
          @click="deployStore.nextStepsDialog = false"
        >
          {{
            deployStore.deploymentInfo?.errors.length
              ? t("components.deployHandler.nextStepsDialog.closeReview")
              : t("components.deployHandler.nextStepsDialog.close")
          }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";
import { computed } from "vue";
import { env } from "@/config/env";

const { t } = useLocale();
const deployStore = useDeployStore();

// Computed properties for deployment status
const deploymentStatus = computed(() => {
  const files = deployStore.deploymentInfo
    ? deployStore.deploymentInfo?.filesCommitted.length > 0
    : false;
  const envs = deployStore.deploymentInfo
    ? deployStore.deploymentInfo?.envs.length > 0
    : false;
  const messages = deployStore.deploymentInfo
    ? deployStore.deploymentInfo?.messages.length > 0
    : false;
  const errors = deployStore.deploymentInfo
    ? deployStore.deploymentInfo?.errors.length > 0
    : false;

  return {
    hasFiles: files,
    hasEnvs: envs,
    hasMessages: messages,
    hasErrors: errors,
    isSuccess: (files || envs || messages) && !errors,
    hasPartialSuccess: (files || envs || messages) && errors,
    isErrorOnly: errors && !files && !envs && !messages,
    isNoChanges: !files && !envs && !messages && !errors,
  };
});

// Dynamic title based on deployment outcome
const dialogTitle = computed(() => {
  if (deploymentStatus.value.isErrorOnly)
    return t("components.deployHandler.nextStepsDialog.errorTitle");
  if (deploymentStatus.value.hasPartialSuccess)
    return t("components.deployHandler.nextStepsDialog.partialSuccessTitle");
  if (deploymentStatus.value.isSuccess)
    return t("components.deployHandler.nextStepsDialog.successTitle");
  return t("components.deployHandler.nextStepsDialog.noChangesTitle");
});

// Dynamic message based on deployment outcome
const dialogMessage = computed(() => {
  if (deploymentStatus.value.isErrorOnly)
    return t("components.deployHandler.nextStepsDialog.errorMessage");
  if (deploymentStatus.value.hasPartialSuccess)
    return t("components.deployHandler.nextStepsDialog.partialSuccessMessage");
  if (deploymentStatus.value.isSuccess)
    return t("components.deployHandler.nextStepsDialog.successMessage");
  return t("components.deployHandler.nextStepsDialog.noChangesMessage");
});
</script>
