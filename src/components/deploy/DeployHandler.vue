<template>
  <ConfirmDialog />
  <NextStepsDialog />
  <DeployDialog />
  <UndeployConfirmDialog />
</template>

<script setup lang="ts">
import DeployDialog from "./DeployDialog.vue";
import ConfirmDialog from "./DeployConfirmDialog.vue";
import NextStepsDialog from "./DeployNextStepsDialog.vue";
import UndeployConfirmDialog from "./UndeployConfirmDialog.vue";
</script>
