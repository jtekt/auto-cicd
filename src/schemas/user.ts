import z from "zod";

export const UserSchema = z.object({
  sub: z.string(),
  nickname: z.string().transform((val) =>
    val
      .replace(/_/g, "-") // Replace underscores with hyphens
      .replace(/\./g, "-") // Replace periods with hyphens
      .toLowerCase() // Ensure lowercase
      .replace(/[^a-z0-9-]/g, "")
  ),
  groups: z.array(z.string()),
  name: z.string(),
  picture: z.string().nullable(),
  email: z.string(),
  profile: z.string(),
});
