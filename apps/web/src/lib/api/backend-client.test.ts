import { afterEach, describe, expect, it, vi } from "vitest";

import { backendClient, CONFIG_MISSING_API_BASE_URL } from "./backend-client";

describe("backend-client", () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
    vi.restoreAllMocks();
  });

  it("throws when NEXT_PUBLIC_API_BASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(() => backendClient.getSession()).toThrow(CONFIG_MISSING_API_BASE_URL);
  });

  it("falls back to error text when error response is non-json", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Error", {
        status: 500,
      })
    );

    await expect(backendClient.getSession()).rejects.toThrow("Internal Error");
  });

  it("always sends credentials include", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await backendClient.getSession();

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
  });

  it("sends signup request to /auth/signup with payload", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "user-1",
            name: "테스터",
            email: "tester@example.com",
            role: "user",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );

    await backendClient.signup({
      name: "테스터",
      email: "tester@example.com",
      password: "password123",
    });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:4000/auth/signup");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({
        name: "테스터",
        email: "tester@example.com",
        password: "password123",
      })
    );
    expect(init.credentials).toBe("include");
  });

  it("appends orgId query for alias issue endpoints and reads list meta", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          issues: [],
          users: [],
          page: 1,
          size: 20,
          totalCount: 42,
          sort: "updatedAt:desc",
          filtersEcho: {
            status: "in_progress",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );

    const result = await backendClient.listIssues("org-1", new URLSearchParams({ status: "in_progress" }));

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/issues?");
    expect(url).toContain("status=in_progress");
    expect(url).toContain("orgId=org-1");
    expect(result.totalCount).toBe(42);
    expect(result.page).toBe(1);
    expect(result.sort).toBe("updatedAt:desc");
  });

  it("keeps latestIssue in issues payload on VERSION_CONFLICT", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "VERSION_CONFLICT",
          message: "Latest version conflict.",
          requestId: "req-1",
          issues: {
            latestIssue: {
              id: "ISS-101",
              version: 7,
              updatedAt: "2026-02-28T10:20:00.000Z",
            },
          },
        }),
        {
          status: 409,
          headers: { "content-type": "application/json" },
        }
      )
    );

    await expect(backendClient.updateIssue("org-1", "ISS-101", { version: 6 })).rejects.toMatchObject({
      message: "Latest version conflict.",
      code: "VERSION_CONFLICT",
      status: 409,
      requestId: "req-1",
      issues: {
        latestIssue: {
          id: "ISS-101",
          version: 7,
        },
      },
    });
  });

  it("keeps status and requestId when unauthorized response is json", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Session expired.",
          requestId: "req-401",
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        }
      )
    );

    await expect(backendClient.getSession()).rejects.toMatchObject({
      message: "Session expired.",
      code: "UNAUTHORIZED",
      status: 401,
      requestId: "req-401",
    });
  });
});
