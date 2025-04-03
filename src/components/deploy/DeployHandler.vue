<template>
  <ConfirmDialog />
  <NextStepsDialog />
  <DeployDialog />
</template>

<script setup lang="ts">
import type { ProjectNode } from "@/types/project";
import DeployDialog from "./DeployDialog.vue";
import ConfirmDialog from "./DeployConfirmDialog.vue";
import NextStepsDialog from "./DeployNextStepsDialog.vue";
</script>
