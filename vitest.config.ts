import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Ensure @ points to the src folder
    },
  },
  test: {
    setupFiles: "./vitest.setup.ts", // Points to the setup file
  },
});
