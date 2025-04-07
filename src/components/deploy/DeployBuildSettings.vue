<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      {{ t("components.deployHandler.deployDialog.buildSettings.title") }}
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <p class="mb-4 text-subtitle-2 font-weight-light">
        {{
          t("components.deployHandler.deployDialog.buildSettings.description", {
            framework: selectedFramework.name,
          })
        }}
      </p>
      <v-text-field
        v-if="selectedFramework.userConfigurable?.installCommand"
        v-model="deployStore.projectConfig.installCommand"
        :label="
          t(
            'components.deployHandler.deployDialog.buildSettings.installCommand'
          )
        "
        variant="outlined"
        :class="
          deployStore.projectConfig.installCommand ===
          packageManagers[deployStore.projectConfig.manager].commands.install
            ? ''
            : 'text-warning'
        "
      />
      <v-text-field
        v-if="selectedFramework.userConfigurable?.buildCommand"
        v-model="deployStore.projectConfig.buildCommand"
        :label="
          t('components.deployHandler.deployDialog.buildSettings.buildCommand')
        "
        variant="outlined"
        :class="
          (selectedFramework.userConfigurable?.buildCommand.defaultEmpty &&
            !deployStore.projectConfig.buildCommand) ||
          deployStore.projectConfig.buildCommand ===
            packageManagers[deployStore.projectConfig.manager].commands.build
            ? ''
            : 'text-warning'
        "
      />
      <v-text-field
        v-if="selectedFramework.userConfigurable?.outputFile"
        v-model="deployStore.projectConfig.outputFile"
        :label="
          t('components.deployHandler.deployDialog.buildSettings.outputFile')
        "
        variant="outlined"
        :class="
          deployStore.repositoryFiles.find(
            (f) => f.fileName === deployStore.projectConfig.outputFile
          )
            ? ''
            : 'text-warning'
        "
        :loading="isSearching"
        append-inner-icon="mdi-help-circle-outline"
      >
        <template v-slot:append-inner>
          <v-tooltip activator="parent">
            <span>{{
              t(
                "components.deployHandler.deployDialog.buildSettings.outputFileDescription"
              )
            }}</span>
          </v-tooltip>
        </template>
      </v-text-field>
      <v-text-field
        v-if="selectedFramework.userConfigurable?.port"
        v-model="deployStore.projectConfig.port"
        :label="t('components.deployHandler.deployDialog.buildSettings.port')"
        variant="outlined"
        :class="
          deployStore.projectConfig.port === selectedFramework.port
            ? ''
            : 'text-warning'
        "
      />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { frameworksConfig, packageManagers } from "@/config/frameworks-config";
import { useDeployStore } from "@/stores/deploy";
import { computed, ref, watch } from "vue";

const { t } = useLocale();
const deployStore = useDeployStore();

const selectedFramework = computed(
  () => frameworksConfig[deployStore.projectConfig.framework]
);

// Debounce implementation
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Track if search is pending
const isSearching = ref(false);

// Debounced search function
const searchFileDebounced = debounce((fileName: string) => {
  if (fileName && fileName.trim() !== "") {
    isSearching.value = true;
    deployStore.searchFile(fileName).finally(() => {
      isSearching.value = false;
    });
  }
}, 800); // 800ms debounce delay

// Watch outputFile
watch(
  () => deployStore.projectConfig.outputFile,
  (newValue, oldValue) => {
    if (
      selectedFramework.value.userConfigurable?.outputFile &&
      newValue &&
      newValue !== oldValue &&
      newValue !== selectedFramework.value.outputFile &&
      deployStore.repositoryFiles.find((f) => f.fileName === newValue) ===
        undefined
    ) {
      searchFileDebounced(newValue);
    }
  },
  { immediate: false } // Don't trigger on initial load
);
</script>
