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
import { loadConfig } from "./config";

// Load app config
await loadConfig()

const app = createApp(App);

registerPlugins(app);

const pinia = createPinia();

app.use(pinia);
app.mount("#app");

