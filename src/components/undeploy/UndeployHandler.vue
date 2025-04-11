<template>
  <v-btn color="red" variant="tonal" @click="confirmUndeploy()">
    {{ t("components.undeployHandler.undeploy") }}
  </v-btn>

  <v-dialog v-model="dialog" width="auto">
    <v-card>
      <v-card-title class="headline">{{
        t("components.undeployHandler.confirmUndeployTitle")
      }}</v-card-title>
      <v-card-text>
        {{
          t("components.undeployHandler.confirmUndeployMessage", {
            projectName: project ? project.projectName : "",
          })
        }}
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="grey" @click="dialog = false">{{
          $t("components.undeployHandler.cancel")
        }}</v-btn>
        <v-btn color="red" variant="tonal" @click="handleUndeployConfirmed()">
          {{ $t("components.undeployHandler.confirm") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { ProjectNode } from "@/types/project";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const dialog = ref(false);

const confirmUndeploy = () => {
  dialog.value = true;
};

const handleUndeployConfirmed = () => {
  dialog.value = false;

  emit("handleUndeploy"); // Call your original undeploy function
};

defineProps<{ project: ProjectNode }>();

const emit = defineEmits(["handleUndeploy"]);
</script>
