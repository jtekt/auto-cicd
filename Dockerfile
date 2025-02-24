# Start from an appropriate base image
FROM node:22-alpine as build-stage

# Set the working directory for building
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the project
RUN npm run build

# Deploy the app
FROM nginx:stable-alpine as production-stage

# Set working directory for nginx
WORKDIR /usr/share/nginx/

# Clean the default html folder and create a new one
RUN rm -rf html && mkdir html

# Copy nginx configuration and built application files
COPY ./nginx.conf /etc/nginx/
COPY --from=build /app/dist /usr/share/nginx/html

# Run the server in the foreground
CMD ["nginx", "-g", "daemon off;"]
