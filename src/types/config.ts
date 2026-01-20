import type { ConfigSchema, FrameworkConfigSchema, TemplateSourceSchema } from "@/schemas/config";
import type z from "zod";

export type TemplateSource = z.infer<typeof TemplateSourceSchema>;
export type FrameworkConfigType = z.infer<typeof FrameworkConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>