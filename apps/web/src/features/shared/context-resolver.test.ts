import { describe, expect, it } from "vitest";

import {
  buildContextHref,
  buildCurrentPageHref,
  resolveContext,
  selectRepoIdForOrganization,
} from "./context-resolver";

describe("resolveContext", () => {
  it("prefers route params over query and store values", () => {
    const result = resolveContext({
      pathname: "/orgs/org-route/repos/repo-route",
      currentSearchParams: new URLSearchParams("orgId=org-query&repoId=repo-query"),
      routeOrgId: "org-route",
      routeRepoId: "repo-route",
      storeOrgId: "org-store",
      storeRepoId: "repo-store",
      defaultOrgId: "org-default",
      includeRepoIdInQuery: true,
    });

    expect(result.orgId).toBe("org-route");
    expect(result.repoId).toBe("repo-route");
    expect(result.canonicalUrl).toBeNull();
  });

  it("falls back to store org and returns a canonical url for generic pages", () => {
    const result = resolveContext({
      pathname: "/requests",
      currentSearchParams: new URLSearchParams("tab=inbox"),
      storeOrgId: "org-store",
    });

    expect(result.orgId).toBe("org-store");
    expect(result.repoId).toBeNull();
    expect(result.canonicalUrl).toBe("/requests?tab=inbox&orgId=org-store");
  });

  it("can disable store and default fallback for recovery-only pages", () => {
    const result = resolveContext({
      pathname: "/issues/ISS-1",
      currentSearchParams: new URLSearchParams(),
      storeOrgId: "org-store",
      defaultOrgId: "org-default",
      allowStoreFallback: false,
      allowDefaultOrgFallback: false,
    });

    expect(result.orgId).toBeNull();
    expect(result.canonicalUrl).toBeNull();
  });
});

describe("buildContextHref", () => {
  it("preserves unrelated query params while adding org and repo", () => {
    const href = buildContextHref("/issues", {
      searchParams: new URLSearchParams("create=1"),
      orgId: "org-1",
      repoId: "repo-1",
      includeRepoId: true,
    });

    expect(href).toBe("/issues?create=1&orgId=org-1&repoId=repo-1");
  });

  it("drops repoId when the page is not repo-scoped", () => {
    const href = buildContextHref("/requests", {
      searchParams: new URLSearchParams("tab=sent&repoId=repo-old"),
      orgId: "org-1",
      repoId: "repo-1",
      includeRepoId: false,
    });

    expect(href).toBe("/requests?tab=sent&orgId=org-1");
  });
});

describe("buildCurrentPageHref", () => {
  it("navigates org and repo resource routes with route params instead of query strings", () => {
    expect(
      buildCurrentPageHref({
        pathname: "/orgs/org-1/repos/repo-1",
        orgId: "org-2",
        repoId: null,
      })
    ).toBe("/orgs/org-2");

    expect(
      buildCurrentPageHref({
        pathname: "/orgs/org-1",
        orgId: "org-1",
        repoId: "repo-9",
      })
    ).toBe("/orgs/org-1/repos/repo-9");
  });
});

describe("selectRepoIdForOrganization", () => {
  it("keeps a valid repo selection and falls back to the first repo when stale", () => {
    expect(selectRepoIdForOrganization(["repo-1", "repo-2"], "repo-2")).toBe("repo-2");
    expect(selectRepoIdForOrganization(["repo-1", "repo-2"], "repo-9")).toBe("repo-1");
    expect(selectRepoIdForOrganization([], "repo-9")).toBeNull();
  });
});
