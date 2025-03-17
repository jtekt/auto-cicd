import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastType = "success" | "error" | "warning" | "info" | "default";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  timeout: number;
}

export const useToast = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);
  let toastId = 0;

  const addToast = (
    message: string,
    type: ToastType = "default",
    timeout = 3000
  ) => {
    const id = toastId++;
    toasts.value.push({ id, message, type, timeout });

    setTimeout(() => removeToast(id), timeout);
  };

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  // Shortcut functions for different toast types
  const success = (message: string, timeout = 3000) =>
    addToast(message, "success", timeout);
  const error = (message: string, timeout = 3000) =>
    addToast(message, "error", timeout);
  const warning = (message: string, timeout = 3000) =>
    addToast(message, "warning", timeout);
  const info = (message: string, timeout = 3000) =>
    addToast(message, "info", timeout);

  return { toasts, addToast, removeToast, success, error, warning, info };
});
