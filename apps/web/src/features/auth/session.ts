import { cookies } from "next/headers";

import { getApiAccessCookieName, getApiRefreshCookieName } from "@/features/auth/constants";

type SessionCookies = {
  accessToken?: string;
  refreshToken?: string;
};

function readCookieValue(rawCookie: string | null, name: string) {
  if (!rawCookie) return undefined;
  const token = rawCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!token) return undefined;
  return decodeURIComponent(token.slice(name.length + 1));
}

export function readSessionCookiesFromRequest(request: Request): SessionCookies {
  return {
    accessToken: readCookieValue(request.headers.get("cookie"), getApiAccessCookieName()),
    refreshToken: readCookieValue(request.headers.get("cookie"), getApiRefreshCookieName()),
  };
}

async function readSessionCookiesFromServer(): Promise<SessionCookies> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(getApiAccessCookieName())?.value,
    refreshToken: cookieStore.get(getApiRefreshCookieName())?.value,
  };
}

export async function getOptionalSessionCookies(request?: Request): Promise<SessionCookies> {
  if (request) {
    return readSessionCookiesFromRequest(request);
  }

  return readSessionCookiesFromServer();
}

export async function getSessionCookiesOrThrow(request?: Request) {
  const sessionCookies = await getOptionalSessionCookies(request);
  if (!sessionCookies.accessToken && !sessionCookies.refreshToken) {
    throw new Error("UNAUTHORIZED");
  }
  return sessionCookies;
}

export async function hasSessionCookies(request?: Request) {
  const sessionCookies = await getOptionalSessionCookies(request);
  return Boolean(sessionCookies.accessToken || sessionCookies.refreshToken);
}
