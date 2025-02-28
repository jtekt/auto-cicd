import { defineStore } from "pinia";

export const useSnackbarStore = defineStore("snackbar", {
  state: () => ({
    snackbarQueue: <{ show: boolean; text: string; color: string }[]>[],
  }),

  actions: {
    showSnackbar(
      text: string,
      color: "success" | "error" | "warning" | "info"
    ) {
      // Add new snackbar to the queue
      this.snackbarQueue = [...this.snackbarQueue, { show: true, text, color }];

      // Optional: Auto-remove after timeout to prevent memory buildup
      setTimeout(() => {
        const index = this.snackbarQueue.findIndex(
          (s) => s.text === text && s.color === color
        );
        if (index !== -1) {
          this.snackbarQueue.splice(index, 1);
        }
      }, 5300); // Slightly longer than timeout to ensure it disappears smoothly
    },
  },
});
