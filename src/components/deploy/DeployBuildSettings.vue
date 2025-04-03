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
        v-if="selectedFramework.userConfigurable?.rootDir"
        v-model="deployStore.projectConfig.rootDir"
        :label="
          t('components.deployHandler.deployDialog.buildSettings.rootDir')
        "
        variant="outlined"
        :class="
          deployStore.projectConfig.rootDir === selectedFramework.rootDir
            ? ''
            : 'text-warning'
        "
      />
      <v-text-field
        v-if="selectedFramework.userConfigurable?.outputDir"
        v-model="deployStore.projectConfig.outputDir"
        :label="
          t('components.deployHandler.deployDialog.buildSettings.outputDir')
        "
        variant="outlined"
        :class="
          deployStore.projectConfig.outputDir === selectedFramework.outputDir
            ? ''
            : 'text-warning'
        "
      />
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
        v-if="selectedFramework.userConfigurable?.outputFileName"
        v-model="deployStore.projectConfig.outputFileName"
        :label="
          t(
            'components.deployHandler.deployDialog.buildSettings.outputFileName'
          )
        "
        variant="outlined"
        :class="
          deployStore.repositoryFiles.find(
            (f) => f.fileName === deployStore.projectConfig.outputFileName
          )
            ? ''
            : 'text-warning'
        "
        :loading="isSearching"
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

// Watch outputFileName
watch(
  () => deployStore.projectConfig.outputFileName,
  (newValue, oldValue) => {
    if (
      selectedFramework.value.userConfigurable?.outputFileName &&
      newValue !== oldValue &&
      newValue !== selectedFramework.value.outputFileName &&
      newValue
    ) {
      searchFileDebounced(newValue);
    }
  },
  { immediate: false } // Don't trigger on initial load
);
</script>
