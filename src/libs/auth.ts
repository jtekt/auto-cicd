import { z } from "zod";
import { TokenSchema, UserSchema } from "./gitlab";

export const SessionSchema = z.object({
  auth_token: TokenSchema.pick({
    access_token: true,
    refresh_token: true,
  }).extend({
    expires_at: z.number(),
    code: z.string(),
  }),
  user: UserSchema.pick({
    sub: true,
    email: true,
    nickname: true,
    name: true,
    picture: true,
  }),
});

export type Session = z.infer<typeof SessionSchema>;

export const getSession = (): Session | null => {
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

  return session;
};
