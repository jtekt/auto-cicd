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
                {{ getAccessLevel(project) }}
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
                  {{ formatDate(project.last_activity_at) }}</span
                >
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="tonal"
              :href="project.web_url"
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
import axios from "axios";
import { onMounted, ref, computed } from "vue";
import AppLoader from "@/components/AppLoader.vue";
import DeployBtn from "@/components/DeployHandler.vue";
import { useLocale } from "vuetify";

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

export type Project = {
  id: number;
  description: string | null;
  name: string;
  web_url: string;
  permissions: {
    group_access: {
      access_level: number; // 0 to 50
    };
    project_access: {
      access_level: number | null;
    };
  };
  namespace: {
    name: string;
    full_path: string;
    web_url: string;
  };
  last_activity_at: string;

  default_branch: string;

  // Local value
  deploying?: boolean;
};

const projects = ref<Project[]>([]);

const min_access_level = 30; // 30 = developer

const getAccessLevel = (project: Project): string => {
  const projectAccess = project.permissions.project_access?.access_level;
  const groupAccess = project.permissions.group_access?.access_level;
  const accessLevel = Math.max(projectAccess || 0, groupAccess || 0);

  switch (accessLevel) {
    case 50:
      return "Owner";
    case 40:
      return "Maintainer";
    case 30:
      return "Developer";
    case 20:
      return "Reporter";
    case 10:
      return "Guest";
    default:
      return "No access";
  }
};

const getAccessLevelColor = (project: Project): string => {
  const accessLevel = getAccessLevel(project);
  switch (accessLevel) {
    case "Owner":
      return "red";
    case "Maintainer":
      return "orange";
    case "Developer":
      return "green";
    case "Reporter":
      return "blue";
    case "Guest":
      return "grey";
    default:
      return "grey";
  }
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
        new Date(a.last_activity_at).getTime() -
        new Date(b.last_activity_at).getTime();
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

    const res = await axios.get<Project[]>(
      `${env.GITLAB_URL}/api/v4/projects?min_access_level=${min_access_level}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.session.auth_token.access_token}`,
        },
      }
    );

    projects.value = res.data.map((project) => ({
      ...project,
      deploying: false,
    }));
  } catch (err) {
    console.error(err);
    error.value = t("pages.home.projects.errors.fetchProjects");
  } finally {
    isLoading.value = false;
  }
});
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
