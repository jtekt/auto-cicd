<template>
  <div v-if="supportContact" class="mt-4 d-flex flex-column ga-1">
    <strong>{{ t("components.support.needHelp") }}</strong>

    <v-btn
      :href="supportContact"
      target="_blank"
      rel="noopener"
      class="justify-start"
    >
      <v-icon class="mr-2">mdi-help-circle-outline</v-icon>
      {{ t("components.support.contactSupport") }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";

const supportContact = import.meta.env.VITE_APP_SUPPORT_CONTACT

const { t } = useLocale();
</script>
