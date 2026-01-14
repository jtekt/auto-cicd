import DefaultLayout from "@/components/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/index.vue"),
        meta: { protected: true },
      },
      {
        path: "/faq",
        name: "FAQ",
        component: () => import("@/views/faq.vue"),
        meta: { protected: false },
      },
      {
        path: "/auth",
        name: "Auth",
        component: () => import("@/views/auth.vue"),
        meta: { protected: false },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const loggedIn = !!auth.session;

  // Always allow /auth during OAuth redirects
  if (to.name === "Auth") {
    return true;
  }

  if (to.meta.protected && !loggedIn) {
    return { name: "Auth" };
  }

  if (loggedIn && to.name === "Auth") {
    return { name: "Home" };
  }

  return true;
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
