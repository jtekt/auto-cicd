import type { ProjectConfig } from "@/components/DeployHandler.vue";

export const generateGitLabCI = (config: ProjectConfig): string => {
  let gitlabCI = `stages:\n  - build\n  - deploy\n\n`;
  gitlabCI += `build:\n`;
  gitlabCI += `  stage: build\n`;
  gitlabCI += `  script:\n`;
  gitlabCI += `    - ${config.buildCommand}\n`;
  gitlabCI += `    - docker build -t ${config.id} .\n`;
  gitlabCI += `  artifacts:\n`;
  gitlabCI += `    paths:\n`;
  gitlabCI += `      - ${config.outputDir}\n\n`;

  gitlabCI += `deploy:\n`;
  gitlabCI += `  stage: deploy\n`;
  gitlabCI += `  script:\n`;
  gitlabCI += `    - docker push ${config.id}\n`;

  return gitlabCI;
};
