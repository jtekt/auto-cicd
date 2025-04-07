import { z } from "zod";

export const rootDirSchema = z
  .string()
  .transform((val) => val.replace(/\/+$/, "")) // remove trailing slashes
  .refine((val) => val.length > 0, {
    message: "Root directory cannot be empty.",
  });

export const commandSchema = z
  .string()
  .trim()
  .min(1, "Command cannot be empty")
  .refine((val) => /^[\w\&-.:/\\ ]+$/.test(val), {
    message: "Command contains invalid characters",
  });

export const portSchema = z
  .union([z.string().regex(/^\d+$/, "Port must be a number"), z.number()])
  .transform((val) => Number(val))
  .refine((val) => val >= 1 && val <= 65535, {
    message: "Port must be between 1 and 65535",
  });

export const outputFileSchema = z
  .string()
  .trim()
  .min(1, "Output file name is required")
  .refine((val) => val.includes("."), {
    message:
      "Output file name must contain a period (e.g., 'main.js' or 'main.py')",
  });

export const validatedConfigSchema = z.object({
  installCommand: commandSchema,
  buildCommand: commandSchema.optional(),
  outputFile: outputFileSchema,
  port: portSchema,
  framework: z.string(), // you can refine this to match supported frameworks
});
