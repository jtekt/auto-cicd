import { defineStore } from "pinia";
import type { Session } from "@/types/session";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    session: null as Session | null,
  }),

  actions: {
    loadSession() {
      const raw = localStorage.getItem("session");
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw);
        this.session = parsed;
        return parsed;
      } catch {
        localStorage.removeItem("session");
        return null;
      }
    },

    setSession(session: Session | null) {
      this.session = session;
      if (session) {
        localStorage.setItem("session", JSON.stringify(session));
      } else {
        localStorage.removeItem("session");
      }
    },

    updateTokens(
      access_token: string,
      refresh_token: string,
      expires_in: number
    ) {
      if (!this.session) return;

      this.session.auth_token.access_token = access_token;
      this.session.auth_token.refresh_token = refresh_token;
      this.session.auth_token.expires_at =
        Math.floor(Date.now() / 1000) + expires_in;

      this.setSession(this.session);
    },

    logout() {
      this.session = null;
      localStorage.removeItem("session");
    },
  },
});
