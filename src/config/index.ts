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

const supportContactsPlaceholder = import.meta.env.VITE_APP_SUPPORT_CONTACTS;
const supportContactsRaw: string =
  supportContactsPlaceholder !== "VITE_APP_SUPPORT_CONTACTS_PLACEHOLDER"
    ? supportContactsPlaceholder
    : "";

// Format: "Icon;Label;URL,Icon;Label;URL" or "Label;URL,Label;URL" or "URL,Label;URL"
export const supportContacts = supportContactsRaw
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean)
  .map((c) => {
    const parts = c
      .split(";")  // Changed from "|" to ";"
      .map((p) => p?.trim())
      .filter(Boolean);
    let icon: string | undefined = "";
    let label: string | undefined = "Support";
    let url: string | undefined = "#";
    if (parts.length === 3) {
      // Format: Icon;Label;URL
      [icon, label, url] = parts;
    } else if (parts.length === 2) {
      // Could be Icon;URL or Label;URL
      if (parts[0]?.startsWith("mdi-") || parts[0]?.includes("/")) {
        // Assume Icon;URL
        [icon, url] = parts;
      } else if (parts[1]?.startsWith("http") || parts[1]?.includes("@")) {
        // Assume Label;URL
        [label, url] = parts;
      } else {
        // Fallback: Label;URL
        [label, url] = parts;
      }
    } else if (parts.length === 1) {
      // Just URL
      url = parts[0];
    }
    return { label, icon, url };
  });

export default parsedConfig;

export type FrameworkConfigType = z.infer<typeof FrameworkConfigSchema>;
