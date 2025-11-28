import type { GitLabFile } from "@/libs/gitlab";

// Define the enum for access levels
export enum AccessLevel {
  NO_ACCESS = "NO_ACCESS",
  MINIMAL_ACCESS = "MINIMAL_ACCESS",
  GUEST = "GUEST",
  PLANNER = "PLANNER",
  REPORTER = "REPORTER",
  DEVELOPER = "DEVELOPER",
  MAINTAINER = "MAINTAINER",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
}

// Define the interfaces for the GraphQL response structure
interface Language {
  name: string;
  share: number;
}

interface Namespace {
  name: string;
  path: string;
  webUrl: string;
  fullPath: string;
}

export interface MaxAccessLevel {
  humanAccess: string; // Using the AccessLevel enum here
  stringValue: AccessLevel; // Using the AccessLevel enum here
}

export interface ProjectNode {
  id: string;
  description: string | null;
  name: string;
  projectName: string;
  webUrl: string;
  fullPath: string;
  languages: Language[];
  namespace: Namespace | null;
  updatedAt: string; // ISO 8601 date string
  avatarUrl: string | null;
  maxAccessLevel: MaxAccessLevel;
  repository: {
    rootRef: string;
  };
  deploymentFiles?: {
    name: string;
    rawTextBlob?: string;
  }[];
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

interface ProjectEdge {
  cursor: string;
  node: ProjectNode;
}

export interface ProjectsResponse {
  data?: {
    projects: {
      count: number;
      pageInfo: PageInfo;
      edges: ProjectEdge[] | null;
    };
  };
  errors?: { message: string }[];
}
