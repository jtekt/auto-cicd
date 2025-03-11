import { env } from "@/config/env";
import axios from "axios";
import type { Session } from "./auth";
import { z } from "zod";
import type { Group } from "@/types/group";

export const TokenSchema = z.object({
  access_token: z.string(),
  created_at: z.number(),
  expires_in: z.number(),
  id_token: z.string(),
  refresh_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});

type AccessTokenResponse = z.infer<typeof TokenSchema>;
export type CommitAction = "create" | "update" | "delete" | "move" | "chmod";

export const UserSchema = z.object({
  sub: z.string(),
  nickname: z.string(),
  groups: z.array(z.string()),
  name: z.string(),
  picture: z.string().nullable(),
  email: z.string(),
  profile: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const createGitlabAuthUrl = () => {
  const scopes = "api profile openid email read_api read_user write_repository";

  const url = new URL(env.GITLAB_URL + "/oauth/authorize");
  url.searchParams.append("client_id", env.GITLAB_OAUTH_ID);
  url.searchParams.append(
    "redirect_uri",
    window.location.origin + "/" + env.OAUTH_REDIRECT_URI_PATH
  );
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", scopes);
  url.searchParams.append("state", env.OAUTH_STATE_VALIDATOR);

  return url.toString();
};

export const createAccessToken = async (
  code: string
): Promise<AccessTokenResponse | null> => {
  try {
    const params = new URLSearchParams();
    params.append("client_id", env.GITLAB_OAUTH_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append(
      "redirect_uri",
      window.location.origin + "/" + env.OAUTH_REDIRECT_URI_PATH
    );

    const token = await axios.post<AccessTokenResponse>(
      env.GITLAB_URL + "/oauth/token",
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
    const url = new URL(env.GITLAB_URL + "/oauth/token");
    url.searchParams.append("client_id", env.GITLAB_OAUTH_ID);
    url.searchParams.append("refresh_token", session.auth_token.refresh_token);
    url.searchParams.append("grant_type", "refresh_token");
    url.searchParams.append(
      "redirect_uri",
      window.location.origin + "/" + env.OAUTH_REDIRECT_URI_PATH
    );
    url.searchParams.append("code_verifier", session.auth_token.code);

    const token = await axios.post<AccessTokenResponse>(url.toString());

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
    const res = await axios.get<User>(env.GITLAB_URL + "/oauth/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (res.status !== 200) return null;

    // Validate
    const user = UserSchema.parse(res.data);

    // Verify if user has auto-cicd group already
    try {
      const autoCICDGroup = await axios.get<Group[]>(
        `${env.GITLAB_URL}/api/v4/groups?search=${encodeURIComponent(
          `${env.DEPLOYED_NAMESPACE}/${user.nickname}`
        )}`
      );

      const hasGroup = !!autoCICDGroup.data.find((g) =>
        g.full_path.startsWith(`${env.DEPLOYED_NAMESPACE}/${user.nickname}`)
      );

      if (hasGroup) return { user, hasGroup };
    } catch (error) {
      console.log(error);
    }

    return { user, hasGroup: false };
  } catch (error) {
    console.error(error);
    return null;
  }
};
