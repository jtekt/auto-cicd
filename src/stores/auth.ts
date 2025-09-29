import { defineStore } from "pinia";
import router from "@/router";
import { SessionSchema } from "@/schemas/session";
import type { Session } from "@/types/session";
import CookieUtils from "@/utils/cookie";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    session: <Session | null>null,
  }),
  actions: {
    isAuthenticated(): boolean {
      if (this.session) {
        console.log("Already have session in store", this.session);
        return true;
      }
      this.session = this.getSession();
      return !!this.session;
    },

    getSession(): Session | null {
      let session: Session | null = null;
      const cookieSession = CookieUtils.get("auth");

      if (cookieSession) {
        try {
          const data = SessionSchema.safeParse(JSON.parse(cookieSession));
          if (data.success) {
            // Check if session is still valid
            const now = Math.floor(Date.now() / 1000);
            if (data.data.auth_token.expires_at > now) {
              session = data.data;
            } else {
              // Session expired, remove cookie
              console.log("Session expired, removing cookie");
              CookieUtils.remove("auth", { path: "/" });
            }
          }
        } catch (err) {
          console.error("Invalid session cookie", err);
          // Remove invalid cookie
          CookieUtils.remove("auth", { path: "/" });
        }
      }

      return session;
    },

    setSession(session: Session | null) {
      this.session = session;

      if (session) {
        const res = SessionSchema.safeParse(session);
        if (res.success) {
          // Convert Unix timestamp (seconds) to Date object
          const expirationDate = new Date(session.auth_token.expires_at * 1000);

          // Ensure expiration is in the future
          const now = new Date();
          if (expirationDate <= now) {
            console.error(
              "Session expiration is in the past, not saving cookie"
            );
            return;
          }

          const cookieExpiration = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          );

          const cookieOptions = {
            expires: cookieExpiration, // In a month
            secure: location.protocol === "https:", // Auto-detect based on protocol
            sameSite: "lax" as const,
            path: "/",
          };

          CookieUtils.set("auth", JSON.stringify(session), cookieOptions);

          console.log("Saved session to cookie", {
            session,
            expiresAt: cookieExpiration,
            expiresIn:
              Math.floor((expirationDate.getTime() - now.getTime()) / 1000) +
              " seconds",
            cookieOptions,
          });
        } else {
          console.error("Invalid session, not saving to cookie", res.error);
        }
      } else {
        console.log("Removing session cookie");
        CookieUtils.remove("auth", { path: "/" });
      }
    },

    setAuthToken(
      auth_token: Pick<
        Session["auth_token"],
        "access_token" | "expires_at" | "refresh_token"
      >
    ) {
      if (!this.session) return;

      const updatedSession = {
        ...this.session,
        auth_token: { ...this.session.auth_token, ...auth_token },
      };

      // Use setSession to handle cookie logic properly
      this.setSession(updatedSession);
      console.log("Updated auth token in session", updatedSession);
    },

    logout() {
      this.session = null;
      CookieUtils.remove("auth", { path: "/" });
      router.push("/auth");
    },

    // Helper method to check if current session is about to expire (within 2 minutes)
    isSessionExpiringSoon(): boolean {
      if (!this.session) return false;

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = this.session.auth_token.expires_at;
      const fiveMinutes = 2 * 60; // 2 minutes in seconds

      return expiresAt - now <= fiveMinutes;
    },
  },
});
