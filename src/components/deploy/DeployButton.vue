<template>
  <v-tooltip :disabled="canDeploy" location="bottom">
    <template v-slot:activator="{ props }">
      <div v-bind="props">
        <v-btn
          color="success"
          variant="tonal"
          :disabled="!canDeploy"
          @click="deployStore.openDeployment(project)"
        >
          <v-icon start icon="mdi-rocket-launch-outline" />
          {{
            isDeployed(project)
              ? t("components.deployHandler.actions.redeploy")
              : t("components.deployHandler.actions.deploy")
          }}
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

const { t } = useLocale();
const deployStore = useDeployStore();

const { project } = defineProps<{
  project: ProjectNode;
}>();

// GitLab access levels: guest=10, reporter=20, developer=30, maintainer=40, owner=50
const MAINTAINER_ACCESS_LEVEL = 40;

const canDeploy = computed(() => {
  return (
    project.maxAccessLevel?.integerValue !== undefined &&
    project.maxAccessLevel.integerValue >= MAINTAINER_ACCESS_LEVEL
  );
});
</script>
