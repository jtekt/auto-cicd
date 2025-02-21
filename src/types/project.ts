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
}

export interface MaxAccessLevel {
  humanAccess: string; // Using the AccessLevel enum here
  stringValue: AccessLevel; // Using the AccessLevel enum here
}

interface ProjectNode {
  id: string;
  description: string | null;
  name: string;
  webUrl: string;
  fullPath: string;
  languages: Language[];
  namespace: Namespace;
  lastActivityAt: string; // ISO 8601 date string
  avatarUrl: string | null;
  maxAccessLevel: MaxAccessLevel;
  repository: {
    rootRef: string;
  };
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface ProjectEdge {
  node: ProjectNode;
}

export interface ProjectsResponse {
  data: {
    projects: {
      count: number;
      pageInfo: PageInfo;
      edges: ProjectEdge[];
    };
  };
}

// Define a generic type for the project data
export type Project = ProjectNode & { deploying: boolean }; // Adding "deploying" field to each project
