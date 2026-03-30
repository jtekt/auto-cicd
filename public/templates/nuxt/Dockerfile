FROM node:24-alpine AS base

# Start from an appropriate base image
FROM base AS build

# Set the working directory for building
WORKDIR /app

# Install dependencies based on the preferred package manager
# Copy package files and configs
COPY package.json \
     yarn.lock* \
     package-lock.json* \
     pnpm-lock.yaml* \
     bun.lockb* \
     .npmrc* \
     .yarnrc* \
     .yarnrc.yml* \
     bunfig.toml* \
     pnpm-workspace.yaml* \
     ./
RUN {{INSTALL_COMMAND}}

# Copy all source code
COPY . .

# Build the application if there is a build command
RUN {{BUILD_COMMAND}}

# Build Stage 2: Production Image
FROM base AS production
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output/ ./

# Change the port and host
ENV PORT {{PORT}}
ENV HOST 0.0.0.0

CMD ["node", "{{OUTPUT_PATH}}"]
