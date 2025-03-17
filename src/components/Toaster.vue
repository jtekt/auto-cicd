<template>
  <div class="toast-container">
    <v-slide-y-transition group>
      <v-card
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="toast.type"
        @click="removeToast(toast.id)"
      >
        <div class="toast-content">
          <v-icon size="24">{{ getIcon(toast.type) }}</v-icon>
          <span>{{ toast.message }}</span>
        </div>
      </v-card>
    </v-slide-y-transition>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useToast, type ToastType } from "@/stores/toast";

const toastStore = useToast();
const { toasts } = storeToRefs(toastStore);
const { removeToast } = toastStore;

// Map toast types to Material Design icons
const getIcon = (type: ToastType) => {
  switch (type) {
    case "success":
      return "mdi-check-circle";
    case "error":
      return "mdi-alert-circle";
    case "warning":
      return "mdi-alert";
    case "info":
      return "mdi-information";
    default:
      return "mdi-message-text";
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10000;
}

.toast-item {
  padding: 12px;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  min-width: 300px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Toast Type Colors */
.success {
  background: #4caf50; /* Green */
}

.error {
  background: #f44336; /* Red */
}

.warning {
  background: #ff9800; /* Orange */
}

.info {
  background: #2196f3; /* Blue */
}

.default {
  background: #333; /* Dark */
}
</style>
