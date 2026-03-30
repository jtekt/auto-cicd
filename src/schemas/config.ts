import z from "zod";

const UserConfigSchema = z.object({ defaultEmpty: z.boolean() });

// Files configurations schemas
const GitLabSource = z.object({
  type: z.literal("gitlab"),
  project: z.string(), // project fullPath
  ref: z.string(),
  path: z.string(),
});

const UrlSource = z.object({
  type: z.literal("url"),
  url: z.url(),
});

const LocalSource = z.string();

// Union of all template file types
export const TemplateSourceSchema = z.union([
  GitLabSource,
  UrlSource,
  LocalSource,
]);

// Main schema
export const FrameworkConfigSchema = z.object({
  name: z.string(),
  image: z.string(),
  languages: z.array(z.string()),
  userConfigurable: z
    .object({
      installCommand: UserConfigSchema.optional(),
      buildCommand: UserConfigSchema.optional(),
      outputFile: UserConfigSchema.optional(),
      port: UserConfigSchema.optional(),
    })
    .optional(),
  outputFile: z.string(),
  port: z.int().optional(),
  files: z.array(TemplateSourceSchema).optional(),
  configFiles: z
    .array(
      z.object({
        file: z.array(z.string()),
        checkFor: z.array(z.union([z.string(), z.instanceof(RegExp)])),
      }),
    )
    .optional(), // What files and variations to check and what key words to look for
  supportedManagers: z
    .array(
      z.object({
        manager: z.string(),
        requiredFiles: z.array(z.string()),
      }),
    )
    .min(1),
  defaultManager: z.string(),
  requiredFiles: z.array(z.union([z.string(), z.array(z.string())])).optional(),
  tips: z
    .array(z.object({ text: z.string(), link: z.string().optional() }))
    .optional(),
});

const PackageManagerSchema = z.object({
  name: z.string(),
  commands: z.object({
    install: z.string(),
    build: z.string().optional(),
  }),
  detectionFiles: z.array(
    z.object({
      file: z.string(),
      checkFor: z.array(z.string()).optional(),
    }),
  ),
  languages: z.array(z.string()),
});

const UsefulLinkSchema = z.object({
  name: z.string(),
  icon: z.url(),
  url: z.url(),
  description: z.record(z.string(), z.string().optional()),
});

export const ConfigSchema = z.object({
  packageManagers: z.record(z.string(), PackageManagerSchema),
  frameworks: z.record(z.string(), FrameworkConfigSchema),
  usefulLinks: z.array(UsefulLinkSchema),
  footerMessage: z.record(z.string(), z.string().optional()),
});
