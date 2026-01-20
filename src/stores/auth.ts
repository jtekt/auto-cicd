import { defineStore } from "pinia";
import type { Session } from "@/types/session";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const session = ref<Session | null>(null);

  function loadSession(): Session | null {
    const raw = localStorage.getItem("session");
    if (!raw) return null;

    try {
      const parsed: Session = JSON.parse(raw);
      session.value = parsed;
      return parsed;
    } catch (err) {
      console.error(err)
      localStorage.removeItem("session");
      return null;
    }
  }

  function setSession(session: Session | null): void {
    session = session;
    if (session) {
      localStorage.setItem("session", JSON.stringify(session));
    } else {
      localStorage.removeItem("session");
    }
  }

  function updateTokens(
    access_token: string,
    refresh_token: string,
    expires_in: number
  ): void {
    if (!session.value) return;

    session.value.auth_token.access_token = access_token;
    session.value.auth_token.refresh_token = refresh_token;

    session.value.auth_token.expires_at =
      Math.floor(Date.now() / 1000) + expires_in;

    setSession(session.value);
  }

  function logout(): void {
    session.value = null;
    localStorage.removeItem("session");
  }

  return { session, loadSession, setSession, updateTokens, logout };
});
