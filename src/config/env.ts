import { z } from "zod";

const {
  VITE_APP_OIDC_AUTHORITY,
  VITE_APP_OIDC_CLIENT_ID,
  VITE_APP_GITLAB_OAUTH_ID,
  VITE_APP_GITLAB_URL,
  VITE_APP_OAUTH_REDIRECT_URI_PATH,
  VITE_APP_OAUTH_STATE_VALIDATOR,
  VITE_APP_ALLOWED_PROJECTS_GROPUPS_IDS,
} = import.meta.env;

const envSchema = z.object({
  OIDC_AUTHORITY: z.string().trim(),
  OIDC_CLIENT_ID: z.string().trim(),
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
  ALLOWED_PROJECTS_GROPUPS_IDS: z
    .string()
    .trim()
    .transform((f) => f.split(",")),
});

export const env = envSchema.parse({
  OIDC_AUTHORITY: VITE_APP_OIDC_AUTHORITY,
  OIDC_CLIENT_ID: VITE_APP_OIDC_CLIENT_ID,
  GITLAB_OAUTH_ID: VITE_APP_GITLAB_OAUTH_ID,
  GITLAB_URL: VITE_APP_GITLAB_URL,
  OAUTH_REDIRECT_URI_PATH: VITE_APP_OAUTH_REDIRECT_URI_PATH,
  OAUTH_STATE_VALIDATOR: VITE_APP_OAUTH_STATE_VALIDATOR,
  ALLOWED_PROJECTS_GROPUPS_IDS: VITE_APP_ALLOWED_PROJECTS_GROPUPS_IDS,
});
