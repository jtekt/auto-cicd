# Auto CI/CD

A zero-friction way to deploy your GitLab repositories to Kubernetes. This project provides a Vue 3 + Vuetify + TypeScript frontend that:

- Authenticates users via GitLab OAuth
- Generates Dockerfiles and CI/CD pipelines
- Deploys applications to a Kubernetes cluster
- Works with GitLab Container Registry or AWS ECR

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [GitLab OAuth Setup](#gitlab-oauth-setup)
- [Environment Variables](#environment-variables)
- [Running the Dashboard (Local and Production)](#running-the-dashboard-local-and-production)
- [Kubernetes and GitLab Agent Setup](#kubernetes-and-gitlab-agent-setup)
- [Required GitLab CI/CD variables (group or project)](#required-gitlab-cicd-variables-group-or-project)
- [Supported Frameworks and Package Managers](#supported-frameworks-and-package-managers)
- [Security Considerations](#security-considerations)
- [Roadmap / Contributions](#roadmap--contributions)
- [License](#license)

---

## Features

- GitLab OAuth (PKCE) authentication
- Create Dockerfile from templates
- Auto-generate `.gitlab-ci.yml` for deployments
- Deploy to Kubernetes via GitLab Agent (no k8s expertise needed)
- Optional integrations:
  - Group Manager service (for generating subgroups without needing user have admin credentials)
  - Pod Viewer (monitoring/inspection of deployments)
- Frameworks: Vite, Nuxt.js, Next.js, Express, Streamlit, FastAPI, Default
- Package managers: npm, Yarn, pnpm, pip
- Languages: JavaScript/TypeScript, Python

---

## Architecture Overview

- Frontend SPA (Vue 3 + Vite + Vuetify)
- Auth: GitLab OAuth
- CI/CD: GitLab pipelines write Dockerfile and `.gitlab-ci.yml` to target repo
- Container Registry: GitLab Container Registry or AWS ECR
- Cluster Access: GitLab Agent for Kubernetes (namespaced)
- Deployments: Standard Deployment + Service applied via `kubectl` in pipeline

---

## Prerequisites

- A GitLab instance (GitLab.com or self-managed)
- A Kubernetes cluster with:
  - A namespace for app deployments (e.g., `auto-cicd`)
  - GitLab Agent for Kubernetes connected to your GitLab instance
- A container registry:
  - GitLab Container Registry (recommended), or
  - AWS ECR (requires AWS CLI and credentials in CI)
- A GitLab Runner with Docker available:
  - Docker-in-Docker (DinD) or a runner with Docker installed
  - `kubectl` available on the runner for deploy stage
- Optional:
  - AWS SES credentials if you want email notifications from pipelines
  - A static/public URL to host this dashboard

---

## GitLab OAuth Setup

Create a public OAuth application in your GitLab instance:

1. GitLab → User Settings → Applications → New application
2. Name: Auto CI/CD (or any)
3. Redirect URI:
   ```
   http://<APP_URL>/auth
   ```
   Replace `<APP_URL>` with your dashboard URL.
4. Scopes:
   - `api`
   - `read_api`
   - `read_user`
   - `openid`
   - `profile`
   - `email`
   - `write_repository`
5. Confidential: Off (public app with PKCE)
6. Copy the Application ID (client ID) to use in the dashboard configuration.

Why these scopes?

- `write_repository` to push pipeline files and Dockerfiles
- `api` to manage CI variables and repo content where needed
- `openid/profile/email` for user identity
- `read_api/read_user` to access project metadata

---

## Environment Variables

These variables configure the dashboard (Vite `VITE_*` envs). Create an `.env` (or `.env.local`) at the dashboard root:

```env
# Required
VITE_APP_GITLAB_URL=http://gitlab.example.com
VITE_APP_GITLAB_OAUTH_ID=xxxxxxxxxxxxxxxxxxxx
VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR=auto-cicd-state
VITE_APP_GITLAB_GROUP_PATH=group/auto-cicd

# Optional
VITE_APP_GITLAB_GROUP_MANAGER_URL=
VITE_APP_MORE_INFORMATION=https://gitlab.com/...
```

Notes:

- Do not put confidential secrets in these `VITE_*` variables; they are embedded client-side.
- `VITE_APP_GITLAB_GROUP_PATH` is the group in gitlab where projects will be deployed to.
- `VITE_APP_GITLAB_GROUP_MANAGER_URL` is a REST API endpoint to generate the current user group by using its username. By using the Bearer token from the Gitlab Auth

Additionally, at the GitLab group/project where users will deploy, define CI/CD variables (see [Required GitLab CI/CD variables](#required-gitlab-cicd-variables-group-or-project)).

---

## Running the Dashboard (Local)

```bash
# Node 18+ recommended
npm install
cp .env.example .env   # create and edit envs as needed
npm run dev
```

---

## Kubernetes and GitLab Agent Setup

You need a GitLab Agent connected to your cluster. High-level steps:

1. Create a namespace for deployments, e.g.:
   ```bash
   kubectl create namespace auto-cicd
   ```
2. Install and connect GitLab Agent for Kubernetes:
   - Follow: https://docs.gitlab.com/ee/user/clusters/agent/
   - Create an agent in GitLab (Infrastructure → Kubernetes clusters → Connect a cluster)
   - Install the agent Helm chart to your cluster
3. For least-privilege access:
   - Create an agent scoped to the target namespace
   - RBAC: grant only deploy/list/watch/patch in that namespace
4. The CI jobs will select the context:
   ```
   ${K8S_NAMESPACE}/gitlab-agent-for-kubernetes:${K8S_NAMESPACE}
   ```
   Ensure your agent name and namespace align with this convention (or update the CI template accordingly).

---

### Required GitLab CI/CD variables (group or project)

Define these in GitLab → Settings → CI/CD → Variables.

Common:

- `K8S_CONTEXT`: The name of the context to be used in k8s cluster
- `K8S_HOST`: Public IP or DNS users will access when the service is of type NodePort (e.g., your node or load balancer address).

For GitLab Container Registry:

- GitLab auto-provides `CI_REGISTRY`, `CI_REGISTRY_USER`, `CI_REGISTRY_PASSWORD`, `CI_JOB_TOKEN`. No extra setup needed.

For CONTAINER REGISTRY:

- `CONTAINER_REGISTRY_URL`: e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com`

Optional (email via AWS SES):

- `AWS_SES_HOST`
- `AWS_SES_PORT`
- `AWS_SES_USERNAME`
- `AWS_SES_PASSWORD`
- `AWS_SES_FROM`

Runner requirements:

- The runner tagged `docker`
- Docker available (DinD or host)
- `kubectl` installed on the runner for deploy stage

---

## Supported Frameworks and Package Managers

- Frameworks: Vite, Nuxt.js, Next.js, Express, Streamlit, FastAPI, Default template
- Package managers: npm, yarn, pnpm, pip
- Languages: JavaScript/TypeScript and Python

The dashboard suggests Dockerfile templates for these; users can edit as needed.

---

## Security Considerations

- Never store OAuth client secrets in frontend environment variables (`VITE_*`); use public app with PKCE or a backend.
- Restrict GitLab Agent permissions to the target namespace; apply least privilege RBAC.
- Scope CI variables at the least permissive level (project > group).
- Review `.gitlab-ci.yml` for secrets exposure in logs.
- Consider Ingress + TLS for production-facing apps.

---

## Roadmap / Contributions

Issues and PRs are welcome! Please:

- Open an issue describing the change/bug
- For new features, include rationale and docs updates
- Keep templates minimal and secure by default

---

## License

[MIT](https://opensource.org/license/mit)
