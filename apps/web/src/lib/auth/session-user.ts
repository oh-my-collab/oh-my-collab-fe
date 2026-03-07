import {
  getApiAccessCookieName,
  getApiRefreshCookieName,
} from "@/features/auth/constants";
import {
  getOptionalSessionCookies,
  getSessionCookiesOrThrow,
  readSessionCookiesFromRequest,
} from "@/features/auth/session";

export { getApiAccessCookieName, getApiRefreshCookieName, readSessionCookiesFromRequest };

export async function getSessionCookies(request?: Request) {
  return getSessionCookiesOrThrow(request);
}

export async function getOptionalSessionCookieValues(request?: Request) {
  return getOptionalSessionCookies(request);
}

export async function getSessionUserIdFrom(
  source: () => Promise<{ user: { id: string } | null }>
) {
  const { user } = await source();
  if (!user?.id) throw new Error("UNAUTHORIZED");
  return user.id;
}
