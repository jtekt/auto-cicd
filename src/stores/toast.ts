import { defineStore } from "pinia";
import { ref, type Ref, type VNode } from "vue";

// Define toast types
export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "default"
  | "loading";

// Define the Toast interface with new properties
export interface Toast {
  id: string; // Changed to string for consistency with the new API
  type: ToastType;
  message: string;
  description?: VNode | string;
  closeButton?: boolean;
  invert?: boolean;
  duration: number; // Replaces timeout, defaults to 4000
  position?: string; // e.g., 'bottom-right'
  dismissible?: boolean;
  icon?: VNode;
  action?: VNode | string;
  cancel?: VNode | string;
  onDismiss?: (toast: Toast) => void;
  onAutoClose?: (toast: Toast) => void;
  containerAriaLabel?: string;
  actionButtonStyle?: Record<string, any>;
  cancelButtonStyle?: Record<string, any>;
}

export const useToast = defineStore("toast", () => {
  const toasts: Ref<Toast[]> = ref([]);
  let toastCounter = 0;

  // Helper to generate unique string IDs
  const generateId = () => `toast-${toastCounter++}`;

  // Add or update a toast
  const addToast = (
    message: string = "",
    options: Partial<Toast> & { type?: ToastType } = {}
  ) => {
    const {
      id = generateId(),
      type = "default",
      description,
      closeButton = false,
      invert = false,
      duration = 5000, // Default duration is 5000ms
      position = "bottom-right",
      dismissible = true,
      icon,
      action,
      cancel,
      onDismiss,
      onAutoClose,
      containerAriaLabel = "Notifications",
      actionButtonStyle = {},
      cancelButtonStyle = {},
    } = options;

    const toast: Toast = {
      id,
      type,
      message,
      description,
      closeButton,
      invert,
      duration,
      position,
      dismissible,
      icon,
      action,
      cancel,
      onDismiss,
      onAutoClose,
      containerAriaLabel,
      actionButtonStyle,
      cancelButtonStyle,
    };

    // Check if toast with ID already exists
    const existingIndex = toasts.value.findIndex((t) => t.id === id);
    if (existingIndex !== -1) {
      // Update existing toast
      toasts.value[existingIndex] = {
        ...toasts.value[existingIndex],
        ...toast,
      };
    } else {
      // Add new toast
      toasts.value.push(toast);
    }

    // Set timeout for auto-close unless duration is Infinity or type is loading
    if (type !== "loading" && duration !== Infinity) {
      setTimeout(() => {
        removeToast(id, true);
      }, duration);
    }

    return id;
  };

  // Remove a toast
  const removeToast = (id: string, isAutoClose: boolean = false) => {
    const toastIndex = toasts.value.findIndex((toast) => toast.id === id);
    if (toastIndex !== -1) {
      const toast = toasts.value[toastIndex];
      // Trigger callbacks
      if (isAutoClose && toast.onAutoClose) {
        toast.onAutoClose(toast);
      } else if (!isAutoClose && toast.onDismiss) {
        toast.onDismiss(toast);
      }
      // Remove toast
      toasts.value.splice(toastIndex, 1);
    }
  };

  // Dismiss a specific toast or all toasts
  const dismiss = (id?: string) => {
    if (id) {
      removeToast(id);
    } else {
      // Copy toasts to iterate since removeToast modifies the array
      const currentToasts = [...toasts.value];
      currentToasts.forEach((toast) => removeToast(toast.id));
    }
  };

  // Type-specific toast methods
  const success = (
    message: string,
    options: Partial<Toast> & { id?: string } = {}
  ) => {
    return addToast(message, { ...options, type: "success" });
  };

  const error = (
    message: string,
    options: Partial<Toast> & { id?: string } = {}
  ) => {
    return addToast(message, { ...options, type: "error" });
  };

  const warning = (
    message: string,
    options: Partial<Toast> & { id?: string } = {}
  ) => {
    return addToast(message, { ...options, type: "warning" });
  };

  const info = (
    message: string,
    options: Partial<Toast> & { id?: string } = {}
  ) => {
    return addToast(message, { ...options, type: "info" });
  };

  const loading = (
    message: string,
    options: Partial<Toast> & { id?: string } = {}
  ) => {
    return addToast(message, { ...options, type: "loading", duration: 0 });
  };

  // Generic toast method
  const toast = (
    message: string,
    options: Partial<Toast> & { id?: string } = {}
  ) => {
    return addToast(message, { ...options, type: "default" });
  };

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
  };
});
