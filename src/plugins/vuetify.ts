/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Translations provided by Vuetify
import { ja, en } from "vuetify/locale";

// Translations
import jaJson from "@/messages/ja.json";
import enJson from "@/messages/en.json";

// Composables
import { createVuetify } from "vuetify";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { createI18n, useI18n } from "vue-i18n";

const messages = {
  en: {
    $vuetify: {
      ...en,
    },
    ...enJson,
  },
  ja: {
    $vuetify: {
      ...ja,
    },
    ...jaJson,
  },
};

// Get the saved language from localStorage, defaulting to 'en'
const savedLanguage = localStorage.getItem("preferred_language") || "ja";
const prefersDarkMode = window.matchMedia(
  "(prefers-color-scheme: dark)"
).matches;
const defaultTheme =
  localStorage.getItem("theme") || prefersDarkMode ? "dark" : "light";

export const i18n = createI18n({
  legacy: false, // Vuetify does not support the legacy mode of vue-i18n
  locale: savedLanguage,
  fallbackLocale: "en",
  messages,
});

// Function to change the language
export const setLanguage = (lang: "ja" | "en") => {
  i18n.global.locale.value = lang; // Change the locale in i18n

  localStorage.setItem("preferred_language", lang); // Save the preferred language in localStorage
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme,
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
});
