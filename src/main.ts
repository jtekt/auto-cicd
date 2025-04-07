/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";
import { createPinia } from "pinia";

declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string>;
  }
}

const app = createApp(App);

const config = window.__APP_CONFIG__ || {};

app.provide("appConfig", config);

registerPlugins(app);

const pinia = createPinia();

app.use(pinia);
app.mount("#app");
