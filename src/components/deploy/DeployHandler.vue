<!-- Main Deploy Component -->
<template>
  <div>
    <DeployButton :project="project" />
    <DeployDialog />
    <ConfirmDialog />
    <NextStepsDialog />
  </div>
</template>

<script setup lang="ts">
import type { ProjectNode } from "@/types/project";
import DeployButton from "./DeployButton.vue";
import DeployDialog from "./DeployDialog.vue";
import ConfirmDialog from "./DeployConfirmDialog.vue";
import NextStepsDialog from "./DeployNextStepsDialog.vue";

const { project } = defineProps<{
  project: ProjectNode;
}>();
</script>
