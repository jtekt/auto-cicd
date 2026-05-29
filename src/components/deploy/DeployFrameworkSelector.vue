<template>
  <v-select
    v-model="deployStore.frameworkSelector"
    :items="deployStore.frameworks"
    item-title="name"
    item-value="id"
    :label="t('components.deployHandler.deployDialog.selectFramework')"
    variant="outlined"
    hide-details
    class="mb-4"
  >
    <template #selection="{ item }">
      <div class="d-flex align-center" style="gap: 16px">
        <v-img
          :src="item.raw.image"
          alt="Framework Image"
          width="28"
          height="28"
        />
        {{ item.raw.name }}
      </div>
    </template>
    <template #item="{ item, props }">
      <v-list-item
        v-bind="props"
        :prepend-avatar="item.raw.image ? item.raw.image : undefined"
        style="font-size: 28px"
      />
    </template>
  </v-select>
  <v-select
    v-if="deployStore.packageManagersOptions.length > 0"
    v-model="deployStore.managerSelector"
    :items="deployStore.packageManagersOptions"
    item-title="title"
    item-value="value"
    :label="t('components.deployHandler.deployDialog.selectPackageManager')"
    variant="outlined"
    hide-details
    class="mb-4"
  />
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";

const { t } = useLocale();
const deployStore = useDeployStore();
</script>
