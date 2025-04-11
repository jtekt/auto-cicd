<template>
  <v-btn
    color="success"
    variant="tonal"
    @click="deployStore.openDeployment(project)"
  >
    <v-icon start icon="mdi-rocket-launch-outline" />
    {{
      isDeployed(project)
        ? t("components.deployHandler.actions.redeploy")
        : t("components.deployHandler.actions.deploy")
    }}
  </v-btn>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";
import type { ProjectNode } from "@/types/project";
import { isDeployed } from "@/libs/gitlab";

const { t } = useLocale();
const deployStore = useDeployStore();

const { project } = defineProps<{
  project: ProjectNode;
}>();
</script>
