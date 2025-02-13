import { defineStore } from "pinia";
import {
  getSession,
  GitlabTokenSchema,
  SessionSchema,
  type GitlabToken,
  type Session,
} from "@/libs/auth";
import router from "@/router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    session: <Session | null>null,
  }),

  getters: {
    getUser: (state) => state.session?.user,
    getGitlabTokens: state => state.session?.gitlabTokens
  },

  actions: {
    async isAuthenticated(): Promise<boolean> {
      const oicdSession = await getSession();

      if (oicdSession) {
        this.session = oicdSession;

        return true;
      }

      this.session = null;
      return false;
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
    setGitlabToken(token: GitlabToken) {
      const validate = GitlabTokenSchema.safeParse(token);

      console.log(validate);
      if (!this.session || !validate.success) {
        return;
      }

      // Check if it already exists
      const usernameTokenIndex = this.session?.gitlabTokens.findIndex(
        (t) => (t.username = token.username)
      );

      if (usernameTokenIndex > -1) {
        this.session.gitlabTokens[usernameTokenIndex] = token;
      } else {
        this.session.gitlabTokens.push(token);
      }
      console.log(this.session);

      localStorage.setItem("auth", JSON.stringify(this.session));
    },
    logout() {
      this.session = null;

      localStorage.removeItem("auth");

      router.push("/auth");
    },
  },
});
