# Start from an appropriate base image
FROM node:24-alpine as base

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
RUN {{INSTALL_COMMAND}}

# Copy all source code
COPY . .

# Build the application if there is a build command
RUN {{BUILD_COMMAND}}

# Define environment variables
ENV NODE_ENV=production
ENV PORT={{PORT}}

# Start the application
CMD ["node", "{{OUTPUT_PATH}}"]
