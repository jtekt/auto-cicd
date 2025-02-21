import type { ProjectConfig } from "@/components/DeployHandler.vue";

export const generateKubernetesManifest = (config: ProjectConfig): string => {
  return `apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: ${config.id}
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: ${config.id}
    template:
      metadata:
        labels:
          app: ${config.id}
      spec:
        containers:
          - name: ${config.id}
            image: ${config.id}
            ports:
              - containerPort: 80
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: ${config.id}-service
  spec:
    selector:
      app: ${config.id}
    ports:
      - protocol: TCP
        port: 80
        targetPort: 80
    type: LoadBalancer
  `;
};
