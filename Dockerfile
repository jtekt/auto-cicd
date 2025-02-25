# Start from an appropriate base image
FROM node:22-slim as build-stage

# Set the working directory for building
WORKDIR /app

# Install pnpm, yarn, bun, and deno
RUN npm install -g pnpm yarn bun

# Install dependencies
COPY package.json package-lock.json ./
RUN pnpm install

# Copy all source code
COPY . .

# Build the project
RUN pnpm build

# Deploy the app
FROM nginx:stable-slim as production-stage

# Set working directory for nginx
WORKDIR /usr/share/nginx/

# Clean the default html folder and create a new one
RUN rm -rf html && mkdir html

# Copy nginx configuration and built application files
COPY ./nginx.conf /etc/nginx/
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Run the server in the foreground
CMD ["nginx", "-g", "daemon off;"]
