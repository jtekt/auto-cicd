<template>
  <div>
    <v-select
      v-model="deployStore.frameworkSelector"
      :items="deployStore.frameworks"
      item-title="name"
      item-value="id"
      :label="t('components.deployHandler.deployDialog.selectFramework')"
      variant="outlined"
      :error="deployStore.projectConfig.framework === 'unknown'"
    >
      <template #selection="{ item }">
        <div class="d-flex align-center" style="gap: 16px">
          <v-img
            v-if="item.raw.image.type === 'img'"
            :src="item.raw.image.value"
            alt="Framework Image"
            width="28"
            height="28"
          />
          <v-icon v-else style="font-size: 28px">
            {{ item.raw.image.value }}
          </v-icon>
          {{ item.raw.name }}
        </div>
      </template>
      <template #item="{ item, props }">
        <v-list-item
          v-bind="props"
          :prepend-avatar="
            item.raw.image.type === 'img' ? item.raw.image.value : undefined
          "
          :prepend-icon="
            item.raw.image.type === 'icon' ? item.raw.image.value : undefined
          "
          style="font-size: 28px"
        />
      </template>
    </v-select>
    <v-select
      v-if="
        deployStore.packageManagersOptions.length > 0 &&
        deployStore.projectConfig.framework !== 'unknown'
      "
      v-model="deployStore.managerSelector"
      :items="deployStore.packageManagersOptions"
      item-title="title"
      item-value="value"
      :label="t('components.deployHandler.deployDialog.selectPackageManager')"
      variant="outlined"
    />
  </div>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";

const { t } = useLocale();
const deployStore = useDeployStore();
</script>
