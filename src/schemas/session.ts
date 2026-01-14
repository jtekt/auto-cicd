import z from "zod";
import { TokenSchema } from "./token";
import { UserSchema } from "./user";

export const SessionSchema = z.object({
  auth_token: TokenSchema.pick({
    access_token: true,
    refresh_token: true,
  }).extend({
    expires_at: z.number(),
  }),
  user: UserSchema.pick({
    sub: true,
    email: true,
    nickname: true,
    name: true,
    picture: true,
  })
});
