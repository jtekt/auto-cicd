import z from "zod";

export const TokenSchema = z.object({
  access_token: z.string(),
  created_at: z.number(),
  expires_in: z.number(),
  id_token: z.string(),
  refresh_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});
