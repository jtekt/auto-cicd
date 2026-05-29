<template>
  <v-btn
    :id="props.id"
    variant="outlined"
    @click="dialog = true"
    prepend-icon="mdi-information-variant"
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
            class="mb-2 d-flex ga-4"
          >
            <template #prepend v-if="link.icon">
              <div>
                <img
                  v-if="link.icon.startsWith('http')"
                  :src="link.icon"
                  :alt="link.name"
                  class="link-icon"
                />

                <v-icon v-else :icon="link.icon" size="40" />
              </div>
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
import { ref } from "vue";
import { getConfig } from "@/config";

const props = defineProps<{
  id?: string;
}>();

const config = getConfig();

const { t, current } = useLocale();

const dialog = ref(false);
</script>

<style scoped>
.link-icon {
  width: 40px;
  height: 40px;
}
</style>
