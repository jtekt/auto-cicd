<template>
  <v-dialog v-model="modelValue" max-width="650">
    <v-card
      class="pa-6 d-flex flex-column"
      style="min-height: 400px"
      elevation="2"
    >
      <h2>{{ t("components.tutorial.title") }}</h2>

      <!-- Step Progress Indicator -->
      <div class="my-2">
        <v-stepper :model-value="stepIndex + 1" flat mobile hide-actions>
          <v-stepper-header>
            <template
              v-for="value in Array.from(
                { length: steps.length },
                (_, i) => i + 1
              )"
            >
              <v-stepper-item
                :value="value"
                :complete="stepIndex + 1 > value"
              ></v-stepper-item>
              <v-divider v-if="value < steps.length"></v-divider>
            </template>
          </v-stepper-header>
        </v-stepper>
      </div>

      <p>{{ t(currentStep.description) }}</p>

      <div v-if="currentStep.link" class="mt-2">
        <v-btn
          variant="tonal"
          color="primary"
          :href="currentStep.link"
          target="_blank"
        >
          {{ t("components.tutorial.openGroup") }}
        </v-btn>
      </div>

      <v-img
        v-if="currentStep.image"
        class="mt-4 mx-auto w-100"
        :src="currentStep.image"
        max-width="500"
      ></v-img>

      <v-divider class="my-2 mt-auto"></v-divider>

      <v-card-actions>
        <v-row justify="space-between" class="w-100">
          <v-btn :disabled="stepIndex === 0" @click="prevStep">
            {{ t("components.tutorial.previous") }}
          </v-btn>

          <div>
            <v-btn
              v-if="stepIndex < steps.length - 1"
              color="primary"
              class="mr-2"
              @click="nextStep"
            >
              {{ t("components.tutorial.next") }}
            </v-btn>

            <v-btn
              v-if="stepIndex === steps.length - 1"
              color="primary"
              @click="finish"
            >
              {{ t("components.tutorial.finish") }}
            </v-btn>
          </div>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const modelValue = defineModel<boolean>("modelValue");

const { t } = useI18n();

const steps: { description: string; link?: string; image?: string }[] = [
  { description: "components.tutorial.steps.intro" },
  { description: "components.tutorial.steps.findProject" },
  { description: "components.tutorial.steps.deployButton" },
  {
    description: "components.tutorial.steps.frameworkInference",
    image: "/assets/tutorial/framework-inference.png",
  },
  {
    description: "components.tutorial.steps.configDocker",
    image: "/assets/tutorial/docker-config.png",
  },
  {
    description: "components.tutorial.steps.envVariables",
    image: "/assets/tutorial/env-variables.png",
  },
  {
    description: "components.tutorial.steps.reviewCommit",
    image: "/assets/tutorial/review-commit.png",
  },
];

const stepIndex = ref(0);
const currentStep = computed(() => steps[stepIndex.value]!);

// Reset stepIndex when dialog closes
watch(modelValue, (newValue) => {
  if (!newValue) {
    stepIndex.value = 0;
  }
});

function nextStep() {
  if (stepIndex.value < steps.length - 1) stepIndex.value++;
}

function prevStep() {
  if (stepIndex.value > 0) stepIndex.value--;
}

function finish() {
  modelValue.value = false;
}
</script>
