import { env } from "@/config/env";
import OidcAuth from "@moreillon/oidc-auth";
import { z } from "zod";

export const UserSchema = z.object({
  name: z.string(),
  email: z.string(),
  givenName: z.string(),
  familyName: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;

export const GitlabTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  userId: z.string(),
  username: z.string(),
  avatar: z.string().nullable()
});

export type GitlabToken = z.infer<typeof GitlabTokenSchema>;

export const SessionSchema = z.object({
  user: UserSchema,
  authToken: AuthTokenSchema,
  gitlabTokens: z.array(GitlabTokenSchema),
});

export type Session = z.infer<typeof SessionSchema>;

const authProvider = new OidcAuth({
  authority: env.OIDC_AUTHORITY,
  client_id: env.OIDC_CLIENT_ID,
});

export const getSession = async (): Promise<Session | null> => {
  let session: Session | null = null;

  // Check if there is a valid session in local storage
  const localSession = localStorage.getItem("auth");

  if (localSession) {
    // Validate the session
    const data = SessionSchema.safeParse(JSON.parse(localSession));

    if (data.success) {
      // Validate the expire date
      session = data.data;
    }
  }

  if (!session) {
    const oidcSession = await authProvider.init();

    if (oidcSession) {
      session = {
        user: {
          name: oidcSession.user.name,
          email: oidcSession.user.email,
          givenName: oidcSession.user.given_name,
          familyName: oidcSession.user.family_name,
        },
        authToken: {
          accessToken: oidcSession.access_token,
          refreshToken: oidcSession.refresh_token,
          expiresAt: oidcSession.expires_at,
        },
        gitlabTokens: [],
      };
    }
  }

  if (!session) {
    return null;
  }

  return session;
};
