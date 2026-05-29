<template>
  <v-dialog
    v-model="deployStore.confirmDeployDialog"
    width="900"
    max-width="90vw"
    max-height="90vh"
  >
    <v-card
      :prepend-icon="hasChanges ? 'mdi-check-all' : 'mdi-information-outline'"
      class="pa-2"
    >
      <template #title>
        <span class="text-h5 font-weight-bold">
          {{
            hasChanges
              ? t("components.deployHandler.confirmDialog.title")
              : t("components.deployHandler.confirmDialog.noChangesTitle")
          }}
        </span>
      </template>

      <v-card-text class="mt-4">
        <!-- Missing Files Warning -->
        <v-alert
          variant="tonal"
          color="warning"
          class="mb-5"
          v-if="deployStore.filesMightHaveMissed?.length"
        >
          {{ t("components.deployHandler.confirmDialog.missingFiles") }}
          [
          <template
            v-for="(fm, index) in deployStore.filesMightHaveMissed"
            :key="index"
          >
            <template v-if="Array.isArray(fm)">
              <!-- Handle string[] (sub-array) with 'or' -->
              <span v-for="(subItem, subIndex) in fm" :key="subIndex">
                <strong>{{ subItem }}</strong>
                <span v-if="subIndex < fm.length - 1"> | </span>
              </span>
            </template>
            <template v-else>
              <!-- Handle string -->
              <strong>{{ fm }}</strong>
            </template>
            <!-- Add comma between top-level items if not the last one -->
            <span v-if="index < deployStore.filesMightHaveMissed.length - 1"
              >,
            </span>
          </template>
          ]
        </v-alert>

        <!-- Main Description -->
        <p class="text-body-1 mb-4">
          {{
            hasChanges
              ? t("components.deployHandler.confirmDialog.message")
              : t("components.deployHandler.confirmDialog.noChangesMessage")
          }}
        </p>

        <!-- Files Section -->
        <div id="tour-confirm-files" class="mb-6">
          <h3 class="text-subtitle-s font-weight-medium mb-2">
            {{ t("components.deployHandler.confirmDialog.filesSection") }}
          </h3>
          <v-expansion-panels
            v-if="deployStore.injectFiles.length"
            variant="popout"
            elevation="1"
            class="rounded-lg"
          >
            <v-expansion-panel
              v-for="(fileInfo, index) in deployStore.injectFiles"
              :key="index"
            >
              <template #title>
                <div class="d-flex align-center ga-4">
                  <v-checkbox
                    v-model="fileInfo.isChecked"
                    color="success"
                    hide-details
                    @click.stop
                  />
                  <v-chip
                    :color="fileInfo.action === 'update' ? 'info' : 'success'"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{
                      fileInfo.action === "update"
                        ? t("components.deployHandler.confirmDialog.update")
                        : t("components.deployHandler.confirmDialog.create")
                    }}
                  </v-chip>
                  <span class="font-weight-medium">{{
                    fileInfo.fileName
                  }}</span>
                </div>
              </template>
              <template #text>
                <CodeEditor
                  :default-value="fileInfo.content"
                  max-height="300"
                  readonly
                  class="mt-2 text-body-2"
                />
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-alert
            v-else
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            {{ t("components.deployHandler.confirmDialog.noFileChanges") }}
          </v-alert>
        </div>

        <!-- Environment Variables Section -->
        <div
          v-if="
            deployStore.envChanges.added.length ||
            deployStore.envChanges.modified.length ||
            deployStore.envChanges.removed.length
          "
          class="mb-6"
        >
          <DeployEnvStatus />
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn id="tour-confirm-help-btn" icon="mdi-help-circle-outline" variant="text" @click="startConfirmTour" />
        <v-spacer />
        <v-btn
          v-if="hasChanges"
          id="tour-confirm-continue"
          color="success"
          class="px-4"
          variant="tonal"
          @click="deployStore.confirmDeploy"
        >
          {{ t("components.deployHandler.confirmDialog.continue") }}
        </v-btn>
        <v-btn variant="tonal" class="px-4" @click="deployStore.cancelDeploy">
          {{ t("components.deployHandler.confirmDialog.cancelBtn") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";
import { computed, watch } from "vue";
import { useTour } from "@/composables/useTour";

const { t } = useLocale();
const deployStore = useDeployStore();
const { startTour } = useTour();


const CONFIRM_TOUR_KEY = "tour-confirm-done";

const hasChanges = computed(() => {
  return !!(
    deployStore.injectFiles.length > 0 ||
    deployStore.envChanges.added.length > 0 ||
    deployStore.envChanges.modified.length > 0 ||
    deployStore.envChanges.removed.length > 0
  );
});

function startConfirmTour() {
  const steps = [
    {
      element: "#tour-confirm-files",
      popover: {
        title: t("components.confirmTour.fileList.title"),
        description: t("components.confirmTour.fileList.description"),
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      popover: {
        title: t("components.confirmTour.dockerfile.title"),
        description: t("components.confirmTour.dockerfile.description"),
      },
    },
    {
      element: "#tour-confirm-continue",
      popover: {
        title: t("components.confirmTour.continueBtn.title"),
        description: t("components.confirmTour.continueBtn.description"),
        side: "top" as const,
        align: "end" as const,
      },
    },
  ];
  startTour(steps, "#tour-confirm-help-btn", () => {
    localStorage.setItem(CONFIRM_TOUR_KEY, "1");
  });
}

// Auto-start confirm tour on first open
watch(
  () => deployStore.confirmDeployDialog,
  (open) => {
    if (open && !localStorage.getItem(CONFIRM_TOUR_KEY)) {
      setTimeout(() => startConfirmTour(), 300);
    }
  },
);
</script>
