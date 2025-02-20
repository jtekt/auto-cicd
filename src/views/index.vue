<template>
  <v-container>
    <v-row v-if="projects.length > 0">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          v-model="searchQuery"
          :label="t('pages.home.searchLabel')"
          prepend-icon="mdi-magnify"
          clearable
          variant="outlined"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          item-title="text"
          item-value="value"
          :label="t('pages.home.sortLabel')"
          prepend-icon="mdi-sort"
          variant="outlined"
        >
          <template v-slot:item="{ item, props }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-icon :icon="item.raw.icon"></v-icon>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>

    <v-row v-if="isLoading">
      <v-col cols="12" class="text-center">
        <AppLoader />
      </v-col>
    </v-row>

    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" prominent>
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else-if="filteredProjects.length < 1">
      <v-col cols="12">
        <v-alert variant="tonal" class="text-center">
          {{ t("pages.home.projects.noFound") }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="project in filteredProjects"
        :key="project.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="project-card" elevation="2">
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar color="primary" size="48">
                {{ project.name.charAt(0).toUpperCase() }}
              </v-avatar>
            </template>
            <v-card-title style="text-transform: capitalize">{{
              project.name
            }}</v-card-title>
            <v-card-subtitle>
              {{ project.namespace.name }}
            </v-card-subtitle>
            <template v-slot:append>
              <v-chip
                :color="getAccessLevelColor(project)"
                size="small"
                class="font-weight-bold"
              >
                {{ project.maxAccessLevel.humanAccess }}
              </v-chip>
            </template>
          </v-card-item>

          <v-card-text>
            <p class="text-body-2 text-medium-emphasis">
              {{
                project.description || t("pages.home.projects.noDescription")
              }}
            </p>
            <v-divider class="my-2"></v-divider>
            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon
                  icon="mdi-clock-outline"
                  size="small"
                  class="mr-1"
                ></v-icon>
              </v-col>
              <v-col>
                <span class="text-caption"
                  >{{ t("pages.home.projects.lastActivity") }}
                  {{ formatDate(project.lastActivityAt) }}</span
                >
              </v-col>
            </v-row>
            <!-- <v-row class="pa-4">
              <div
                v-for="(language, index) in project.languages"
                :key="index"
                :style="{ width: language.share + '%', padding: 0 }"
              >
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <div
                      v-bind="props"
                      class="language-bar"
                      :style="{
                        backgroundColor: getLanguageColor(language.name),
                        height: '20px',
                      }"
                    ></div>
                  </template>
                  <span>{{ language.name }}</span>
                </v-tooltip>
              </div>
            </v-row> -->
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="tonal"
              :href="project.webUrl"
              target="_blank"
            >
              <v-icon start icon="mdi-gitlab"></v-icon>
              GitLab
            </v-btn>
            <DeployBtn v-if="!!project" :project="project" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";
import axios, { type AxiosResponse } from "axios";
import { onMounted, ref, computed } from "vue";
import AppLoader from "@/components/AppLoader.vue";
import DeployBtn from "@/components/DeployHandler.vue";
import { useLocale } from "vuetify";
import {
  AccessLevel,
  type Project,
  type ProjectsResponse,
} from "@/types/project";

const { t } = useLocale();

const authStore = useAuthStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const sortBy = ref("last_activity_at-dsc");

const sortOptions = computed(() => [
  {
    text: t("pages.home.projects.sort.nameAscText"),
    value: "name-asc",
    icon: "mdi-sort-alphabetical-ascending",
  },
  {
    text: t("pages.home.projects.sort.nameDscText"),
    value: "name-dsc",
    icon: "mdi-sort-alphabetical-descending",
  },
  {
    text: t("pages.home.projects.sort.editedAscText"),
    value: "last_activity_at-dsc",
    icon: "mdi-sort-clock-descending",
  },
  {
    text: t("pages.home.projects.sort.editedDscText"),
    value: "last_activity_at-asc",
    icon: "mdi-sort-clock-ascending",
  },
]);

const projects = ref<Project[]>([]);

const getAccessLevelColor = (project: Project): string => {
  const accessLevel = project.maxAccessLevel.stringValue;

  switch (accessLevel) {
    case AccessLevel.OWNER:
    case AccessLevel.ADMIN:
      return "red";
    case AccessLevel.MAINTAINER:
      return "orange";
    case AccessLevel.DEVELOPER:
      return "green";
    case AccessLevel.REPORTER:
      return "blue";
    case AccessLevel.GUEST:
      return "grey";
    case AccessLevel.NO_ACCESS:
    case AccessLevel.MINIMAL_ACCESS:
    case AccessLevel.PLANNER:
      return "lightgrey"; // Handle additional access levels
    default:
      return "grey";
  }
};

const getLanguageColor = (language: string): string => {
  const languageColors: { [key: string]: string } = {
    // Frontend Frameworks
    Vue: "#42b883", // Vue.js
    React: "#61dafb", // React.js (JS)
    Angular: "#dd0031", // Angular (JS)
    Svelte: "#ff3e00", // Svelte (JS)
    Ember: "#f05e28", // Ember.js
    // JS Languages/Types
    TypeScript: "#3178c6", // TypeScript
    JavaScript: "#f7df1e", // JavaScript
    JSX: "#61dafb", // JSX
    TSX: "#3178c6", // TSX
    // Static Languages
    HTML: "#e34c26", // HTML
    Dockerfile: "#384d54", // Dockerfile
    CSS: "#563d7c", // CSS
    Python: "#306998", // Python
    Ruby: "#e53e3e", // Ruby
    Go: "#00add8", // Go
    "C++": "#00599c", // C++
    Swift: "#f05138", // Swift
    PHP: "#4F5B93", // PHP
    C: "#00599C", // C
    Java: "#f8b800", // Java
    Kotlin: "#7f52ff", // Kotlin
    R: "#276DC3", // R
    Scala: "#DC322F", // Scala
    Rust: "#dea584", // Rust
    Elixir: "#6e4a7e", // Elixir
    Lua: "#000080", // Lua
    Dart: "#00B4AB", // Dart
    ObjectiveC: "#6766fb", // Objective-C
    // More
    Markdown: "#083fa1", // Markdown files
    GraphQL: "#e10098", // GraphQL
    JSON: "#f7df1e", // JSON (JavaScript Object Notation)
    YAML: "#ffcc00", // YAML
    XML: "#0060e2", // XML
    SQL: "#f29111", // SQL
    Shell: "#89e051", // Shell Script (Bash, etc.)
  };
  return languageColors[language] || "#cccccc"; // Default to gray if no match
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
};

const filteredProjects = computed(() => {
  let result = projects.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.namespace.name.toLowerCase().includes(query)
    );
  }

  const [sortField, sortDirection] = sortBy.value.split("-");

  result.sort((a, b) => {
    let comparison = 0;
    if (sortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === "last_activity_at") {
      comparison =
        new Date(a.lastActivityAt).getTime() -
        new Date(b.lastActivityAt).getTime();
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return result;
});

onMounted(async () => {
  try {
    if (!authStore.session) {
      error.value = t("pages.home.projects.errors.noSession");
      return;
    }

    projects.value = await fetchAllProjects();
  } catch (err) {
    console.error(err);
    error.value = t("pages.home.projects.errors.fetchProjects");
  } finally {
    isLoading.value = false;
  }
});

const fetchAllProjects = async (): Promise<Project[]> => {
  if (!authStore.session) return [];

  let allProjects: Project[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;
  let res: AxiosResponse<ProjectsResponse, any> | null = null;
  // Loop until all pages are fetched
  while (hasNextPage) {
    try {
      res = await axios.post<ProjectsResponse>(
        `${env.GITLAB_URL}/api/graphql`,
        {
          query: `
        {
          projects(minAccessLevel: DEVELOPER, archived: EXCLUDE${
            endCursor ? `, after: ${endCursor}` : ""
          }) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                description
                name
                webUrl
                languages {
                  name
                  share
                }
                namespace {
                  name
                  fullPath
                  webUrl
                }
                lastActivityAt
                avatarUrl
                maxAccessLevel {
                  humanAccess
                  stringValue
                }
                repository {
                  rootRef
                }
              }
            }
          }
        }
      `,
        },
        {
          headers: {
            Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res) break;

      console.log(res.data);
      const projects = res.data.data.projects.edges;
      // Append the current page's projects to the allProjects array
      allProjects = allProjects.concat(
        projects.map((project) => ({
          ...project.node,
          deploying: false, // Add any other properties you need
        }))
      );

      // Update pagination info
      hasNextPage = res.data.data.projects.pageInfo.hasNextPage;
      endCursor = res.data.data.projects.pageInfo.endCursor;
    } catch (error) {
      console.error("Error fetching projects:", error);
      break;
    }
  }

  // Return the aggregated list of all projects
  return allProjects;
};
</script>

<style scoped>
.project-card {
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
}
</style>
