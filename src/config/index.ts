import z from "zod";
import configYaml from "../../config.yml";

const UserConfigSchema = z.object({ defaultEmpty: z.boolean() });

const FrameworkConfigSchema = z.object({
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
  files: z.array(z.string()).optional(),
  configFiles: z
    .array(
      z.object({ file: z.array(z.string()), checkFor: z.array(z.string()) })
    )
    .optional(), // What files and variations to check and what key words to look for
  supportedManagers: z
    .array(
      z.object({
        manager: z.string(),
        requiredFiles: z.array(z.string()),
      })
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
    })
  ),
  languages: z.array(z.string()),
});

const UsefulLinkSchema = z.object({
  name: z.string(),
  icon: z.url(),
  url: z.url(),
  description: z.object({
    en: z.string().optional(),
    ja: z.string().optional(),
  }),
});

const ConfigSchema = z.object({
  packageManagers: z.record(z.string(), PackageManagerSchema),
  frameworks: z.record(z.string(), FrameworkConfigSchema),
  usefulLinks: z.array(UsefulLinkSchema),
});

const parsedConfig = ConfigSchema.parse(configYaml);

// Validate that all template files exist
export const templates = import.meta.glob(
  ["/templates/**", "/templates/**/.*"],
  {
    query: "?raw",
    eager: true,
    import: "default",
  }
) as Record<string, string>;

// Check that all framework files exist in the templates
Object.values(parsedConfig.frameworks).forEach((framework) => {
  framework.files?.forEach((file) => {
    const expectedPath = `/templates/${framework.name.toLowerCase()}/${file}`;

    if (!templates[expectedPath]) {
      // Check if the file exists in the common folder
      const commonFile = templates[`/templates/common/${file}`];

      if (commonFile) {
        // Set the path to the common template
        templates[expectedPath] = commonFile;
        return;
      }

      throw new Error(
        `Template file "${file}" for framework "${framework.name}" is missing at path: ${expectedPath}`
      );
    }
  });
});

export default parsedConfig;

export type FrameworkConfigType = z.infer<typeof FrameworkConfigSchema>;
