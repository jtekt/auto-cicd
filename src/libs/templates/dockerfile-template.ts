import type { ProjectConfig } from "@/components/DeployHandler.vue";

export const generateDockerfile = (config: ProjectConfig): string => {
  let dockerfile = "";

  // Common setup
  if (config.id === "vite") {
    dockerfile += `# Start from an appropriate base image\n`;
    dockerfile += `FROM node:22-alpine as build-stage\n`;
    dockerfile += `\n`;
    dockerfile += `# Set the working directory for building\n`;
    dockerfile += `WORKDIR /app\n`;
    dockerfile += `\n`;
    dockerfile += `# Install dependencies\n`;
    dockerfile += `COPY package.json package-lock.json ./\n`;
    dockerfile += `RUN ${config.installCommand}\n`;
    dockerfile += `\n`;
    dockerfile += `# Copy all source code\n`;
    dockerfile += `COPY . .\n`;
    dockerfile += `\n`;
    dockerfile += `# Build the Vite project\n`;
    dockerfile += `RUN ${config.buildCommand}\n`;
    dockerfile += `\n`;
    dockerfile += `# Deploy the app using Nginx in production\n`;
    dockerfile += `FROM nginx:alpine as production-stage\n`;
    dockerfile += `\n`;
    dockerfile += `# Copy the built files from the build stage to Nginx's default directory\n`;
    dockerfile += `COPY --from=build-stage /app/${config.outputDir} /usr/share/nginx/html\n`;
    dockerfile += `\n`;
    dockerfile += `# Expose the port for Nginx\n`;
    dockerfile += `EXPOSE 80\n`;
    dockerfile += `\n`;
    dockerfile += `# Run Nginx in the foreground\n`;
    dockerfile += `CMD ["nginx", "-g", "daemon off;"]\n`;
  } else if (config.id === "fastapi") {
    dockerfile += `# Start with the Python base image for FastAPI\n`;
    dockerfile += `FROM python:3.9-slim\n`;
    dockerfile += `\n`;
    dockerfile += `# Set the working directory\n`;
    dockerfile += `WORKDIR /app\n`;
    dockerfile += `\n`;
    dockerfile += `# Install dependencies\n`;
    dockerfile += `COPY requirements.txt ./\n`;
    dockerfile += `RUN ${config.installCommand}\n`;
    dockerfile += `\n`;
    dockerfile += `# Copy the application files\n`;
    dockerfile += `COPY . .\n`;
    dockerfile += `# Expose the FastAPI server port\n`;
    dockerfile += `EXPOSE 80\n`;
    dockerfile += `\n`;
    dockerfile += `# Run FastAPI using Uvicorn\n`;
    dockerfile += `CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80", "--reload"]\n`;
  } else {
    dockerfile += `# Unknown framework\n`;
  }

  return dockerfile;
};
