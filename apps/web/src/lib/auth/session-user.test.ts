import { afterEach, describe, expect, it } from "vitest";

import { getSessionUserIdFrom, readSessionCookiesFromRequest } from "./session-user";

describe("session-user", () => {
  afterEach(() => {
    delete process.env.API_ACCESS_COOKIE_NAME;
    delete process.env.API_REFRESH_COOKIE_NAME;
  });

  it("throws UNAUTHORIZED when session user is missing", async () => {
    await expect(getSessionUserIdFrom(async () => ({ user: null }))).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns session user id from the session source", async () => {
    await expect(getSessionUserIdFrom(async () => ({ user: { id: "user-1" } }))).resolves.toBe("user-1");
  });

  it("reads backend session cookies with default names", () => {
    const request = new Request("http://localhost", {
      headers: {
        cookie: "foo=bar; ohmc_access=access-token; ohmc_refresh=refresh-token; hello=world",
      },
    });

    expect(readSessionCookiesFromRequest(request)).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("respects configured backend cookie names", () => {
    process.env.API_ACCESS_COOKIE_NAME = "custom_access";
    process.env.API_REFRESH_COOKIE_NAME = "custom_refresh";

    const request = new Request("http://localhost", {
      headers: {
        cookie: "custom_access=access-token; custom_refresh=refresh-token",
      },
    });

    expect(readSessionCookiesFromRequest(request)).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });
});
