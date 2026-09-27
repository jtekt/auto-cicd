# Start from an appropriate base image
FROM node:24-alpine as build-stage

# Set the working directory for building
WORKDIR /app

# Install dependencies
COPY package.json ./

RUN npm install

# Copy all source code
COPY . .

# The git tag, passed in by CI; shown in the footer
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION

# Build the project
RUN npm run build

# Deploy the app
FROM nginx:stable as production-stage

RUN mkdir /app

# Copy nginx configuration and built application files
COPY ./nginx.conf /etc/nginx/
COPY --from=build-stage /app/dist /app

# Generates /app/env.js from VITE_* env vars before nginx starts
COPY ./40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
