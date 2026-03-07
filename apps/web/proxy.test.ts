/**
 * @vitest-environment node
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "./src/proxy";
import { isProtectedPath } from "./src/features/auth/protected-route";

const currentDir = dirname(fileURLToPath(import.meta.url));

describe("proxy", () => {
  afterEach(() => {
    delete process.env.API_ACCESS_COOKIE_NAME;
    delete process.env.API_REFRESH_COOKIE_NAME;
  });

  it("classifies new protected paths", () => {
    expect(isProtectedPath("/orgs")).toBe(true);
    expect(isProtectedPath("/orgs/abc")).toBe(true);
    expect(isProtectedPath("/issues")).toBe(true);
    expect(isProtectedPath("/issues/ISS-1")).toBe(true);
    expect(isProtectedPath("/reports/users/user-1")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });

  it("redirects unauthenticated user to login on protected route", () => {
    const request = new NextRequest("http://localhost/issues");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows request when the backend access cookie is present", () => {
    const request = new NextRequest("http://localhost/issues", {
      headers: { cookie: "ohmc_access=session-token" },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it("allows request when only the backend refresh cookie is present", () => {
    const request = new NextRequest("http://localhost/issues", {
      headers: { cookie: "ohmc_refresh=refresh-token" },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it("does not treat the legacy auth_session cookie as authenticated", () => {
    const request = new NextRequest("http://localhost/issues", {
      headers: { cookie: "auth_session=legacy-token" },
    });

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("uses configured backend cookie names", () => {
    process.env.API_ACCESS_COOKIE_NAME = "custom_access";
    process.env.API_REFRESH_COOKIE_NAME = "custom_refresh";

    const request = new NextRequest("http://localhost/issues", {
      headers: { cookie: "custom_access=session-token" },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it("uses the Next.js 16 proxy file convention instead of root middleware", () => {
    expect(existsSync(join(currentDir, "middleware.ts"))).toBe(false);
  });
});
