import { z } from "zod";

const config = window.__APP_CONFIG__ || {};

const envSchema = z.object({
  GITLAB_OAUTH_ID: z.string().trim(),
  GITLAB_URL: z
    .string()
    .trim()
    .url()
    .transform((v) => (v.endsWith("/") ? v.slice(0, -1) : v)),
  OAUTH_REDIRECT_URI_PATH: z
    .string()
    .trim()
    .transform((p) => (p.startsWith("/") ? p.slice(1) : p)),
  OAUTH_STATE_VALIDATOR: z.string(),
  DEPLOYED_NAMESPACE: z.string().trim(),
  POD_VIEWER_URL: z
    .string()
    .trim()
    .url()
    .transform((v) => (v.endsWith("/") ? v.slice(0, -1) : v))
    .optional(),
});

export const env = envSchema.parse({
  GITLAB_OAUTH_ID:
    config.GITLAB_OAUTH_ID || import.meta.env.VITE_APP_GITLAB_OAUTH_ID,
  GITLAB_URL: config.GITLAB_URL || import.meta.env.VITE_APP_GITLAB_URL,
  OAUTH_REDIRECT_URI_PATH:
    config.GITLAB_OAUTH_REDIRECT_URI_PATH ||
    import.meta.env.VITE_APP_GITLAB_OAUTH_REDIRECT_URI_PATH,
  OAUTH_STATE_VALIDATOR:
    config.GITLAB_OAUTH_STATE_VALIDATOR ||
    import.meta.env.VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR,
  DEPLOYED_NAMESPACE:
    config.DEPLOYED_NAMESPACE || import.meta.env.VITE_APP_DEPLOYED_NAMESPACE,
  POD_VIEWER_URL:
    config.POD_VIEWER_URL || import.meta.env.VITE_APP_POD_VIEWER_URL,
});
