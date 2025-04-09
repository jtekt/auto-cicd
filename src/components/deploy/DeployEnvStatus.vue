<template>
  <h3 class="text-subtitle-s font-weight-medium mb-2">
    {{ t("components.deployHandler.envStatus.title") }}
  </h3>
  <!-- Added Variables -->
  <div v-if="deployStore.envChanges.added.length" class="mb-2">
    <p class="text-body-2 font-weight-medium">
      {{ t("components.deployHandler.envStatus.added") }}
    </p>
    <v-alert
      v-for="(env, index) in deployStore.envChanges.added"
      :key="`added-${index}`"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-1"
    >
      <span class="font-weight-medium">{{ env.key }}</span>
    </v-alert>
  </div>

  <!-- Modified Variables -->
  <div v-if="deployStore.envChanges.modified.length" class="mb-2">
    <p class="text-body-2 font-weight-medium">
      {{ t("components.deployHandler.envStatus.modified") }}
    </p>
    <v-alert
      v-for="(env, index) in deployStore.envChanges.modified"
      :key="`modified-${index}`"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-1"
    >
      <span class="font-weight-medium">{{ env.key }}</span>
    </v-alert>
  </div>

  <!-- Removed Variables -->
  <div v-if="deployStore.envChanges.removed.length" class="mb-2">
    <p class="text-body-2 font-weight-medium">
      {{ t("components.deployHandler.envStatus.removed") }}
    </p>
    <v-alert
      v-for="(env, index) in deployStore.envChanges.removed"
      :key="`removed-${index}`"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-1"
    >
      <span class="font-weight-medium">{{ env.key }}</span>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { useDeployStore } from "@/stores/deploy";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const deployStore = useDeployStore();
</script>
