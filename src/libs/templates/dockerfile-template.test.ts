import { describe, it, expect } from "vitest";
import { generateDockerfile } from "./dockerfile-template";
import {
  getDefaultProjectConfig,
  type ProjectConfig,
} from "../../config/frameworks-config";

describe("generateDockerfile", () => {
  it("generates a Dockerfile for Vite with custom install and build commands", async () => {
    const config: ProjectConfig = {
      ...getDefaultProjectConfig("vite"),
      installCommand: "pnpm install",
      buildCommand: "pnpm run build",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Start from an appropriate base image\r\nFROM node:22-alpine as base\r\n\r\nWORKDIR /app\r\n\r\n# Install dependencies based on the preferred package manager\r\nCOPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./\r\nRUN pnpm install\r\n\r\n# Copy all source code\r\nCOPY . .\r\n\n# Build the project\nRUN pnpm run build\n\r\n# Deploy the app\r\nFROM nginx:stable-alpine as production-stage\r\n\r\n# Set working directory for nginx\r\nWORKDIR /usr/share/nginx/\r\n\r\n# Clean the default html folder and create a new one\r\nRUN rm -rf html && mkdir html\r\n\r\n# Copy nginx configuration and built application files\r\nCOPY ./nginx.conf /etc/nginx/\r\nCOPY --from=build-stage /app/dist /usr/share/nginx/html\r\n\r\nRUN addgroup --system --gid 1001 nodejs\r\nRUN adduser --system --uid 1001 vite\r\n\r\nUSER vite\r\n\r\n# Run the server in the foreground\r\nCMD [\"nginx\", \"-g\", \"daemon off;\"]\r\n`
    );
  });

  it("generates a Dockerfile for Nuxt with a different port and commands", async () => {
    const config: ProjectConfig = {
      ...getDefaultProjectConfig("nuxt"),
      port: 3001,
      installCommand: "yarn install --frozen-lockfile",
      buildCommand: "yarn generate",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Start from an appropriate base image\r\nFROM node:22-slim as base\r\n\r\n# Set the working directory for building\r\nWORKDIR /app\r\n\r\n# Install dependencies based on the preferred package manager\r\nCOPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./\r\nRUN yarn install --frozen-lockfile\r\n\r\n# Copy all source code\r\nCOPY . .\r\n\n# Build the project\nRUN yarn generate\n\r\nRUN addgroup --system --gid 1001 nodejs\r\nRUN adduser --system --uid 1001 nuxt\r\n\r\nUSER nuxt\r\n\r\n# Define environment variables\r\nENV NODE_ENV=production\r\nENV NITRO_PORT=3001\r\nENV HOST=0.0.0.0\r\n\r\n# Expose the port the application will run on\r\nEXPOSE 3001\r\n\r\n# Start the application\r\nCMD [\"node\", \".output/server/index.mjs\"]\r\n`
    );
  });

  it("generates a Dockerfile for Nextjs with a different port and commands", async () => {
    const config: ProjectConfig = {
      ...getDefaultProjectConfig("nextjs"),
      port: 3001,
      installCommand: "yarn install --frozen-lockfile",
      buildCommand: "yarn generate",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile\r\nFROM node:22-alpine AS base\r\n\r\n# Install dependencies only when needed\r\nFROM base AS deps\r\n# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.\r\nRUN apk add --no-cache libc6-compat\r\nWORKDIR /app\r\n\r\n# Install dependencies based on the preferred package manager\r\nCOPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./\r\nRUN yarn install --frozen-lockfile\r\n\r\n# Rebuild the source code only when needed\r\nFROM base AS builder\r\nWORKDIR /app\r\nCOPY --from=deps /app/node_modules ./node_modules\r\nCOPY . .\r\n\r\n# Next.js collects completely anonymous telemetry data about general usage.\r\n# Learn more here: https://nextjs.org/telemetry\r\n# Uncomment the following line in case you want to disable telemetry during the build.\r\nENV NEXT_TELEMETRY_DISABLED=1\r\n\n# Build the project\nRUN yarn generate\n\r\n# Production image, copy all the files and run next\r\nFROM base AS runner\r\nWORKDIR /app\r\n\r\nENV NODE_ENV=production\r\n# Uncomment the following line in case you want to disable telemetry during runtime.\r\nENV NEXT_TELEMETRY_DISABLED=1\r\n\r\nRUN addgroup --system --gid 1001 nodejs\r\nRUN adduser --system --uid 1001 nextjs\r\n\r\nCOPY --from=builder /app/public ./public\r\n\r\n# Automatically leverage output traces to reduce image size\r\n# https://nextjs.org/docs/advanced-features/output-file-tracing\r\nCOPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./\r\nCOPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static\r\n\r\nUSER nextjs\r\n\r\nEXPOSE 3001\r\n\r\nENV PORT=3001\r\n\r\n# server.js is created by next build from the standalone output\r\n# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output\r\nENV HOSTNAME=\"0.0.0.0\"\r\nCMD [\"node\", \"server.js\"]\r\n`
    );
  });

  it("generates a Dockerfile for Streamlit with custom install command", async () => {
    const config: ProjectConfig = {
      ...getDefaultProjectConfig("streamlit"),
      installCommand: "pip install -r custom_requirements.txt",
      port: 8502,
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Use a base image that has Python installed\r\nFROM python:3.9-slim\r\n\r\n# Set the working directory inside the container\r\nWORKDIR /app\r\n\r\n# Copy the requirements file to the container\r\nCOPY requirements.txt ./\r\n\r\n# Install the Python dependencies\r\nRUN pip install -r custom_requirements.txt\r\n\r\n# Copy the rest of the application code into the container\r\nCOPY . .\r\n\r\nRUN addgroup --system --gid 1001 python\r\nRUN adduser --system --uid 1001 streamlit\r\n\r\nUSER streamlit\r\n\r\n# Expose the port that Streamlit will run on\r\nEXPOSE 8502\r\n\r\n# Set the entry point for Streamlit\r\nCMD [\"streamlit\", \"run\", \"distapp.py\", \"--server.port=8502\", \"--server.headless=true\"]\r\n`
    );
  });

  it("generates a Dockerfile for Express with custom install command", async () => {
    const config: ProjectConfig = {
      ...getDefaultProjectConfig("express"),
      installCommand: "npm install",
      port: 8502,
      buildCommand: "npm run build",
    };

    const result = await generateDockerfile(config);

    expect(result).equal(
      `# Start from an appropriate base image\r\nFROM node:22-slim as base\r\n\r\n# Set the working directory for building\r\nWORKDIR /app\r\n\r\n# Install dependencies\r\nCOPY package.json ./\r\nRUN npm install\r\n\r\n# Copy all source code\r\nCOPY . .\r\n\n# Build the project\nRUN npm run build\n\r\nRUN addgroup --system --gid 1001 nodejs\r\nRUN adduser --system --uid 1001 express\r\n\r\nUSER express\r\n\r\n# Define environment variables\r\nENV NODE_ENV=production\r\nENV PORT=8502\r\n\r\n# Expose the port the application will run on\r\nEXPOSE 8502\r\n\r\n# Start the application\r\nCMD [\"node\", \"app.js\"]\r\n`
    );
  });
});
