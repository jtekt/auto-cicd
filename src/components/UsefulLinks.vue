<template>
  <v-btn
    variant="elevated"
    color="primary"
    size="large"
    @click="dialog = true"
    class="font-weight-bold"
  >
    {{ t("components.usefulLinks.buttonText") }}
  </v-btn>

  <!-- Dialog with useful links -->
  <v-dialog v-model="dialog" width="600" max-width="90vw" max-height="90vh">
    <v-card class="pa-2">
      <template #title>
        <span class="text-h5 font-weight-bold">
          {{ t("components.usefulLinks.dialogTitle") }}
        </span>
      </template>

      <v-card-text class="mt-4">
        <p class="text-body-1 mb-4">
          {{ t("components.usefulLinks.dialogDescription") }}
        </p>

        <!-- List of useful links -->
        <v-list v-if="config">
          <v-list-item
            v-for="(link, index) in config.usefulLinks"
            :key="index"
            class="mb-2"
          >
            <template #prepend>
              <img
                :src="link.icon"
                :alt="link.name"
                style="
                  width: 40px;
                  height: 40px;
                  margin-right: 16px;
                "
              />
            </template>
            <v-list-item-title>
              <a :href="link.url" target="_blank">
                {{ link.name }}
              </a>
            </v-list-item-title>
            <p class="text-body-2">
              {{
                link.description[current as "ja"] ??
                Object.values(link.description)[0]
              }}
            </p>
          </v-list-item>
        </v-list>
        <MoreInformationsSection />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="tonal" @click="dialog = false">
          {{ t("components.usefulLinks.closeButton") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { onMounted, ref } from "vue";
import MoreInformationsSection from "./MoreInformationsSection.vue";
import { getConfig } from "@/config";

const config = getConfig();

const { t, current } = useLocale();

// State for dialog
const dialog = ref(false);

onMounted(() => {
  // Check if first 3 times login and show the links
  const hasUsed = parseInt(localStorage.getItem("welcome") || "", 10);
  const safeHasUsed = Number.isNaN(hasUsed) ? 0 : hasUsed;

  if (safeHasUsed > 2) return;

  dialog.value = true;
  localStorage.setItem("welcome", (safeHasUsed + 1).toString());
});
</script>
