import { defineStore } from "pinia";
import {
  getSession,
  SessionSchema,
  type Session,
} from "@/libs/auth";
import router from "@/router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    session: <Session | null>null,
  }),

  actions: {
     isAuthenticated(): boolean {
      if(this.session) return true

      this.session = getSession()

      return !!this.session
    },
    setSession(session: Session | null) {
      this.session = session;

      // Save to local storage
      if (session) {
        // Validate sesion
        const res = SessionSchema.safeParse(session);

        if (res.success) {
          localStorage.setItem("auth", JSON.stringify(session));
        }
      } else {
        localStorage.removeItem("auth");
      }
    },
    logout() {
      this.session = null;

      localStorage.removeItem("auth");

      router.push("/auth");
    },
  },
});
