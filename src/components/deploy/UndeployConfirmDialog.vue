<template>
  <v-dialog v-model="deployStore.undeployDialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="text-h6 pt-4 px-6">
        {{ t("components.deployHandler.undeployDialog.title") }}
      </v-card-title>

      <v-card-text class="px-6">
        <p>{{ t("components.deployHandler.undeployDialog.message") }}</p>
        <v-alert type="error" variant="tonal" class="mt-3" density="compact">
          {{ t("components.deployHandler.undeployDialog.warning") }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="deployStore.undeployDialog = false">
          {{ t("components.deployHandler.cancelBtn") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :loading="deployStore.isLoading"
          @click="deployStore.confirmUndeploy()"
        >
          {{ t("components.deployHandler.undeployDialog.confirm") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";

const { t } = useLocale();
const deployStore = useDeployStore();
</script>
