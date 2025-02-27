import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: "./vitest.setup.ts", // Points to the setup file
  },
});
