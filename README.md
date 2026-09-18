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
- [Two Configuration Surfaces](#two-configuration-surfaces)
- [Prerequisites](#prerequisites)
- [GitLab OAuth Setup (Auto-CICD itself)](#gitlab-oauth-setup-auto-cicd-itself)
- [Environment Variables (Auto-CICD itself)](#environment-variables-auto-cicd-itself)
- [Running the Dashboard (Local)](#running-the-dashboard-local)
- [Kubernetes and GitLab Agent Setup (for target projects)](#kubernetes-and-gitlab-agent-setup-for-target-projects)
- [Required GitLab CI/CD variables (target group or project)](#required-gitlab-cicd-variables-target-group-or-project)
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

## Two Configuration Surfaces

This project has two independent configuration surfaces. Don't conflate them:

1. **Running the Auto-CICD dashboard itself** — this repo, its own pipeline, its own Kubernetes Deployment. Configured by whoever operates this instance: the `VITE_APP_GITLAB_*` env vars, this repo's own GitLab OAuth application, and the cluster this dashboard's own container runs on.
2. **The `.gitlab-ci.yml` / `kubernetes_manifest.yml` templates the dashboard writes into other repos** (`public/templates/common/`, plus a per-framework Dockerfile) — these reference CI/CD variables that must be defined on the **target group/project being deployed through the dashboard**, not on this repo. End users never edit these templates: the file preview shown before commit (`DeployConfirmDialog.vue`) is read-only, and the framework `config.yml` only exposes build command / install command / output file / port as user-configurable — never the pipeline or manifest content itself. Only whoever operates/maintains this repo controls what's in the templates.

Everything below is grouped under whichever surface it belongs to.

---

## Prerequisites

### For running Auto-CICD itself

- A GitLab instance (GitLab.com or self-managed) with a registered OAuth application (see below)
- A Kubernetes cluster this dashboard's own container will run on, with a GitLab Agent connected
- A container registry to host the dashboard's own image (this repo's `.gitlab-ci.yml` expects an ECR/registry URL as a CI/CD variable, e.g. `AWS_ECR_URL`)
- Optional: a static/public URL to host this dashboard

### For projects deployed *through* Auto-CICD

These apply to whatever group/project the generated `.gitlab-ci.yml` template ends up running in — provision them there, independently of the dashboard's own setup:

- A Kubernetes cluster + namespace for the *deployed apps* (can be the same cluster as Auto-CICD itself, or a different one)
- A GitLab Agent for Kubernetes connected to that cluster, scoped to that namespace
- A container registry for the *deployed apps*' images:
  - GitLab Container Registry (recommended), or
  - AWS ECR (requires AWS CLI/credentials available to the runner, plus an `ecr-credentials` image-pull secret in that namespace)
- A GitLab Runner with Docker available:
  - Docker-in-Docker (DinD) or a runner with Docker installed
  - `kubectl` available on the runner for the deploy stage
- Optional: AWS SES credentials if you want the deploy-notification email step to actually send mail

---

## GitLab OAuth Setup (Auto-CICD itself)

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

- `write_repository` to push pipeline files and Dockerfile
- `api` to manage CI variables and repo content where needed
- `openid/profile/email` for user identity
- `read_api/read_user` to access project metadata

---

## Environment Variables (Auto-CICD itself)

These variables configure the dashboard app (Vite `VITE_*` envs) — they have nothing to do with the projects deployed through it. Create an `.env` (or `.env.local`) at the dashboard root:

```env
# Required
VITE_APP_GITLAB_URL=http://gitlab.example.com
VITE_APP_GITLAB_OAUTH_ID=xxxxxxxxxxxxxxxxxxxx
VITE_APP_GITLAB_GROUP_PATH=group/sub-group
```

Notes:

- Do not put confidential secrets in these `VITE_*` variables; they are embedded client-side.
- `VITE_APP_GITLAB_GROUP_PATH` is the group in GitLab where projects deployable through the dashboard live.
- In the built Docker image these are baked in at container start (`entrypoint.sh` `sed`-replaces `*_PLACEHOLDER` tokens in the static assets from the actual env vars), not read at request time.

Separately — and only relevant to the projects being *deployed*, not to running this dashboard — define CI/CD variables on the target GitLab group/project (see [Required GitLab CI/CD variables (target group or project)](#required-gitlab-cicd-variables-target-group-or-project)).

---

## Running the Dashboard (Local)

```bash
# Node 18+ recommended
npm install
cp .env.example .env   # create and edit envs as needed
npm run dev
```

---

## Kubernetes and GitLab Agent Setup (for target projects)

This is about the cluster that **deployed apps** land on — not the cluster running the Auto-CICD dashboard itself (that's set up independently, see [Prerequisites](#prerequisites)). High-level steps:

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
4. Point the target group/project's `K8S_CONTEXT` CI/CD variable (see below) at that agent, e.g.:
   ```
   <group/project-path-hosting-the-agent>/gitlab-agent-for-kubernetes:<agent-name>
   ```
   The template (`public/templates/common/.gitlab-ci.yml`) runs `kubectl config use-context ${K8S_CONTEXT}` verbatim — it does not derive the context from the namespace name, so `K8S_CONTEXT` must be set explicitly to match your agent.

---

### Required GitLab CI/CD variables (target group or project)

These are consumed by the shipped `.gitlab-ci.yml` template (`public/templates/common/.gitlab-ci.yml`) — define them on the **group or project being deployed through the dashboard**, in GitLab → Settings → CI/CD → Variables. They have no effect on the dashboard's own pipeline.

Required:

- `K8S_CONTEXT` — kubectl context selecting the target cluster/agent, e.g. `<group>/gitlab-agent-for-kubernetes:<agent-name>`
- `K8S_NAMESPACE` — namespace deployed apps are placed in
- `CONTAINER_REGISTRY_URL` — registry built images are pushed to (GitLab Container Registry URL or AWS ECR URL)

Auto-managed — do not set manually:

- `ENV` — a File-type variable holding the deployed app's runtime env vars. The dashboard creates/updates/deletes it itself via the GitLab API (`updateEnvs` in `src/libs/gitlab.ts`) whenever a user edits Environment Settings in the deploy dialog.

Optional (deploy-notification email via AWS SES — the template's deploy stage sends one on first deploy if `K8S_HOST` is also set; without these it silently skips the email):

- `AWS_SES_HOST`
- `AWS_SES_PORT`
- `AWS_SES_USERNAME`
- `AWS_SES_PASSWORD`
- `AWS_SES_FROM`
- `K8S_HOST` — static IP/hostname of the cluster, used only to compose the notification message and console output

Runner requirements:

- Docker available (DinD or host)
- `kubectl` installed on the runner for deploy stage

> **Operator note:** this doesn't have to happen by editing `public/templates/common/` and rebuilding the image. This deployment's own `kubernetes_manifest.yml` mounts a ConfigMap (`config_configmap.yml`, applied by this repo's own pipeline) over `/app/templates/common/.gitlab-ci.yml`, `/app/templates/common/kubernetes_manifest.yml` and `/app/config.yml` inside the running container — so the templates actually served in production can differ from what's checked into `public/templates/`. As of this writing that ConfigMap hardcodes `K8S_NAMESPACE`, `K8S_CONTEXT` and the ECR registry URL instead of reading them from the target group's CI/CD variables, and always attempts the SES email step (no `K8S_HOST` guard). Check `config_configmap.yml` for what's actually live before assuming the in-repo template is what runs.

---

## Supported Frameworks and Package Managers

- Frameworks: Vite, Nuxt.js, Next.js, Express, Streamlit, FastAPI, Default template
- Package managers: npm, yarn, pnpm, pip
- Languages: JavaScript/TypeScript and Python

The dashboard picks a Dockerfile template based on the detected framework; the generated file is shown read-only for review before commit (see [Two Configuration Surfaces](#two-configuration-surfaces)) — end users tune build/install command, output file and port instead of the template content itself.

---

## Security Considerations

- Never store OAuth client secrets in frontend environment variables (`VITE_*`); use public app with PKCE or a backend.
- Restrict GitLab Agent permissions to the target namespace; apply least privilege RBAC.
- Scope CI variables at the least permissive level (project > group).
- Review `.gitlab-ci.yml` for secrets exposure in logs.
- Consider Ingress + TLS for production-facing apps.

---

## License

[MIT](https://opensource.org/license/mit)
