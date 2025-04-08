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
});

export const env = envSchema.parse({
  GITLAB_OAUTH_ID: config.GITLAB_OAUTH_ID || import.meta.env.GITLAB_OAUTH_ID,
  GITLAB_URL: config.GITLAB_URL || import.meta.env.GITLAB_URL,
  OAUTH_REDIRECT_URI_PATH:
    config.OAUTH_REDIRECT_URI_PATH ||
    import.meta.env.GITLAB_OAUTH_REDIRECT_URI_PATH,
  OAUTH_STATE_VALIDATOR:
    config.OAUTH_STATE_VALIDATOR ||
    import.meta.env.GITLAB_OAUTH_STATE_VALIDATOR,
  DEPLOYED_NAMESPACE:
    config.DEPLOYED_NAMESPACE || import.meta.env.DEPLOYED_NAMESPACE,
});
