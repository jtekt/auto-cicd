<template>
  <v-tooltip :disabled="canUndeploy" location="bottom">
    <template v-slot:activator="{ props }">
      <div v-bind="props">
        <v-btn
          v-if="isDeployed(project) && cleanupTemplate"
          color="error"
          variant="tonal"
          :disabled="!canUndeploy"
          @click="deployStore.openUndeploy(project)"
        >
          <v-icon start icon="mdi-delete-outline" />
          {{ t("components.deployHandler.actions.undeploy") }}
        </v-btn>
      </div>
    </template>
    <span>{{
      t("components.deployHandler.errors.insufficientPermissions")
    }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";
import type { ProjectNode } from "@/types/project";
import { isDeployed } from "@/libs/gitlab";
import { CLEANUP_TEMPLATE_PATH, templates } from "@/config";
import { getTemplateCacheKey } from "@/utils/cache";

const cleanupTemplate = templates[getTemplateCacheKey(CLEANUP_TEMPLATE_PATH)];

const { t } = useLocale();
const deployStore = useDeployStore();

const { project } = defineProps<{
  project: ProjectNode;
}>();

const MAINTAINER_ACCESS_LEVEL = 40;

const canUndeploy = computed(() => {
  return (
    project.maxAccessLevel?.integerValue !== undefined &&
    project.maxAccessLevel.integerValue >= MAINTAINER_ACCESS_LEVEL
  );
});
</script>
