import { describe, it, expect } from "vitest";
import { generateDockerfile } from "./dockerfile-template";
import { getDefaultProjectConfig } from "../../config/frameworks-config";

describe("generateDockerfile", () => {
  it("generates a Dockerfile for Vite with custom install and build commands", async () => {
    const config = {
      ...getDefaultProjectConfig("vite"),
      installCommand: "pnpm install",
      buildCommand: "pnpm run build",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Start from an appropriate base image\r\nFROM node:22-slim as base\r\n\r\n# Set the working directory for building\r\nWORKDIR /app\r\n\r\n# Install dependencies\r\nCOPY package.json ./\r\nRUN pnpm install\r\n\r\n# Copy all source code\r\nCOPY . .\r\n\n# Build the project\nRUN pnpm run build\n\r\n# Deploy the app\r\nFROM nginx:stable-alpine as production-stage\r\n\r\n# Set working directory for nginx\r\nWORKDIR /usr/share/nginx/\r\n\r\n# Clean the default html folder and create a new one\r\nRUN rm -rf html && mkdir html\r\n\r\n# Copy nginx configuration and built application files\r\nCOPY ./nginx.conf /etc/nginx/\r\nCOPY --from=build-stage /app/dist /usr/share/nginx/html\r\n\r\n# Run the server in the foreground\r\nCMD [\"nginx\", \"-g\", \"daemon off;\"]\r\n`
    );
  });

  it("generates a Dockerfile for Nuxt with a different port and commands", async () => {
    const config = {
      ...getDefaultProjectConfig("nuxt"),
      port: 3001,
      installCommand: "yarn install --frozen-lockfile",
      buildCommand: "yarn generate",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Start from an appropriate base image\r\nFROM node:22-slim as base\r\n\r\n# Set the working directory for building\r\nWORKDIR /app\r\n\r\n# Install dependencies\r\nCOPY package.json ./\r\nRUN yarn install --frozen-lockfile\r\n\r\n# Copy all source code\r\nCOPY . .\r\n\n# Build the project\nRUN yarn generate\n\r\n# Define environment variables\r\nENV NODE_ENV=production\r\nENV NITRO_PORT=3001\r\nENV HOST=0.0.0.0\r\n\r\n# Expose the port the application will run on\r\nEXPOSE 3001\r\n\r\n# Start the application\r\nCMD [\"node\", \".output/server/index.mjs\"]\r\n`
    );
  });

  it("generates a Dockerfile for Streamlit with custom install command", async () => {
    const config = {
      ...getDefaultProjectConfig("streamlit"),
      installCommand: "pip install -r custom_requirements.txt",
      port: 8502,
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Use a base image that has Python installed\r\nFROM python:3.9-slim\r\n\r\n# Set the working directory inside the container\r\nWORKDIR /app\r\n\r\n# Copy the requirements file to the container\r\nCOPY requirements.txt .\r\n\r\n# Install the Python dependencies\r\nRUN pip install -r custom_requirements.txt\r\n\r\n# Copy the rest of the application code into the container\r\nCOPY . .\r\n\r\n# Expose the port that Streamlit will run on\r\nEXPOSE 8502\r\n\r\n# Set the entry point for Streamlit\r\nCMD [\"streamlit\", \"run\", \"app.py\", \"--server.port=8502\", \"--server.headless=true\"]\r\n`
    );
  });

  it("generates a Dockerfile for Express with custom install command", async () => {
    const config = {
      ...getDefaultProjectConfig("express"),
      installCommand: "npm install",
      port: 8502,
      buildCommand: "npm run build",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Start from an appropriate base image\r\nFROM node:22-slim as base\r\n\r\n# Set the working directory for building\r\nWORKDIR /app\r\n\r\n# Install dependencies\r\nCOPY package.json ./\r\nRUN npm install\r\n\r\n# Copy all source code\r\nCOPY . .\r\n\n# Build the project\nRUN npm run build\n\r\n# Define environment variables\r\nENV NODE_ENV=production\r\nENV PORT=8502\r\n\r\n# Expose the port the application will run on\r\nEXPOSE 8502\r\n\r\n# Start the application\r\nCMD [\"node\", \"app.js\"]\r\n`
    );
  });
});
