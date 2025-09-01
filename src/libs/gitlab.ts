import axios, { AxiosError } from "axios";
import type { Group } from "@/types/group";
import type { ProjectNode } from "@/types/project";
import { envKey } from "@/config/frameworks-config";
import type { Env } from "@/types/env";
import type { User } from "@/types/user";
import { UserSchema } from "@/schemas/user";
import type { Session } from "@/types/session";
import type { Token } from "@/types/token";
import { TokenSchema } from "@/schemas/token";

export type CommitAction = "create" | "update" | "delete" | "move" | "chmod";
export interface CommitActionObject {
  action: CommitAction;
  file_path: string;
  content: string;
  encoding: "base64";
}

export const createGitlabAuthUrl = () => {
  const scopes = "api profile openid email read_api read_user write_repository";

  const url = new URL(import.meta.env.VITE_APP_GITLAB_URL + "/oauth/authorize");
  url.searchParams.append(
    "client_id",
    import.meta.env.VITE_APP_GITLAB_OAUTH_ID
  );
  url.searchParams.append(
    "redirect_uri",
    window.location.origin +
      "/" +
      import.meta.env.VITE_APP_GITLAB_OAUTH_REDIRECT_URI_PATH
  );
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scopes);
  url.searchParams.append(
    "state",
    import.meta.env.VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR
  );

  return url.toString();
};

export const createAccessToken = async (
  code: string
): Promise<Token | null> => {
  try {
    const params = new URLSearchParams();
    params.append("client_id", import.meta.env.VITE_APP_GITLAB_OAUTH_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append(
      "redirect_uri",
      window.location.origin +
        "/" +
        import.meta.env.VITE_APP_GITLAB_OAUTH_REDIRECT_URI_PATH
    );
    const token = await axios.post<Token>(
      import.meta.env.VITE_APP_GITLAB_URL + "/oauth/token",
      params
    );

    if (token.status !== 200) return null;

    // Validate
    return TokenSchema.parse(token.data);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const refreshAccessToken = async (session: Session) => {
  try {
    const url = new URL(import.meta.env.VITE_APP_GITLAB_URL + "/oauth/token");
    url.searchParams.append(
      "client_id",
      import.meta.env.VITE_APP_GITLAB_OAUTH_ID
    );
    url.searchParams.append("refresh_token", session.auth_token.refresh_token);
    url.searchParams.append("grant_type", "refresh_token");
    url.searchParams.append(
      "redirect_uri",
      window.location.origin +
        "/" +
        import.meta.env.VITE_APP_GITLAB_OAUTH_REDIRECT_URI_PATH
    );
    url.searchParams.append("code_verifier", session.auth_token.code);

    const token = await axios.post<Token>(url.toString());

    if (token.status !== 200) return null;

    // Validate
    return TokenSchema.parse(token.data);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getGitlabProfile = async (
  access_token: string
): Promise<{ user?: User; hasGroup: boolean } | null> => {
  try {
    const res = await axios.get<User>(
      import.meta.env.VITE_APP_GITLAB_URL + "/oauth/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (res.status !== 200) return null;

    // Validate
    const user = UserSchema.parse(res.data);

    // Verify if user has auto-cicd group already
    try {
      const autoCICDGroup = await axios.get<Group[]>(
        `${
          import.meta.env.VITE_APP_GITLAB_URL
        }/api/v4/groups?search=${encodeURIComponent(
          `${import.meta.env.VITE_APP_DEPLOYED_NAMESPACE}/${user.nickname}`
        )}`
      );

      const hasGroup =
        autoCICDGroup.data.length &&
        !!autoCICDGroup.data.find(
          (g) =>
            g.full_path ===
            `${import.meta.env.VITE_APP_DEPLOYED_NAMESPACE}/${user.nickname}`
        );

      if (hasGroup) return { user, hasGroup };

      // Create the group
      const createdGroup = await axios.post(
        `${import.meta.env.VITE_APP_GITLAB_GROUP_MANAGER_URL}/api/groups`
      );

      if (createdGroup.status !== 200) {
        console.error("Error creating group", createdGroup);
        return { user, hasGroup: false };
      }

      return { user, hasGroup: true };
    } catch (error) {
      console.error(error);
    }

    return { user, hasGroup: false };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getGitLabFiles = async ({
  access_token,
  paths,
  project,
}: {
  access_token: string;
  paths: string[];
  project: ProjectNode;
}): Promise<
  | {
      success: true;
      data: { fileName: string; content: string }[];
    }
  | { success: false; error: string }
> => {
  try {
    const res = await axios.post<{
      data: {
        project: {
          repository: {
            blobs: {
              edges: Array<{
                node: { name: string; rawBlob: string; path: string };
              }>;
            };
          };
        };
        correlationId: string;
      };
    }>(
      `${import.meta.env.VITE_APP_GITLAB_URL}/api/graphql`,
      {
        query: `{
          project(fullPath: "${project.fullPath}") {
            repository {
              blobs(ref: "${
                project.repository.rootRef
              }", paths: ${JSON.stringify(paths)}) {
                edges { node { name rawBlob path } }
              }
            }
          }
        }`,
      },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    return {
      success: true,
      data: res.data.data.project.repository.blobs.edges.map((e) => ({
        fileName: e.node.path,
        content: e.node.rawBlob,
      })),
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
};

export const getEnvs = async ({
  access_token,
  project,
}: {
  access_token: string;
  project: ProjectNode;
}): Promise<
  | {
      success: true;
      data: Env[];
    }
  | { success: false; error: string }
> => {
  const apiUrl = `${import.meta.env.VITE_APP_GITLAB_URL}/api/v4/projects/${
    project.id
  }/variables/${envKey}`;
  try {
    const response = await axios.get<{
      description: string | null;
      environment_scope: string;
      hidden: boolean;
      key: string;
      masked: boolean;
      protected: boolean;
      raw: boolean;
      value: string;
      variable_type: "file" | "env_var";
    }>(apiUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let envs: Env[] = [];
    if (response.data.variable_type === "file") {
      envs = response.data.value.split("\n").map((e) => {
        const [key, value] = e.split("=");

        if (!key || !value) {
          throw new Error("Invalid environment variable format");
        }

        return {
          key,
          value,
          protected: response.data.protected,
          visible: false,
        };
      });
    } else if (response.data.variable_type === "env_var") {
      envs = [
        {
          key: response.data.key,
          value: response.data.value,
          protected: response.data.protected,
          visible: false,
        },
      ];
    }
    return { success: true, data: envs };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status !== 404) {
      return {
        success: false,
        error: `Error fetching environment variables: ${error.message}`,
      };
    }
  }
  return {
    success: true,
    data: [],
  };
};

export const updateEnvs = async ({
  access_token,
  project,
  envsUpdate,
}: {
  access_token: string;
  project: ProjectNode;
  envsUpdate: Env[];
}): Promise<
  | {
      success: true;
      data: Env[];
    }
  | { success: false; error: string }
> => {
  const existingEnvs = await getEnvs({
    access_token,
    project,
  }).then((res) => {
    if (res.success) return res.data;
    return [];
  });

  const url = `${import.meta.env.VITE_APP_GITLAB_URL}/api/v4/projects/${
    project.id
  }/variables`;
  const config = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  };

  if (envsUpdate.length === 0) {
    if (existingEnvs.length === 0)
      return {
        success: true,
        data: [],
      };
    return await axios.delete(`${url}/${envKey}`, config);
  }

  const body = {
    key: envKey,
    value: envsUpdate.map((e) => `${e.key}=${e.value}`).join("\n"),
    description: "Generated in the Auto CI/CD App",
    variable_type: "file",
  };

  if (existingEnvs.length) {
    return await axios.put(`${url}/${envKey}`, body, config);
  }
  return await axios.post(url, body, config);
};

export async function removeDeploymentFiles({
  project,
  session,
}: {
  project: ProjectNode;
  session: Session;
}): Promise<{
  success: boolean;
  updatedCi?: string;
}> {
  const gitlabCiPath = ".gitlab-ci.yml";

  const K8S_NAMESPACE = import.meta.env.VITE_APP_DEPLOYED_NAMESPACE;
  const APPLICATION_NAME = project.projectName;

  // Updated CI content with cleanup stage calling your API
  const updatedCi = `# Define the pipeline stages
stages:
  - cleanup

variables:
  APPLICATION_NAME: ${APPLICATION_NAME}
  K8S_NAMESPACE: ${K8S_NAMESPACE}
  K8S_ECR_SECRET_NAME: ecr-credentials
  K8S_ENV_SECRET_NAME: ${APPLICATION_NAME}-env

cleanup-job:
  stage: cleanup
  before_script:
    - kubectl config use-context ${K8S_NAMESPACE}/gitlab-agent-for-kubernetes:${K8S_NAMESPACE}
    - kubectl config set-context --current --namespace=${K8S_NAMESPACE}
  script:
    # Delete the kubernetes deployment and service
    - envsubst < kubernetes_manifest.yml | kubectl delete --ignore-not-found=true -f -

    - echo ""
    - echo "-------------------------------------------------------------------------"
    - echo "  CLEANUP COMPLETED SUCCESSFULLY!"
    - echo "-------------------------------------------------------------------------"
    - echo ""
    - echo "  To redeploy this application, please navigate to the AUTO-CICD"
    - echo "  application and initiate a new deployment."
    - echo ""
`;

  const commitPayload = {
    branch: project.repository.rootRef,
    commit_message: "[AUTO-CICD] Update CI with cleanup stage",
    actions: [
      {
        action: "update",
        file_path: gitlabCiPath,
        content: updatedCi,
      },
    ],
  };

  try {
    const commitUrl = `${import.meta.env.VITE_APP_GITLAB_URL}/api/v4/projects/${
      project.id
    }/repository/commits`;

    await axios.post(commitUrl, commitPayload, {
      headers: {
        Authorization: `Bearer ${session.auth_token.access_token}`,
      },
    });
  } catch (error) {
    console.error("Error pushing commit:", error);
    return {
      success: false,
    };
  }
  return {
    success: true,
    updatedCi,
  };
}

export const isDeployed = (project: ProjectNode): boolean => {
  const gitLabCi = project.deploymentFiles?.find(
    (file) => file.name === ".gitlab-ci.yml"
  );

  if (!gitLabCi) return false;

  if (gitLabCi.rawTextBlob.indexOf("cleanup") !== -1) {
    return false;
  }

  return true;
};
