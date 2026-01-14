# Start from an appropriate base image
FROM node:24-alpine as base

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

# Deploy the app
FROM nginx:alpine as production-stage

# Set working directory for nginx
WORKDIR /usr/share/nginx/

# Clean the default html folder and create a new one
RUN rm -rf html && mkdir html

# Copy nginx configuration and built application files
COPY ./nginx.conf /etc/nginx/
COPY --from=base /app/{{OUTPUT_DIRECTORY}} /usr/share/nginx/html

# Run the server in the foreground
CMD ["nginx", "-g", "daemon off;"]
