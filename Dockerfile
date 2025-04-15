# Start from an appropriate base image
FROM node:23-slim as build-stage

# Set the working directory for building
WORKDIR /app

# Install dependencies
COPY package.json .npmrc ./

RUN npm install

# Copy all source code
COPY . .

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
