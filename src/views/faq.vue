<template>
  <v-container>
    <!-- Expansion Panels -->
    <v-expansion-panels>
      <!-- FAQ 1: How to Move a Repository -->
      <v-expansion-panel id="move-project">
        <v-expansion-panel-title>
          {{ t("views.faq.moveProject") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list lines="one">
            <v-list-item>
              <strong>1. </strong> {{ t("views.faq.steps.1") }}
            </v-list-item>
            <v-list-item>
              <strong>2. </strong> {{ t("views.faq.steps.2") }}
            </v-list-item>
            <v-list-item>
              <strong>3. </strong> {{ t("views.faq.steps.3") }}
            </v-list-item>
            <v-list-item>
              <strong>4. </strong> {{ t("views.faq.steps.4") }}
            </v-list-item>
            <v-list-item>
              <strong>5. </strong> {{ t("views.faq.steps.5") }}
            </v-list-item>
            <v-list-item>
              <strong>6. </strong> {{ t("views.faq.steps.6") }}
            </v-list-item>
            <v-list-item>
              <strong>7. </strong> {{ t("views.faq.steps.7") }}
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <SupportContact />
  </v-container>
</template>

<script setup lang="ts">
import SupportContact from "@/components/SupportContact.vue";
import { useLocale } from "vuetify";

const { t } = useLocale();
</script>
