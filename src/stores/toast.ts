import { defineStore } from "pinia";

export type ToastType = "success" | "error" | "warn" | "loading";

export interface ToastConfig {
  id?: number | string;
  timeout?: number | null; // null = no auto close
}

export interface Toast {
  id: number | string;
  type: ToastType;
  message: string;
  timeout: number | null;
}

export const useToast = defineStore("toast", {
  state: () => ({
    toasts: [] as Toast[],
    internalCounter: 0,
  }),

  actions: {
    /** Upsert toast: if id exists → update, otherwise create */
    pushToast(type: ToastType, message: string, config: ToastConfig = {}) {
      let id = config.id ?? ++this.internalCounter;

      const timeout = config.timeout || null;

      // If toast already exists → update instead of creating new
      const existing = this.toasts.find((t) => t.id === id);
      if (existing) {
        existing.type = type;
        existing.message = message;
        existing.timeout = timeout
      } else {
        // Create new toast
        const toast: Toast = { id, type, message, timeout };
        this.toasts.push(toast);
      }

      // Auto-remove if timeout is not null
      if (timeout !== null && timeout > 0) {
        setTimeout(() => this.removeToast(id), timeout);
      }

      return id;
    },

    success(message: string, config?: ToastConfig) {
      return this.pushToast("success", message, {
        ...config,
        timeout: config?.timeout ?? 6000,
      });
    },

    error(message: string, config?: ToastConfig) {
      return this.pushToast("error", message, config);
    },

    warn(message: string, config?: ToastConfig) {
      return this.pushToast("warn", message, {
        ...config,
        timeout: config?.timeout ?? 10000,
      });
    },

    loading(message: string, config?: ToastConfig) {
      return this.pushToast("loading", message, { timeout: null, ...config });
    },

    removeToast(id: number | string) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
  },
});
