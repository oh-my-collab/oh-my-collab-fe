import { NextResponse, type NextRequest } from "next/server";

import { getApiAccessCookieName, getApiRefreshCookieName } from "./src/features/auth/constants";

const PROTECTED_ROUTE_PREFIXES = [
  "/orgs",
  "/board",
  "/issues",
  "/requests",
  "/reports",
  "/settings",
] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function hasSessionCookie(request: NextRequest) {
  const accessCookie = request.cookies.get(getApiAccessCookieName())?.value;
  const refreshCookie = request.cookies.get(getApiRefreshCookieName())?.value;
  return Boolean(accessCookie || refreshCookie);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirectedFrom", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/orgs/:path*",
    "/board/:path*",
    "/issues/:path*",
    "/requests/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
