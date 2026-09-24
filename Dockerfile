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

# Loading environment variables atg runtime
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
