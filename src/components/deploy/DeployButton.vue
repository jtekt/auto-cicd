<template>
  <v-btn
    :color="'success'"
    variant="tonal"
    @click="deployStore.openDeployment(project)"
  >
    <v-icon start icon="mdi-rocket-launch-outline" />
    {{ t("components.deployHandler.actionBtn") }}
  </v-btn>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";
import type { ProjectNode } from "@/types/project";

const { t } = useLocale();
const deployStore = useDeployStore();

const { project } = defineProps<{
  project: ProjectNode;
}>();
</script>
