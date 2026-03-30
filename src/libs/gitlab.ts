import axios, { AxiosError } from "axios";
import type { ProjectNode } from "@/types/project";
import { envKey, type ConfigFileInfo } from "@/config/frameworks-config";
import type { Env } from "@/types/env";
import { UserSchema } from "@/schemas/user";
import type { Session } from "@/types/session";
import type { Token } from "@/types/token";
import { TokenSchema } from "@/schemas/token";
import { getProjectCacheKey } from "@/utils/cache";

export type CommitAction = "create" | "update" | "delete" | "move" | "chmod";
export interface CommitActionObject {
  action: CommitAction;
  file_path: string;
  content: string;
  encoding: "base64";
}

const GITLAB = import.meta.env.VITE_APP_GITLAB_URL;
const CLIENT_ID = import.meta.env.VITE_APP_GITLAB_OAUTH_ID;
const REDIRECT = window.location.origin + "/auth";
const CODE_VERIFIER = import.meta.env.VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR;

export const createGitlabAuthUrl = () => {
  const url = new URL(GITLAB + "/oauth/authorize");
  url.searchParams.append("client_id", CLIENT_ID);
  url.searchParams.append("redirect_uri", REDIRECT);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", "openid profile email api");
  url.searchParams.append("code_challenge", CODE_VERIFIER);
  url.searchParams.append("code_challenge_method", "plain");

  return url.toString();
};

export const exchangeCodeForTokens = async (
  code: string
): Promise<Token | null> => {
  try {
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT);
    params.append("code_verifier", CODE_VERIFIER);

    const res = await axios.post(GITLAB + "/oauth/token", params);
    return TokenSchema.parse(res.data);
  } catch (err) {
    console.error("exchangeCodeForTokens error:", err);
    return null;
  }
};

export const refreshAccessToken = async (
  session: Session
): Promise<Token | null> => {
  try {
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", session.auth_token.refresh_token);
    params.append("redirect_uri", REDIRECT);
    params.append("code_verifier", CODE_VERIFIER);

    const res = await axios.post(GITLAB + "/oauth/token", params);
    return TokenSchema.parse(res.data);
  } catch (err) {
    console.error("refreshAccessToken error:", err);
    return null;
  }
};

export const getGitlabProfile = async (token: string) => {
  try {
    const res = await axios.get(GITLAB + "/oauth/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return UserSchema.parse(res.data);
  } catch (err) {
    console.error("getGitlabProfile error:", err);
    return null;
  }
};

export type GitLabFile = {
  fileName: string;
  content: string | null; // Optional: only for detection files with checks
};

// Global cache for all gitlab files
const gitlabFileCache = new Map<
  string, // cache key
  Promise<GitLabFile> // we store promises to dedupe in-flight requests
>();

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
  try {
    const results: GitLabFile[] = [];

    for (const item of paths) {
      const key = getProjectCacheKey(item);

      // If already cached (or in-flight), reuse promise
      let promise = gitlabFileCache.get(key);

      if (!promise) {
        const { fullPath, repository } = item.project;
        const ref = repository.rootRef;

        const fetchPromise = (async () => {
          const content = await graphqlFetchFile(
            fullPath,
            ref,
            item.file,
            access_token
          );

          return {
            fileName: item.file,
            content,
          } satisfies GitLabFile;
        })();

        gitlabFileCache.set(key, fetchPromise);
        promise = fetchPromise;
      }

      results.push(await promise);
    }

    // Sort by file name for deterministic output
    results.sort((a, b) => a.fileName.localeCompare(b.fileName));

    return { success: true, data: results };
  } catch (err) {
    console.error("Error in getGitLabFiles:", err);
    return { success: false, error: (err as Error).message };
  }
};

export const invalidateGitLabFiles = (keys: string[]) => {
  keys.forEach((k) => gitlabFileCache.delete(k));
}

export async function graphqlFetchFile(
  project: string,
  ref: string,
  path: string,
  token: string
): Promise<string | null> {
  const query = `
    query {
      project(fullPath: "${project}") {
        repository {
          blobs(ref: "${ref}", paths: ["${path}"]) {
            edges {
              node {
                rawBlob
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(
    `${import.meta.env.VITE_APP_GITLAB_URL}/api/graphql`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    }
  );

  const json = await res.json();
  const edges = json?.data?.project?.repository?.blobs?.edges;

  if (edges?.length && edges[0].node?.rawBlob) {
    return edges[0].node.rawBlob;
  }

  return null;
}

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
