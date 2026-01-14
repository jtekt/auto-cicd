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

export const DEFAULT_FILES = [".gitlab-ci.yml", "kubernetes_manifest.yml"];
export const DEFAULT_PATHS = DEFAULT_FILES.map(f=>"/templates/common/" + f);

const filesToFetch = new Set<string>(DEFAULT_PATHS);

Object.entries(parsedConfig.frameworks).forEach(([key, framework]) => {
  if (!framework.files) return;
  framework.files.forEach(fileName => {
    // If you have specific folders for frameworks, add them to the fetch set
    filesToFetch.add(`/templates/${key.toLowerCase()}/${fileName}`);
  });
});

export const loadAllTemplates = async (): Promise<Record<string, string>> => {
  const files: Record<string, string> = {};
  
  const requests = Array.from(filesToFetch).map(async (fullPath) => {
    try {
      const response = await fetch(fullPath);
      // If a framework-specific override doesn't exist (404), we just skip it
      if (response.ok) {
        files[fullPath] = await response.text();
      }
    } catch (err) {
      console.error(`Network error for ${fullPath}:`, err);
    }
  });

  await Promise.all(requests);
  return files;
};

export const templates = await loadAllTemplates()

export default parsedConfig;

export type FrameworkConfigType = z.infer<typeof FrameworkConfigSchema>;
