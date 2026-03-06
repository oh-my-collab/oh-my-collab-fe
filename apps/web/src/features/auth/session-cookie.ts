import { AUTH_SESSION_COOKIE_NAME } from "@/features/auth/constants";

const AUTH_SESSION_COOKIE_OPTIONS = "Path=/; Max-Age=2592000; SameSite=Lax";
const AUTH_SESSION_COOKIE_CLEAR_OPTIONS = "Path=/; Max-Age=0; SameSite=Lax";

export function persistAuthSessionCookie() {
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=active; ${AUTH_SESSION_COOKIE_OPTIONS}`;
}

export function clearAuthSessionCookie() {
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; ${AUTH_SESSION_COOKIE_CLEAR_OPTIONS}`;
}
