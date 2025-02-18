# JTEKT Project Deployment Dashboard

This project provides a frontend interface built with **Vue 3**, **Vuetify**, and **TypeScript** to enable **JTEKT employees** to deploy their projects to **JTEKT's Kubernetes cluster**. It integrates with **GitLab OAuth** for authentication and utilizes **GitLab CI/CD** functionalities for automated deployments.

## Features

- **GitLab OAuth Authentication**: Users can log in securely using their GitLab credentials.
- **Dockerfile Configuration**: Users can create or edit `.Dockerfile` to define the Docker image for their project.
- **Template-Based Dockerfile Creation**: Users can choose from predefined templates to generate a `.Dockerfile`.
- **Automatic GitLab CI/CD Deployment**: The app can automatically generate a `.gitlab-ci.yml` file for CI/CD pipelines, simplifying the deployment process.
- **Deployment to Kubernetes**: Once configured, the project is deployed directly to JTEKT’s Kubernetes cluster using the created Dockerfile and CI/CD pipeline.

## How It Works

1. **Login with GitLab OAuth**: The user authenticates using their GitLab credentials.
2. **Configure Dockerfile**: The user can either create a new `.Dockerfile` from scratch in the repository as well in the dashboard or select from various templates to generate a Dockerfile for their project.
3. **Create or Update GitLab CI/CD Pipeline**: The app generates or updates a `.gitlab-ci.yml` file to automatically deploy the project to JTEKT’s Kubernetes environment.
4. **Deploy to Kubernetes**: Once the Dockerfile and CI/CD configuration are in place, users can initiate deployment. The process will push the changes to the GitLab repository, triggering the CI/CD pipeline that will deploy the project to the Kubernetes cluster.
