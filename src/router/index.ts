/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth";
import { isString } from "@vue/shared";
import axios from "axios";
import { createRouter, createWebHistory } from "vue-router";
import { z } from "zod";

const routes = [
  {
    path: "",
    name: "Home",
    component: () => import("@/views/index.vue"),
  },
  {
    path: "/auth/gitlab",
    name: "Auth",
    component: () => import("@/views/auth-gitlab.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  const isAuthenticated = authStore.isAuthenticated();

  if (isAuthenticated) {
    if (to.name === "Auth") {
      return {
        name: "Home",
      };
    }
  } else if (to.path === "/auth/gitlab") {
    // Verify if has code and state
    if (to.query.state === "auth-ci-front" && isString(to.query.code)) {
      // Call gitlab to generate the access token
      try {
        const params = new URLSearchParams();
        params.append("client_id", env.GITLAB_OAUTH_ID);
        params.append("grant_type", "authorization_code");
        params.append("code", to.query.code);
        params.append("redirect_uri", "http://localhost:3000/auth/gitlab");

        const res = await axios.post(env.GITLAB_URL + "/oauth/token", params);

        if (res.status === 200) {
          const token = res.data;

          const tokenSchema = z.object({
            access_token: z.string(),
            token_type: z.string(),
            expires_in: z.number(),
            refresh_token: z.string(),
            created_at: z.number(),
          });

          const data = tokenSchema.safeParse(token);

          if (data.success) {
            // Get username
            const res = await axios.get<{
              sub: string;
              nickname: string;
              groups: string[];
              name: string;
              picture: string | null;
              email: string;
              profile: string;
            }>(env.GITLAB_URL + "/oauth/userinfo", {
              headers: {
                Authorization: `Bearer ${data.data.access_token}`,
              },
            });

            authStore.setSession({
              accessToken: data.data.access_token,
              expiresAt: data.data.expires_in + data.data.created_at,
              refreshToken: data.data.refresh_token,
              userId: res.data.sub,
              username: res.data.name,
              avatar: res.data.picture,
            });
          }
        }
      } catch (error) {
        console.error(error);

        return;
      }

      router.push("/");
      // Save the access token in the state
    }
  }
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.("Failed to fetch dynamically imported module")) {
    if (!localStorage.getItem("vuetify:dynamic-reload")) {
      console.log("Reloading page to fix dynamic import error");
      localStorage.setItem("vuetify:dynamic-reload", "true");
      location.assign(to.fullPath);
    } else {
      console.error("Dynamic import error, reloading page did not fix it", err);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem("vuetify:dynamic-reload");
});

export default router;
