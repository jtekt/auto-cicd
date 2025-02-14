import { z } from "zod";

export const SessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  userId: z.string(),
  username: z.string(),
  avatar: z.string().nullable()
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
