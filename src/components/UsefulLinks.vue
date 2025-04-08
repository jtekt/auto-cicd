<template>
  <div v-if="usefulLinks.length > 0">
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
          <v-list>
            <v-list-item
              v-for="(link, index) in usefulLinks"
              :key="index"
              class="mb-2"
            >
              <template #prepend>
                <img
                  :src="link.icon"
                  :alt="link.name"
                  style="
                    width: 50px;
                    height: 50px;
                    margin-right: 10px;
                    vertical-align: middle;
                  "
                />
              </template>
              <v-list-item-title class="text-h6">
                <a :href="link.url" target="_blank">
                  {{ link.name }}
                </a>
              </v-list-item-title>
              <p class="text-body-2">
                {{ t(link.descriptionKey) }}
              </p>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="dialog = false">
            {{ t("components.usefulLinks.closeButton") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { ref } from "vue";

const { t } = useLocale();

// State for dialog
const dialog = ref(false);

// List of useful links with icons, URLs, and description keys
const usefulLinks = [
  ...(import.meta.env.VITE_APP_POD_VIEWER_URL
    ? [
        {
          name: "PodViewer",
          icon: "/icons/podviewer.png",
          url: import.meta.env.VITE_APP_POD_VIEWER_URL,
          descriptionKey: "components.usefulLinks.links.podViewerDescription",
        },
      ]
    : []),
];
</script>
