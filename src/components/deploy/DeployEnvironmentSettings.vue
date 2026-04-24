<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      {{ t("components.deployHandler.deployDialog.envSettings.title") }}
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <p class="mb-2 text-subtitle-1">
        {{ t("components.deployHandler.deployDialog.envSettings.description") }}
      </p>

      <p v-if="hasEnvResource" class="mb-2 text-body-2">
        {{ t("components.deployHandler.deployDialog.envSettings.existing") }}
      </p>

      <p v-else class="mb-2 text-body-2">
        {{ t("components.deployHandler.deployDialog.envSettings.missing") }}
      </p>

      <a
        v-if="hasEnvResource"
        :href="envUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t("components.deployHandler.deployDialog.envSettings.link") }}
      </a>

      <v-textarea
        v-model="deployStore.environmentVariables"
        variant="outlined"
        auto-grow
        rows="6"
        :error="!!envError"
        :error-messages="envError"
        @blur="handleEnvBlur"
        spellcheck="false"
      />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";
import { validateEnv } from "@/libs/env";

const { t } = useLocale();
const deployStore = useDeployStore();

const envError = ref<string | null>(null);

const hasEnvResource = computed(() => {
  return deployStore.originalEnvironmentVariables !== null;
});

const envUrl = computed(
  () =>
    `${deployStore.project?.webUrl}/-/settings/ci_cd#js-cicd-variables-settings:~:text=Actions-,ENV`,
);
/**
 * Validate on blur
 */
const handleEnvBlur = () => {
  const result = validateEnv(deployStore.environmentVariables || "");

  if (result.valid) return;

  envError.value = t("env.invalid", {
    details: result.errors.map((e) => `Line ${e.line}`).join(", "),
  });
};
</script>
