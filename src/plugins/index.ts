/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify, { i18n } from "./vuetify";
import router from "../router";
import { createToast } from "@jtekt/vue3-toaster";
import "@jtekt/vue3-toaster/style.css";

// Types
import type { App } from "vue";

export function registerPlugins(app: App) {
  app.use(vuetify).use(i18n).use(router).use(createToast);
}
