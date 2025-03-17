import { describe, it, expect } from "vitest";
import { generateGitLabCI } from "./gitlab-ci-template";
import { getDefaultProjectConfig } from "../deploy/config";

describe("generateGitLabCI", () => {
  it("generates a GitLab CI file with correct placeholders replaced", async () => {
    const config = { ...getDefaultProjectConfig("nuxt"), port: 8934 };
    const project = {
      namespace: {
        name: "Test Project",
        path: "test-project",
        webUrl: "http://10.115.1.14/auto-cicd/fabel",
        fullPath: "auto-cicd/fabel",
      },
      repository: {
        rootRef: "main",
      },
      fullPath: "auto-cicd/fabel/auto-cicd-frontend",
    };

    const result = await generateGitLabCI(config, project, "username");

    if (result.success) {
      expect(result.content).equal(
        '# Define the pipeline stages\r\nstages:\r\n  - build  # Stage responsible for building the Docker image\r\n  - deploy # Stage responsible for deploying the application to Kubernetes\r\n\r\n# Needed to use Docker command in CICD\r\n# Using moreillon/ci-dind:4bca50d7 as it provides a lightweight DinD (Docker-in-Docker) environment\r\n# with the necessary tools to build and push container images efficiently.\r\nimage: moreillon/ci-dind:4bca50d7\r\nservices:\r\n  - name: docker:24.0.7-dind\r\n\r\nvariables:\r\n  APPLICATION_NAME: username-auto-cicd-frontend\r\n  K8S_NAMESPACE: auto-cicd\r\n  CONTAINER_IMAGE_NAME: ${K8S_NAMESPACE}/username/username-auto-cicd-frontend\r\n  CONTAINER_IMAGE: ${AWS_ECR_URL}/${CONTAINER_IMAGE_NAME}\r\n  CONTAINER_IMAGE_TAGGED: ${CONTAINER_IMAGE}:${CI_COMMIT_SHORT_SHA}\r\n  K8S_ECR_SECRET_NAME: ecr-credentials\r\n  K8S_ENV_SECRET_NAME: username-auto-cicd-frontend-env\r\n  PORT: 8934\r\n\r\n# Build the Docker container image\r\nbuild-job:\r\n  stage: build\r\n  only: \r\n    # Branches to run the Build stage\r\n    - main\r\n  before_script:\r\n    # Create repository if needed\r\n    # The repository might already exist if the pipeline have already run\r\n    - >\r\n      aws ecr create-repository --repository-name ${CONTAINER_IMAGE_NAME}\r\n      || echo "Repository might have already existed"\r\n    # Log in to the registry (AWS credentials are stored as GitLab env variables)\r\n    - >\r\n      aws ecr get-login-password\r\n      | docker login\r\n      --username AWS\r\n      --password-stdin\r\n      ${AWS_ECR_URL}\r\n  script:\r\n    # Build the container image\r\n    - docker build -t ${CONTAINER_IMAGE_TAGGED} .\r\n    # Push container images to registry\r\n    - docker push ${CONTAINER_IMAGE_TAGGED}\r\n\r\n# Deploy to Kubernetes\r\ndeploy-job:\r\n  stage: deploy\r\n  only:\r\n    # Branches to run the Deploy stage\r\n    - main\r\n  before_script:\r\n    # Uses the correct Kubernetes context\r\n    - kubectl config use-context ${K8S_NAMESPACE}/gitlab-agent-for-kubernetes:${K8S_NAMESPACE}\r\n\r\n    # Uses the correct Kubernetes namespace\r\n    - kubectl config set-context --current --namespace=${K8S_NAMESPACE}\r\n\r\n    # Create Kubernetes secret for accessing ECR\r\n    - >\r\n      kubectl create secret docker-registry ${K8S_ECR_SECRET_NAME}\r\n      --docker-server=${AWS_ECR_URL}\r\n      --docker-username=AWS\r\n      --docker-password $(aws ecr get-login-password)\r\n      --dry-run=client -o yaml\r\n      | kubectl apply -f -\r\n  script:\r\n    # Deploy the app to Kubernetes using the Kubernetes manifest\r\n\r\n    # Create an environment secret containing necessary variables\r\n    # The ENV file is saved as a CI/CD variable in GitLab under Settings -> CI/CD -> Variables with the key `ENV` and the type set to `File`.\r\n    # This file contains key-value pairs of environment variables needed for the application.\r\n    - kubectl create secret generic $K8S_ENV_SECRET_NAME --from-env-file=$ENV --dry-run=client -o yaml | kubectl apply -f -\r\n\r\n    # Apply the Kubernetes manifest\r\n    - KUBECTL_APPLY_OUTPUT=$(envsubst < kubernetes_manifest.yml | kubectl apply -f -)\r\n\r\n    # Get the Kubernetes service details\r\n    - KUBECTL_GET_SVC=$(kubectl get svc $APPLICATION_NAME | grep $APPLICATION_NAME)\r\n\r\n    # Ensure the service exists and extract the exposed port\r\n    - |\r\n      if [[ -z "$KUBECTL_GET_SVC" ]]; then\r\n        echo "Error: Could not find service port for $APPLICATION_NAME"\r\n        exit 1\r\n      fi\r\n\r\n    - PORT=$(sed "s/.*\\([0-9]\\+\\):\\([0-9]\\+\\)\\/TCP.*/\\2/" <<< "$KUBECTL_GET_SVC")\r\n\r\n    # The IP address 172.16.98.151 is the static IP of the Kubernetes cluster\r\n    - echo "The APP is available at http://172.16.98.151:$PORT"\r\n\r\n    # Send an email notification if the deployment was newly created\r\n    - |\r\n      if [[ $KUBECTL_APPLY_OUTPUT == *"created"* ]]; then\r\n\r\n        docker run \\\r\n          -e SMTP_PORT=$AWS_SES_PORT \\\r\n          -e SMTP_HOST=$AWS_SES_HOST \\\r\n          -e SMTP_USERNAME=$AWS_SES_USERNAME \\\r\n          -e SMTP_PASSWORD=$AWS_SES_PASSWORD \\\r\n          -e SMTP_TO=$GITLAB_USER_EMAIL \\\r\n          -e SMTP_FROM=$AWS_SES_FROM \\\r\n          -e SMTP_SUBJECT="Auto CICD" \\\r\n          -e SMTP_MESSAGE="Your application $APPLICATION_NAME is being deployed to http://172.16.98.151:$PORT. Please note that it might take a few minutes for the application to start." \\\r\n          moreillon/sendemail\r\n\r\n        echo "Email was sent to: $GITLAB_USER_EMAIL"\r\n      else\r\n        echo "Please note that it might take a few minutes for the application to update."\r\n      fi\r\n'
      );
    } else {
      throw new Error(result.error);
    }
  });
});
