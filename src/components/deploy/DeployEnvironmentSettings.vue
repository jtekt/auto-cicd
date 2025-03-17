<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      {{ t("components.deployHandler.deployDialog.envSettings.title") }}
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <p class="mb-4 text-subtitle-2 font-weight-light">
        {{ t("components.deployHandler.deployDialog.envSettings.description") }}
      </p>
      <div
        v-for="(env, index) in deployStore.environmentVariables"
        :key="index"
        class="d-flex ga-4 align-center mb-4"
      >
        <v-text-field
          v-model="env.key"
          :label="t('components.deployHandler.deployDialog.envSettings.key')"
          variant="outlined"
          density="compact"
          hide-details
          :error="!!env.value && !env.key"
          :disabled="env.protected"
          @paste="(e: ClipboardEvent) => handlePaste(e, index)"
        />
        <v-text-field
          v-model="env.value"
          :label="t('components.deployHandler.deployDialog.envSettings.value')"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="env.protected"
          :append-inner-icon="env.visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="env.visible && !env.protected ? 'text' : 'password'"
          :error="!!env.key && !env.value"
          @click:append-inner="env.visible = !env.protected && !env.visible"
        />
        <v-btn
          density="comfortable"
          icon
          variant="tonal"
          color="error"
          @click="deployStore.environmentVariables.splice(index, 1)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        @click="
          deployStore.environmentVariables.push({
            key: '',
            value: '',
            visible: false,
          })
        "
      >
        {{ t("components.deployHandler.deployDialog.envSettings.addMore") }}
      </v-btn>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
import { useLocale } from "vuetify";
import { useDeployStore } from "@/stores/deploy";

const { t } = useLocale();
const deployStore = useDeployStore();

// Handle past environment variables directly from .env file
const handlePaste = (event: ClipboardEvent, index: number) => {
  // Prevent default paste action
  event.preventDefault();

  // Get pasted text
  const pastedText = event.clipboardData?.getData("text");

  if (!pastedText) return;

  // Normalize the pasted text: Remove carriage return characters (\r) and normalize line breaks
  const normalizedText = pastedText.replace(/\r/g, ""); // Remove \r characters
  const envLines = normalizedText
    .split("\n")
    .map((l) => l.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));

  const newVariables: { key: string; value: string; visible: boolean }[] = [];

  let isValidEnv = true;
  // Validate if the pasted lines are in valid .env format
  for (const line of envLines) {
    // If starts with #
    const match = line.match(/^([^#=]+)\s*=\s*(.*)$/); // Match key=value pairs and ignore comments
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ""); // Remove surrounding quotes
      newVariables.push({ key, value, visible: false });
    } else {
      // If any line is not valid .env format, we flag as invalid
      isValidEnv = false;
      break;
    }
  }

  // If the paste is a valid .env format, update the environment variables
  if (isValidEnv && newVariables.length > 0) {
    // If there is a focus on a particular key (index is provided), update that key
    deployStore.environmentVariables[index] = newVariables[0]; // Only update the first line

    // If there are more than one key-value pairs, add the rest as new entries
    if (newVariables.length > 1) {
      // Append the remaining new variables
      deployStore.environmentVariables.push(...newVariables.slice(1));
    }
  } else {
    // If the .env format is invalid, let the browser handle the paste normally
    const focusedElement = document.activeElement as HTMLInputElement;
    if (focusedElement) {
      const value = focusedElement.value;
      const cursorPosition = focusedElement.selectionStart || 0;
      const textBefore = value.slice(0, cursorPosition);
      const textAfter = value.slice(cursorPosition);

      // Insert the pasted text at the cursor position
      focusedElement.value = textBefore + pastedText + textAfter;
    }
  }
};
</script>
