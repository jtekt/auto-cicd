<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Toast Tester</h1>
        <p>Test all features of the toast system.</p>
      </v-col>
    </v-row>

    <!-- Toast Creation -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="pa-4">
          <v-card-title>Create Toast</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="toastMessage"
              label="Message"
              placeholder="Enter toast message"
              variant="outlined"
            />
            <v-select
              v-model="toastType"
              :items="toastTypes"
              label="Type"
              variant="outlined"
            />
            <v-text-field
              v-model="toastDescription"
              label="Description"
              placeholder="Optional description"
              variant="outlined"
            />
            <v-select
              v-model="toastPosition"
              :items="positions"
              label="Position"
              variant="outlined"
            />
            <v-text-field
              v-model.number="toastDuration"
              label="Duration (ms)"
              type="number"
              placeholder="4000"
              variant="outlined"
              hint="Use 'Infinity' for persistent toasts"
            />
            <v-checkbox v-model="toastCloseButton" label="Show Close Button" />
            <v-checkbox v-model="toastInvert" label="Invert Colors" />
            <v-checkbox v-model="toastDismissible" label="Dismissible" />
            <v-text-field
              v-model="toastIcon"
              label="Custom Icon"
              placeholder="e.g., mdi-star"
              variant="outlined"
              hint="Use Material Design Icons name"
            />
            <v-text-field
              v-model="toastAction"
              label="Action Text"
              placeholder="e.g., Undo"
              variant="outlined"
            />
            <v-text-field
              v-model="toastCancel"
              label="Cancel Text"
              placeholder="e.g., Cancel"
              variant="outlined"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="createToast">Create Toast</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Update Toast -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="pa-4">
          <v-card-title>Update Toast</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedToastId"
              :items="toastItems"
              label="Select Toast to Update"
              item-title="message"
              item-value="id"
              variant="outlined"
              :disabled="!toasts.length"
            />
            <v-text-field
              v-model="updateMessage"
              label="New Message"
              placeholder="Enter new message"
              variant="outlined"
            />
            <v-select
              v-model="updateType"
              :items="toastTypes"
              label="New Type"
              variant="outlined"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              :disabled="!selectedToastId"
              @click="updateToast"
            >
              Update Toast
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dismiss Toasts -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="pa-4">
          <v-card-title>Dismiss Toasts</v-card-title>
          <v-card-text>
            <v-select
              v-model="dismissToastId"
              :items="toastItems"
              label="Select Toast to Dismiss"
              item-title="message"
              item-value="id"
              variant="outlined"
              :disabled="!toasts.length"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="error"
              :disabled="!dismissToastId"
              @click="dismissToast"
            >
              Dismiss Selected
            </v-btn>
            <v-btn color="error" :disabled="!toasts.length" @click="dismissAll">
              Dismiss All
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading Toast Example -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="pa-4">
          <v-card-title>Loading Toast Example</v-card-title>
          <v-card-text>
            <p>Simulate a loading toast that updates to success or error.</p>
            <v-text-field
              v-model="loadingMessage"
              label="Loading Message"
              placeholder="e.g., Processing..."
              variant="outlined"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="simulateLoading('success')">
              Loading to Success
            </v-btn>
            <v-btn color="primary" @click="simulateLoading('error')">
              Loading to Error
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Toasts -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="pa-4">
          <v-card-title>Current Toasts</v-card-title>
          <v-card-text>
            <v-list v-if="toasts.length">
              <v-list-item v-for="toast in toasts" :key="toast.id">
                <v-list-item-title>{{ toast.message }}</v-list-item-title>
                <v-list-item-subtitle>
                  ID: {{ toast.id }} | Type: {{ toast.type }} | Position:
                  {{ toast.position || "bottom-right" }} | Duration:
                  {{
                    toast.duration === Infinity ? "Infinity" : toast.duration
                  }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <p v-else>No toasts active.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- Include Toaster Component -->
  <Toaster />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useToast, type ToastType } from "@/stores/toast";
import Toaster from "@/components/Toaster.vue"; // Adjust path as needed

const toastStore = useToast();
const { toasts } = storeToRefs(toastStore);

// Create Toast Form
const toastMessage = ref("Test Toast");
const toastType = ref<ToastType>("default");
const toastDescription = ref("");
const toastPosition = ref("bottom-right");
const toastDuration = ref<number | "Infinity">(4000);
const toastCloseButton = ref(false);
const toastInvert = ref(false);
const toastDismissible = ref(true);
const toastIcon = ref("");
const toastAction = ref("");
const toastCancel = ref("");
const toastTypes: ToastType[] = [
  "default",
  "success",
  "error",
  "warning",
  "info",
  "loading",
];
const positions = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

// Update Toast Form
const selectedToastId = ref<string | null>(null);
const updateMessage = ref("");
const updateType = ref<ToastType>("default");
const toastItems = computed(() =>
  toasts.value.map((toast) => ({
    id: toast.id,
    message: `${toast.message} (${toast.type})`,
  }))
);

// Dismiss Toast Form
const dismissToastId = ref<string | null>(null);

// Loading Toast Form
const loadingMessage = ref("Processing...");

// Create a new toast
const createToast = () => {
  const options: any = {
    description: toastDescription.value || undefined,
    position: toastPosition.value,
    duration:
      toastDuration.value === "Infinity"
        ? Infinity
        : Number(toastDuration.value),
    closeButton: toastCloseButton.value,
    invert: toastInvert.value,
    dismissible: toastDismissible.value,
    icon: toastIcon.value || undefined,
    action: toastAction.value || undefined,
    cancel: toastCancel.value || undefined,
    onDismiss: (t: any) => console.log(`Toast ${t.id} dismissed: ${t.message}`),
    onAutoClose: (t: any) =>
      console.log(`Toast ${t.id} auto-closed: ${t.message}`),
    actionButtonStyle: toastAction.value ? { color: "white" } : undefined,
    cancelButtonStyle: toastCancel.value ? { color: "white" } : undefined,
  };

  let toastId: string;
  switch (toastType.value) {
    case "success":
      toastId = toastStore.success(toastMessage.value, options);
      break;
    case "error":
      toastId = toastStore.error(toastMessage.value, options);
      break;
    case "warning":
      toastId = toastStore.warning(toastMessage.value, options);
      break;
    case "info":
      toastId = toastStore.info(toastMessage.value, options);
      break;
    case "loading":
      toastId = toastStore.loading(toastMessage.value, options);
      break;
    default:
      toastId = toastStore.toast(toastMessage.value, options);
      break;
  }

  console.log(`Created toast with ID: ${toastId}`);
};

// Update an existing toast
const updateToast = () => {
  if (!selectedToastId.value) return;

  const options: any = {
    id: selectedToastId.value,
  };

  switch (updateType.value) {
    case "success":
      toastStore.success(updateMessage.value || "Updated Toast", options);
      break;
    case "error":
      toastStore.error(updateMessage.value || "Updated Toast", options);
      break;
    case "warning":
      toastStore.warning(updateMessage.value || "Updated Toast", options);
      break;
    case "info":
      toastStore.info(updateMessage.value || "Updated Toast", options);
      break;
    case "loading":
      toastStore.loading(updateMessage.value || "Updated Toast", options);
      break;
    default:
      toastStore.toast(updateMessage.value || "Updated Toast", options);
      break;
  }

  console.log(`Updated toast with ID: ${selectedToastId.value}`);
};

// Dismiss a specific toast
const dismissToast = () => {
  if (dismissToastId.value) {
    toastStore.dismiss(dismissToastId.value);
    dismissToastId.value = null;
  }
};

// Dismiss all toasts
const dismissAll = () => {
  toastStore.dismiss();
};

// Simulate loading toast
const simulateLoading = async (result: "success" | "error") => {
  const toastId = toastStore.loading(loadingMessage.value, {
    position: toastPosition.value,
    dismissible: toastDismissible.value,
  });

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (result === "success") {
    toastStore.success("Operation completed!", {
      id: toastId,
      description: "Your task was successful.",
      closeButton: true,
      action: "View",
    });
  } else {
    toastStore.error("Operation failed!", {
      id: toastId,
      description: "Something went wrong.",
      closeButton: true,
      cancel: "Retry",
    });
  }
};
</script>

<style scoped>
.pa-4 {
  padding: 16px;
}
</style>
