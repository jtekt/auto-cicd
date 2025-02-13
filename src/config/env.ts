import { z } from "zod";

const {
  VITE_APP_OIDC_AUTHORITY,
  VITE_APP_OIDC_CLIENT_ID,
  VITE_APP_GITLAB_OAUTH_ID,
  VITE_APP_BACKEND_URL,
  VITE_APP_GITLAB_URL
} = import.meta.env;

const envSchema = z.object({
  OIDC_AUTHORITY: z.string().trim(),
  OIDC_CLIENT_ID: z.string().trim(),
  GITLAB_OAUTH_ID: z.string().trim(),
  BACKEND_URL: z
    .string()
    .trim()
    .url()
    .transform((v) => (v.endsWith("/") ? v.slice(0, -1) : v)),
    GITLAB_URL: z
    .string()
    .trim()
    .url()
    .transform((v) => (v.endsWith("/") ? v.slice(0, -1) : v)),
});

export const env = envSchema.parse({
  OIDC_AUTHORITY: VITE_APP_OIDC_AUTHORITY,
  OIDC_CLIENT_ID: VITE_APP_OIDC_CLIENT_ID,
  GITLAB_OAUTH_ID: VITE_APP_GITLAB_OAUTH_ID,
  BACKEND_URL: VITE_APP_BACKEND_URL,
  GITLAB_URL: VITE_APP_GITLAB_URL
});
