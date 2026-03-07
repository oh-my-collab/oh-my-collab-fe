import { expect, test } from "@playwright/test";

type User = { id: string; name: string; email: string; role: "owner" | "user" };

test("조직 생성과 설정 저장이 로그인 이후 동작한다", async ({ page }) => {
  const users: User[] = [
    { id: "user-owner", name: "김오너", email: "owner@example.com", role: "owner" },
    { id: "user-jordan", name: "조단", email: "jordan@example.com", role: "user" },
  ];

  const organizations: Array<Record<string, unknown>> = [
    {
      id: "org-acme",
      name: "Acme Product",
      slug: "acme-product",
      ownerId: "user-owner",
      memberIds: users.map((user) => user.id),
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  const reposByOrg: Record<string, Array<Record<string, unknown>>> = {
    "org-acme": [
      {
        id: "repo-web",
        orgId: "org-acme",
        name: "web-app",
        slug: "web-app",
        description: "웹 프론트엔드",
        language: "TypeScript",
        openIssueCount: 2,
        weeklyCommits: 12,
        weeklyMerges: 5,
        activityScore: 78,
      },
    ],
  };

  const issues = [
    {
      id: "ISS-101",
      orgId: "org-acme",
      repoId: "repo-web",
      title: "보드에서 이슈 카드 드래그 앤 드롭 개선",
      description: "보드 DnD 접근성 개선",
      status: "in_progress",
      assigneeId: "user-jordan",
      labelIds: ["frontend"],
      priority: "high",
      dueDate: "2026-03-02",
      estimatePoints: 5,
      difficultyScore: 70,
      impactScore: 80,
      createdBy: "user-owner",
      createdAt: "2026-02-25T10:00:00.000Z",
      updatedAt: "2026-02-25T10:00:00.000Z",
      order: 1,
    },
  ];

  const orgSummaries: Record<string, Record<string, number>> = {
    "org-acme": {
      repositoryCount: 1,
      openIssueCount: 2,
      inProgressCount: 1,
      weeklyCommits: 12,
      weeklyMerges: 5,
    },
  };

  let settings = {
    defaultOrgId: "org-acme",
    emailNotifications: true,
    mentionNotifications: true,
    issueStatusNotifications: true,
  };

  await page.route("**/__mock_api__/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/__mock_api__", "");
    const orgId = url.searchParams.get("orgId");

    if (request.method() === "GET" && path === "/auth/session") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: users[0] }),
      });
    }

    if (request.method() === "GET" && path === "/orgs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ organizations, defaultOrgId: settings.defaultOrgId }),
      });
    }

    if (request.method() === "POST" && path === "/orgs") {
      const payload = request.postDataJSON() as { name: string };
      const id = `org-${organizations.length + 1}`;
      const organization = {
        id,
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/\s+/g, "-"),
        ownerId: "user-owner",
        memberIds: users.map((user) => user.id),
        createdAt: new Date().toISOString(),
      };
      organizations.push(organization);
      reposByOrg[id] = [];
      orgSummaries[id] = {
        repositoryCount: 0,
        openIssueCount: 0,
        inProgressCount: 0,
        weeklyCommits: 0,
        weeklyMerges: 0,
      };

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ organization }),
      });
    }

    if (request.method() === "GET" && path.startsWith("/orgs/") && !path.endsWith("/repos")) {
      const targetOrgId = path.split("/")[2];
      const organization = organizations.find((item) => item.id === targetOrgId);

      if (!organization) {
        return route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "ORG_NOT_FOUND" }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ organization, summary: orgSummaries[targetOrgId] }),
      });
    }

    if (request.method() === "GET" && path.endsWith("/repos")) {
      const targetOrgId = path.split("/")[2];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ repositories: reposByOrg[targetOrgId] ?? [] }),
      });
    }

    if (request.method() === "GET" && path === "/issues") {
      const filtered = orgId ? issues.filter((issue) => issue.orgId === orgId) : issues;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          issues: filtered,
          users,
          page: 1,
          size: filtered.length,
          totalCount: filtered.length,
          sort: "createdAt:desc",
          filtersEcho: { orgId: orgId ?? undefined },
        }),
      });
    }

    if (request.method() === "GET" && path === "/notifications") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ notifications: [] }),
      });
    }

    if (request.method() === "GET" && path === "/settings") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ settings }),
      });
    }

    if (request.method() === "PATCH" && path === "/settings") {
      const payload = request.postDataJSON() as typeof settings;
      settings = { ...settings, ...payload };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ settings }),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: `NOT_MOCKED:${request.method()} ${path}` }),
    });
  });

  await page.context().addCookies([
    {
      name: "ohmc_access",
      value: "session-token",
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.goto("/orgs");
  await expect(page.getByRole("heading", { name: "조직 목록" })).toBeVisible();
  await page.getByLabel("새 조직 이름").fill("Growth Lab");
  await page.getByRole("button", { name: "조직 생성" }).click();
  await expect(page.getByRole("heading", { name: "Growth Lab", level: 3 })).toBeVisible();

  await page.goto("/orgs/org-2");
  await expect(page.getByRole("heading", { name: "Growth Lab" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "레포 상태" })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "조직/알림 설정" })).toBeVisible();

  const emailCheckbox = page.getByLabel("이메일 알림");
  await expect(emailCheckbox).toBeChecked();
  await emailCheckbox.uncheck();
  await page.getByRole("button", { name: "저장" }).click();
  await expect(emailCheckbox).not.toBeChecked();
});


