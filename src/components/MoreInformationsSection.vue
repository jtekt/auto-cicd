<template>
  <div v-if="moreInformationURL" class="mt-4 d-flex flex-column ga-1">
    <strong>{{ t("components.information.moreInformation") }}</strong>

    <a :href="moreInformationURL" target="_blank" rel="noopener noreferrer">
      <v-btn
        variant="text"
      >
        <v-icon class="mr-2">mdi-help-circle</v-icon>
        {{ t("components.information.accessMoreInformation") }}
      </v-btn>
    </a>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";

const moreInformationURL = import.meta.env.VITE_APP_MORE_INFORMATION

const { t } = useLocale();
</script>
