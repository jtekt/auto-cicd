import type { AccessLevel } from "./access";

export type Group = {
  id: number;
  web_url: string;
  name: string;
  path: string;
  description: string;
  visibility: "public" | "private";
  share_with_group_lock: boolean;
  project_creation_level: AccessLevel;
  auto_devops_enabled: null;
  subgroup_creation_level: AccessLevel;
  emails_disabled: boolean;
  emails_enabled: boolean;
  mentions_disabled: null;
  default_branch: string | null;
  default_branch_protection: number;
  avatar_url: string | null;
  request_access_enabled: boolean;
  full_name: string;
  full_path: string;
  created_at: string;
  parent_id: number;
  organization_id: number;
};
