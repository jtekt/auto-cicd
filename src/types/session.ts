import type z from "zod";
import type { SessionSchema } from "@/schemas/session";

export type Session = z.infer<typeof SessionSchema>;
