<template>
  <div class="mt-4 d-flex flex-column ga-1">
    <strong>{{ t("components.support.needHelp") }}</strong>

    <v-btn
      v-for="(c, i) in supportContacts"
      :key="i"
      :href="c.url"
      target="_blank"
      rel="noopener"
      class="justify-start"
    >
      <v-icon v-if="c.icon" class="mr-2">{{ c.icon }}</v-icon>
      {{ c.label }}
    </v-btn>

    <div v-if="!supportContacts.length" class="text-error">
      {{ t("components.support.noSupportConfigured") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { supportContacts } from "@/config";
import { useLocale } from "vuetify";

const { t } = useLocale();


</script>
