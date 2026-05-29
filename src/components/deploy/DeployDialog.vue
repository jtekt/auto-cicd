<template>
  <v-dialog
    v-if="deployStore.project"
    v-model="deployStore.deployDialog"
    fullscreen
    persistent
    transition="dialog-bottom-transition"
  >
    <v-card :loading="deployStore.isLoading" style="height: 100%">
      <v-toolbar style="position: relative">
        <v-btn
          style="position: absolute; left: 0"
          icon="mdi-close"
          @click="deployStore.deployDialog = false"
        ></v-btn>
        <v-toolbar-items
          style="display: flex; justify-content: center; width: 100%"
        >
          <a
            :href="deployStore.project.webUrl"
            target="_blank"
            rel="noopener noreferrer"
            style="
              text-decoration: inherit;
              color: inherit;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: start;
            "
          >
            <p class="text-caption">
              {{
                t("components.deployHandler.deployDialog.deployingFromGitlab")
              }}
            </p>
            <div class="d-flex ga-2 align-center">
              <v-avatar image="https://about.gitlab.com/images/press/logo/svg/gitlab-logo-500.svg" size="24"></v-avatar>
              <p class="text-body-1 font-weight-medium">
                {{ deployStore.project.fullPath }}
              </p>
              <span class="d-flex align-center" style="color: gray">
                <v-icon size="18">mdi-source-branch</v-icon>
                <p>{{ deployStore.project.repository.rootRef }}</p>
              </span>
            </div>
          </a>
        </v-toolbar-items>
        <v-btn
          id="tour-deploy-help-btn"
          style="position: absolute; right: 0"
          icon="mdi-help-circle-outline"
          @click="startDeployTour"
        ></v-btn>
      </v-toolbar>
      <div
        style="
          padding: 24px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          overflow-y: auto;
        "
      >
        <v-alert
          v-if="deployStore.error"
          type="error"
          variant="tonal"
          class="pa-5"
        >
          {{ deployStore.error }}
        </v-alert>
        <template v-else-if="!deployStore.isLoading">
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
          <!-- Default output filename Warning -->
          <v-alert
            variant="tonal"
            color="warning"
            class="mb-5"
            v-if="deployStore.isOutputFileInvalid && deployStore.projectConfig"
          >
            {{
              t("components.deployHandler.confirmDialog.missingOutputFile", {
                framework: deployStore.projectConfig.framework,
                defaultFilename:
                  config?.frameworks[deployStore.projectConfig.framework]?.outputFile,
              })
            }}
          </v-alert>
          <div id="tour-deploy-framework">
            <DeployFrameworkSelector />
          </div>
          <v-expansion-panels v-if="deployStore.projectConfig">
            <DeployBuildSettings
              v-if="
                config?.frameworks[deployStore.projectConfig.framework]?.userConfigurable
              "
              id="tour-deploy-build"
            />
            <DeployEnvironmentSettings id="tour-deploy-env" />
          </v-expansion-panels>
          <v-alert v-else type="error" variant="tonal" class="pa-5 mt-5">
            {{ t("components.deployHandler.deployDialog.noFrameworkIdentified") }}
          </v-alert>
        </template>
      </div>
      <div
        id="tour-deploy-action"
        class="d-flex justify-end ga-2"
        style="padding: 24px; margin-top: auto"
      >
        <v-btn
          color="success"
          variant="tonal"
          :disabled="deployStore.isLoading || !deployStore.projectConfig"
          @click="deployStore.handleDeploy"
        >
          {{ t("components.deployHandler.actionBtn") }}
        </v-btn>
        <v-btn variant="tonal" @click="deployStore.deployDialog = false">
          {{ t("components.deployHandler.cancelBtn") }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import DeployFrameworkSelector from "./DeployFrameworkSelector.vue";
import DeployEnvironmentSettings from "./DeployEnvironmentSettings.vue";
import { useDeployStore } from "@/stores/deploy";
import DeployBuildSettings from "./DeployBuildSettings.vue";
import { useI18n } from "vue-i18n";
import { getConfig } from "@/config";
import { useTour } from "@/composables/useTour";
import { watch } from "vue";

const config = getConfig();
const { t } = useI18n();
const deployStore = useDeployStore();
const { startTour } = useTour();


const DEPLOY_TOUR_KEY = "tour-deploy-done";

function startDeployTour() {
  const hasBuildSettings =
    deployStore.projectConfig &&
    config?.frameworks[deployStore.projectConfig.framework]?.userConfigurable;

  const steps = [
    {
      element: "#tour-deploy-framework",
      popover: {
        title: t("components.deployTour.framework.title"),
        description: t("components.deployTour.framework.description"),
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    ...(hasBuildSettings
      ? [
          {
            element: "#tour-deploy-build",
            popover: {
              title: t("components.deployTour.buildSettings.title"),
              description: t("components.deployTour.buildSettings.description"),
              side: "bottom" as const,
              align: "start" as const,
            },
          },
        ]
      : []),
    {
      element: "#tour-deploy-env",
      popover: {
        title: t("components.deployTour.envSettings.title"),
        description: t("components.deployTour.envSettings.description"),
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: "#tour-deploy-action",
      popover: {
        title: t("components.deployTour.deployAction.title"),
        description: t("components.deployTour.deployAction.description"),
        side: "top" as const,
        align: "end" as const,
      },
    },
  ];

  startTour(steps, "#tour-deploy-help-btn", () => {
    localStorage.setItem(DEPLOY_TOUR_KEY, "1");
  });
}

// Auto-start deploy tour on first open
watch(
  () => deployStore.deployDialog,
  (open) => {
    if (open && !localStorage.getItem(DEPLOY_TOUR_KEY)) {
      // Wait for dialog content to render and loading to finish
      const unwatch = watch(
        () => deployStore.isLoading,
        (loading) => {
          if (!loading) {
            unwatch();
            setTimeout(() => startDeployTour(), 400);
          }
        },
        { immediate: true },
      );
    }
  },
);
</script>
