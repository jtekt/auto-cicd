<!-- components/ToastContainer.vue -->
<template>
  <div class="toast-container">
    <v-alert
      v-for="toast in toasts"
      :key="toast.id"
      :type="alertType(toast.type)"
      class="mb-2"
      border="start"
      elevation="2"
      rounded="lg"
      closable
      @click:close="remove(toast.id)"
    >
      <template #prepend>
        <v-progress-circular
          v-if="toast.type === 'loading'"
          indeterminate
          size="20"
        />
      </template>

      {{ toast.message }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useToast } from "@/stores/toast";

const store = useToast();
const { toasts } = storeToRefs(store);

const remove = (id: number | string) => store.removeToast(id);

const alertType = (t: string) => {
  switch (t) {
    case "success": return "success";
    case "error": return "error";
    case "warn": return "warning";
    case "info": return "info";
    case "loading":
    default: return undefined;
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 320px;
  z-index: 9999;
}
</style>
