<template>
  <v-container>
    <v-row class="mb-2">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          :label="t('views.index.searchLabel')"
          prepend-icon="mdi-magnify"
          variant="outlined"
          @input="updateDebouncedUrlParams"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          item-title="text"
          item-value="value"
          :label="t('views.index.sortLabel')"
          prepend-icon="mdi-sort"
          variant="outlined"
          @update:model-value="updateUrlParams"
          hide-details
        >
          <template #item="{ item, props }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon :icon="item.raw.icon" />
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
      <v-col cols="12" md="4" class="text-right">
        <UsefulLinks />
        <v-btn color="primary" class="ml-4" icon @click="tutorialDialog = true">
          <v-icon icon="mdi-school" />
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" prominent>
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row
      v-else-if="!isLoading && projects.length === 0"
      class="not-found-container d-flex flex-column align-center justify-center"
    >
      <v-col cols="12" class="text-center">
        <v-icon
          icon="mdi-folder-alert-outline"
          size="64"
          color="primary"
          class="mb-4"
        />

        <p class="text-center mx-auto" max-width="400">
          {{ t("views.index.projects.noFound") }}
        </p>

        <v-btn
          v-if="!searchQuery"
          color="primary"
          class="mt-4 mx-auto d-flex align-center"
          @click="tutorialDialog = true"
        >
          <v-icon class="mr-2" icon="mdi-school" />
          {{ t("views.index.projects.startTutorial") }}
        </v-btn>

        <v-btn
          v-if="!searchQuery && supportContact"
          :href="supportContact"
          color="secondary"
          class="mt-2 mx-auto"
          density="default"
          slim
          target="_blank"
        >
          <v-icon class="mr-2" icon="mdi-information" />
          {{ t("views.index.projects.moreInformation") }}
        </v-btn>
      </v-col>
    </v-row>

    <template v-else>
      <v-row class="mb-2">
        <v-col
          v-for="project in projects"
          :key="project.id"
          cols="12"
          sm="6"
          lg="3"
          xl="3"
          class="pa-2"
        >
          <v-card class="project-card pa-2 h-100" elevation="4" rounded="lg">
            <v-card-item>
              <v-btn
                variant="text"
                class="h-auto pa-0 w-100 d-flex justify-start"
                :href="project.webUrl"
                target="_blank"
              >
                <v-avatar
                  :color="!project.avatarUrl ? 'primary' : undefined"
                  size="48"
                  class="mr-2"
                >
                  <v-img
                    v-if="project.avatarUrl"
                    :src="project.avatarUrl"
                    :alt="project.name"
                  >
                    <template #error>
                      {{ project.name.charAt(0).toUpperCase() }}
                    </template>
                  </v-img>
                  <span v-else>{{ project.name.charAt(0).toUpperCase() }}</span>
                </v-avatar>
                <div>
                  <v-card-title style="text-transform: capitalize">
                    {{ project.name }}
                  </v-card-title>
                  <v-card-subtitle v-if="project.namespace">
                    {{
                      project.namespace.fullPath.split("/").slice(1).join("/")
                    }}
                  </v-card-subtitle>
                </div>
              </v-btn>
            </v-card-item>

            <v-card-text>
              <p class="text-body-2 text-medium-emphasis">
                {{
                  project.description || t("views.index.projects.noDescription")
                }}
              </p>
            </v-card-text>

            <v-card-actions>
              <DeployBtn :project="project" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- The last element that will trigger the fetch -->
      <div ref="loadMoreTrigger" class="load-more-trigger" />

      <!-- Loading indicator -->
      <v-row v-if="isLoading">
        <v-col cols="12" class="text-center">
          <AppLoader />
        </v-col>
      </v-row>
    </template>
  </v-container>

  <TutorialDialog v-model="tutorialDialog" />
  <DeployHandler />
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import { ref, computed, onMounted, watch } from "vue";
import AppLoader from "@/components/AppLoader.vue";
import DeployBtn from "@/components/deploy/DeployButton.vue";
import { useLocale } from "vuetify";
import { type ProjectNode, type ProjectsResponse } from "@/types/project";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "@/stores/toast";
import DeployHandler from "@/components/deploy/DeployHandler.vue";
import UsefulLinks from "@/components/UsefulLinks.vue";
import TutorialDialog from "@/components/TutorialDialog.vue";

const supportContact = import.meta.env.VITE_APP_MORE_INFORMATION;

const { t } = useLocale();

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const toast = useToast();

const isLoading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref(
  typeof route.query.search === "string" ? route.query.search : ""
);
const tutorialDialog = ref(false);

enum SortOptions {
  ACTIVITY_DESC = "ACTIVITY_DESC",
  SIMILARITY = "SIMILARITY",
  PATH_DESC = "PATH_DESC",
  PATH_ASC = "PATH_ASC",
}

const sortBy = ref(
  typeof route.query.sort === "string" && route.query.sort in SortOptions
    ? route.query.sort
    : SortOptions.ACTIVITY_DESC
);

const lastCursor = ref<string | null>(null);
const hasNextPage = ref<boolean | null>(null);
const loadMoreTrigger = ref<HTMLElement | null>(null);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasNextPage.value && !isLoading.value) {
        fetchProjects(); // Trigger the fetch when the trigger element is visible
      }
    });
  },
  { threshold: 1.0 } // 100% of the element must be visible
);

onMounted(() => {
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value); // Start observing the trigger element
  }
});

const sortOptions = computed(() => [
  {
    text: t("views.index.projects.sort.nameAscText"),
    value: SortOptions.PATH_ASC,
    icon: "mdi-sort-alphabetical-ascending",
  },
  {
    text: t("views.index.projects.sort.nameDscText"),
    value: SortOptions.PATH_DESC,
    icon: "mdi-sort-alphabetical-descending",
  },
  {
    text: t("views.index.projects.sort.editedAscText"),
    value: SortOptions.ACTIVITY_DESC,
    icon: "mdi-sort-clock-descending",
  },
]);

const projects = ref<(ProjectNode & { mightBeUpdated?: boolean })[]>([]);

const fetchProjects = async (clear?: boolean) => {
  try {
    if (!authStore.session || (hasNextPage.value === false && !clear)) return;
    isLoading.value = true;

    if (clear) {
      projects.value = [];
      lastCursor.value = null;
    }

    // Step 1: Fetch projects without file contents
    const projectsData = await fetchProjectsMetadata();
    if (!projectsData) return;

    projects.value.push(...projectsData);
  } catch (error) {
    toast.error(t("views.index.projects.errors.fetchProjects"));
    console.error("Error fetching projects:", error);
  } finally {
    isLoading.value = false;
  }
};

const fetchProjectsMetadata = async () => {
  if (!authStore.session) return null;

  const pageSize = 16;

  const query = `
  {
    group(fullPath: "${import.meta.env.VITE_APP_GITLAB_GROUP_PATH}") {
      projects(
        includeSubgroups: true,
        includeArchived: false,
        notAimedForDeletion: true,
        search: "${searchQuery.value}",
        first: ${pageSize},
        after: "${lastCursor.value || ""}",
        sort: ${searchQuery.value ? SortOptions.SIMILARITY : sortBy.value}
      ) {
        count
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        edges {
          cursor
          node {
            id
            description
            name
            webUrl
            fullPath
            languages { 
              name 
              share
            }
            namespace {
              name
              fullPath
              path
              webUrl
            }
            updatedAt
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
  }
  `;

  const res = await axios.post<ProjectsResponse>(
    `${import.meta.env.VITE_APP_GITLAB_URL}/api/graphql`,
    {
      query,
    },
    {
      headers: {
        Authorization: `Bearer ${authStore.session!.auth_token.access_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (res.data.errors || !res.data.data) {
    toast.error(
      t("views.index.projects.errors.fetchProjects") +
        ": " +
        res.data.errors?.map((e) => e.message).join(", ")
    );
    return null;
  }

  const { edges, pageInfo } = res.data.data.group.projects;
  lastCursor.value = pageInfo.endCursor;
  hasNextPage.value = pageInfo.hasNextPage;

  return edges?.map((project) => {
    // Your existing project processing logic
    const id = project.node.id.split("/").pop()!;
    const languages = project.node.languages
      .filter(
        (l) =>
          !["dockerfile", "html", "css", "scss"].includes(l.name.toLowerCase())
      )
      .map((l) => ({ name: l.name.toLowerCase(), share: l.share }))
      .sort((a, b) => b.share - a.share);

    const projectPath = project.node.fullPath.split("/").pop()!;
    const projectName = projectPath
      .replace(/_/g, "-")
      .replace(/\./g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");

    return {
      ...project.node,
      id,
      projectName,
      languages,
      deploymentFiles: [],
    } satisfies ProjectNode;
  });
};

const updateUrlParams = () => {
  const newQuery: { [key: string]: string } = {};

  if (searchQuery.value) {
    newQuery.search = searchQuery.value;
  }
  if (sortBy.value) {
    newQuery.sort = sortBy.value;
  }

  router.push({
    query: newQuery,
  });
};

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

const debounce = (func: (...args: unknown[]) => unknown, delay: number) => {
  return (...args: unknown[]) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func(...args), delay);
  };
};

// Debounced updateUrlParams
const updateDebouncedUrlParams = debounce(() => {
  const newQuery: { [key: string]: string } = {};

  if (searchQuery.value) {
    newQuery.search = searchQuery.value;
  }
  if (sortBy.value) {
    newQuery.sort = sortBy.value;
  }

  router.push({
    query: newQuery,
  });
}, 600);

watch(
  () => route.query,
  async () => {
    searchQuery.value =
      typeof route.query.search === "string" ? route.query.search : "";
    sortBy.value =
      typeof route.query.sort === "string" && route.query.sort in SortOptions
        ? route.query.sort
        : SortOptions.ACTIVITY_DESC;

    await fetchProjects(true); // Fetch the first set of projects
  },
  { immediate: true }
);
</script>

<style scoped>
.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
}

.not-found-container {
  min-height: 60vh;
  border-radius: 8px;
  margin: 40px;
  background: linear-gradient(to bottom, #f8f8f8, transparent);
}

.v-theme--dark .not-found-container {
  background: linear-gradient(to bottom, #1d1d1d, transparent);
}
</style>
