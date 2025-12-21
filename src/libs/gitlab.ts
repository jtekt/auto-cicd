import axios, { AxiosError } from "axios";
import { parse } from "yaml";
import type { Group } from "@/types/group";
import type { ProjectNode } from "@/types/project";
import { envKey, type ConfigFileInfo } from "@/config/frameworks-config";
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
  url.searchParams.append("redirect_uri", window.location.origin + "/auth");
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
    params.append("redirect_uri", window.location.origin + "/auth");
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
    url.searchParams.append("redirect_uri", window.location.origin + "/auth");
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
): Promise<{ user?: User; groupUrl?: string } | null> => {
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
      const userGroupPath = `${import.meta.env.VITE_APP_GITLAB_GROUP_PATH}/${
        user.nickname
      }`;
      const autoCICDGroup = await axios.get<Group[]>(
        `${
          import.meta.env.VITE_APP_GITLAB_URL
        }/api/v4/groups?search=${encodeURIComponent(userGroupPath)}`
      );

      const groupFound = autoCICDGroup.data.find(
        (g) => g.full_path === userGroupPath
      );

      if (groupFound) return { user, groupUrl: groupFound.web_url };

      // Create the group
      const url = `${
        import.meta.env.VITE_APP_GITLAB_GROUP_MANAGER_URL
      }/api/gitlab/group`;

      const createdGroup = await axios.post(url, undefined, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (createdGroup.status !== 200) {
        console.error("Error creating group", createdGroup);
        return { user };
      }

      return { user, groupUrl: createdGroup.data.group.web_url };
    } catch (error) {
      console.error(error);
    }

    return { user };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export type GitLabFile = {
  fileName: string;
  content?: string; // Optional: only for detection files with checks
};

export const getGitLabFiles = async ({
  access_token,
  paths,
}: {
  access_token: string;
  paths: (ConfigFileInfo & {
    project: { fullPath: string; repository: { rootRef: string } };
  })[];
}): Promise<
  { success: true; data: GitLabFile[] } | { success: false; error: string }
> => {
  if (!paths.length) {
    return { success: true, data: [] };
  }

  // Group paths by project fullPath
  const projectGroups = new Map<
    string,
    {
      ref: string;
      detection: ConfigFileInfo[];
      metadata: ConfigFileInfo[];
    }
  >();

  paths.forEach((p) => {
    const fullPath = p.project.fullPath;
    const rootRef = p.project.repository.rootRef;

    if (!projectGroups.has(fullPath)) {
      projectGroups.set(fullPath, {
        ref: rootRef,
        detection: [],
        metadata: [],
      });
    } else {
      const group = projectGroups.get(fullPath)!;
      if (group.ref !== rootRef) {
        console.warn(
          `Different rootRefs detected for project ${fullPath}. Using the first one: ${group.ref}`
        );
      }
    }

    if (p.alwaysFetch || p.checks) {
      projectGroups.get(fullPath)!.detection.push(p);
    } else {
      projectGroups.get(fullPath)!.metadata.push(p);
    }
  });

  // Dynamic sizes: Smaller for expensive content fetches
  const CONTENT_BATCH_SIZE = 1; // Conservative to avoid complexity >250
  const METADATA_BATCH_SIZE = 20; // Cheaper, larger OK

  const baseUrl = `${import.meta.env.VITE_APP_GITLAB_URL}/api/graphql`;

  const fetchBatch = async (
    fullPath: string,
    ref: string,
    fileInfos: ConfigFileInfo[],
    includeContent: boolean,
    batchSize: number
  ): Promise<GitLabFile[]> => {
    const filePaths = fileInfos.map((p) => p.file);
    if (!filePaths.length) return [];

    const chunks: string[][] = [];
    for (let i = 0; i < filePaths.length; i += batchSize) {
      chunks.push(filePaths.slice(i, i + batchSize));
    }

    const batchResults: GitLabFile[] = [];

    for (const chunk of chunks) {
      let success = false;
      // First, try batched
      success = await attemptQuery(
        fullPath,
        ref,
        chunk,
        includeContent,
        batchResults
      );

      if (!success && chunk.length > 1) {
        // Fallback: Fetch one-by-one on complexity error
        for (const singleFile of chunk) {
          await attemptQuery(
            fullPath,
            ref,
            [singleFile],
            includeContent,
            batchResults
          );
        }
      }
    }

    return batchResults;
  };

  const attemptQuery = async (
    fullPath: string,
    ref: string,
    chunk: string[],
    includeContent: boolean,
    results: GitLabFile[]
  ): Promise<boolean> => {
    // Returns true if succeeded
    const fields = includeContent ? `name path rawBlob` : `name path`;

    const query = `
      query {
        project(fullPath: "${fullPath}") {
          repository {
            blobs(ref: "${ref}", paths: ${JSON.stringify(chunk)}) {
              edges {
                node {
                  ${fields}
                }
              }
            }
          }
        }
      }`;

    try {
      const res = await axios.post(
        baseUrl,
        { query },
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (res.data.errors) {
        const errorMsg = res.data.errors[0]?.message || "Unknown error";
        if (errorMsg.includes("exceeds max complexity")) {
          console.error(
            `Complexity error for batch ${chunk.join(", ")}: ${errorMsg}`
          );
          return false; // Trigger fallback
        }
        console.error("GraphQL errors:", res.data.errors);
        throw new Error(errorMsg);
      }

      const edges = res.data?.data?.project?.repository?.blobs?.edges ?? [];
      for (const e of edges) {
        const node = e.node;

        results.push({
          fileName: node.path,
          ...(includeContent ? { content: node.rawBlob } : {}),
        });
      }
      return true;
    } catch (err) {
      console.error(`Error fetching chunk ${chunk.join(", ")}:`, err);
      return false; // Skip on non-complexity errors, or customize
    }
  };

  try {
    const allResults: GitLabFile[] = [];

    for (const [fullPath, group] of projectGroups) {
      const detectionResults = await fetchBatch(
        fullPath,
        group.ref,
        group.detection,
        true,
        CONTENT_BATCH_SIZE
      );

      const metadataResults = await fetchBatch(
        fullPath,
        group.ref,
        group.metadata,
        false,
        METADATA_BATCH_SIZE
      );

      allResults.push(...detectionResults, ...metadataResults);
    }

    // Sort by fileName
    allResults.sort((a, b) => a.fileName.localeCompare(b.fileName));

    return { success: true, data: allResults };
  } catch (err) {
    console.error("Overall error in getGitLabFiles:", err);
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

export const isDeployed = (project: ProjectNode): boolean => {
  const gitLabCi = project.deploymentFiles?.find(
    (file) => file.name === ".gitlab-ci.yml"
  );

  if (!gitLabCi) return false;

  if (gitLabCi.rawTextBlob?.indexOf("cleanup") !== -1) {
    return false;
  }

  return true;
};
