import type { TokenSchema } from "@/schemas/token";
import type z from "zod";

export type Token = z.infer<typeof TokenSchema>;
