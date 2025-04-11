<template>
  <div
    v-for="(toasts, area) in toastActiveAreas"
    :key="area"
    :style="getAreaStyles(area)"
  >
    <v-slide-y-transition group>
      <v-card
        v-for="(toast, index) in toasts"
        :key="toast.id"
        class="toast-item"
        :class="[toast.type, { invert: toast.invert }]"
        :style="{
          minWidth: '220px',
          maxWidth: '400px',
          margin: '8px',
          position: 'relative',
        }"
        elevation="6"
      >
        <div class="toast-content">
          <!-- Icon -->
          <v-icon
            v-if="toast.icon || getIcon(toast.type)"
            size="24"
            color="white"
          >
            {{ toast.icon || getIcon(toast.type) }}
          </v-icon>

          <v-progress-circular
            v-else-if="toast.type === 'loading'"
            indeterminate
            :size="24"
            color="white"
          />

          <!-- Message and Description -->
          <div class="toast-message">
            <span class="toast-title">{{ toast.message }}</span>
            <div v-if="toast.description" class="toast-description">
              {{ toast.description }}
            </div>
          </div>

          <!-- Action Button -->
          <v-btn
            v-if="toast.action"
            :style="toast.actionButtonStyle"
            variant="text"
            class="action-btn"
            :color="buttonColor"
            @click.stop="handleAction(toast)"
          >
            {{ toast.action }}
          </v-btn>

          <!-- Cancel Button -->
          <v-btn
            v-if="toast.cancel"
            :style="toast.cancelButtonStyle"
            variant="text"
            class="cancel-btn"
            :color="buttonColor"
            @click.stop="toastStore.dismiss(toast.id)"
          >
            {{ toast.cancel }}
          </v-btn>

          <!-- Close Button -->
          <v-btn
            v-if="toast.closeButton && toast.dismissible"
            size="x-small"
            variant="text"
            class="close-btn"
            :color="buttonColor"
            @click.stop="toastStore.dismiss(toast.id)"
            icon="mdi-close"
          />
        </div>
      </v-card>
    </v-slide-y-transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useToast, type Toast, type ToastType } from "@/stores/toast";
import { useTheme } from "vuetify";

const toastStore = useToast();
const theme = useTheme();

// Dynamic colors based on theme
const isDark = computed(() => theme.current.value.dark);
const textColor = computed(() => (isDark.value ? "#ffffff" : "#000000"));
const buttonColor = computed(() => (isDark.value ? "white" : "black"));

// Group toasts by position
const toastActiveAreas = computed(() => {
  const areas: Record<string, Toast[]> = {};
  toastStore.toasts.forEach((toast) => {
    const position = toast.position || "bottom-right";
    if (!areas[position]) {
      areas[position] = [];
    }
    areas[position].push(toast);
  });
  return areas;
});

// Styles for each toast area (v-slide-y-transition)
const getAreaStyles = (area: string) => {
  const styles: Record<string, string> = {
    position: "fixed",
    zIndex: "9999",
    minWidth: "220px",
    maxWidth: "400px",
  };

  switch (area) {
    case "top-left":
      styles.top = "0";
      styles.left = "0";
      break;
    case "top-right":
      styles.top = "0";
      styles.right = "0";
      break;
    case "top-center":
      styles.top = "0";
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
      break;
    case "bottom-left":
      styles.bottom = "0";
      styles.left = "0";
      break;
    case "bottom-center":
      styles.bottom = "0";
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
      break;
    case "bottom-right":
    default:
      styles.bottom = "0";
      styles.right = "0";
      break;
  }

  return styles;
};

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
      return null;
  }
};

// Handle action button click
const handleAction = (toast: Toast) => {
  if (toast.dismissible) {
    toastStore.dismiss(toast.id);
  }
};
</script>

<style scoped>
/* Same styles as provided */
.toast-item {
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, opacity 0.3s ease, scale 0.2s ease;
  background-color: var(--background-color);
}

.toast-item:hover {
  transform: translateY(-2px);
  scale: 1.02;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.toast-message {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.toast-title {
  font-size: 1rem;
  font-weight: 500;
  color: v-bind(textColor);
}

.toast-description {
  font-size: 0.875rem;
  opacity: 0.85;
  color: v-bind(textColor);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 1;
}

.action-btn,
.cancel-btn {
  text-transform: none;
  font-weight: 500;
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

.action-btn:hover,
.cancel-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.invert {
  filter: invert(1);
}

/* Toast Type Colors */
.success {
  --background-color: v-bind(isDark ? "#388e3c": "#66bb6a");
}

.error {
  --background-color: v-bind(isDark ? "#d32f2f": "#ef5350");
}

.warning {
  --background-color: v-bind(isDark ? "#f57c00": "#ffa726");
}

.info {
  --background-color: v-bind(isDark ? "#1976d2": "#42a5f5");
}

.loading {
  --background-color: v-bind(isDark ? "#616161": "#9e9e9e");
}

.default {
  --background-color: v-bind(isDark ? "#212121": "#616161");
}
</style>
