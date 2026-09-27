/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_GITLAB_URL: string;
  readonly VITE_APP_GITLAB_OAUTH_ID: string;
  readonly VITE_APP_GITLAB_GROUP_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __ENV__?: Record<string, string>;
}
