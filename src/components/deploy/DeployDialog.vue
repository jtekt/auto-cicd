<template>
  <v-dialog
    v-if="deployStore.project"
    v-model="deployStore.deployDialog"
    fullscreen
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
              <v-avatar image="/icons/GitLab.svg" size="24"></v-avatar>
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
          <DeployFrameworkSelector />
          <v-expansion-panels>
            <DeployBuildSettings
              v-if="
                deployStore.projectConfig &&
                frameworksConfig[deployStore.projectConfig.framework]
                  .userConfigurable
              "
            />
            <DeployEnvironmentSettings />
          </v-expansion-panels>
        </template>
      </div>
      <div
        class="d-flex justify-end ga-2"
        style="padding: 24px; margin-top: auto"
      >
        <v-btn
          color="success"
          variant="tonal"
          :disabled="
            deployStore.isLoading ||
            deployStore.projectConfig.framework === 'unknown'
          "
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
import { useLocale } from "vuetify";
import DeployFrameworkSelector from "./DeployFrameworkSelector.vue";
import DeployEnvironmentSettings from "./DeployEnvironmentSettings.vue";
import { useDeployStore } from "@/stores/deploy";
import DeployBuildSettings from "./DeployBuildSettings.vue";
import { frameworksConfig } from "@/config/frameworks-config";

const { t } = useLocale();
const deployStore = useDeployStore();
</script>
