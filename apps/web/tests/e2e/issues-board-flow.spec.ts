import { expect, test } from "@playwright/test";

type User = { id: string; name: string; email: string; role: "owner" | "user" };

test("이슈 생성 후 보드와 상세 화면에서 확인 가능하다", async ({ page }) => {
  const users: User[] = [
    { id: "user-owner", name: "김오너", email: "owner@example.com", role: "owner" },
    { id: "user-jordan", name: "조단", email: "jordan@example.com", role: "user" },
    { id: "user-mina", name: "미나", email: "mina@example.com", role: "user" },
  ];

  const organizations = [
    {
      id: "org-acme",
      name: "Acme Product",
      slug: "acme-product",
      ownerId: "user-owner",
      memberIds: users.map((user) => user.id),
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  const repositories = [
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
  ];

  const issues: Array<Record<string, unknown>> = [
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
    {
      id: "ISS-102",
      orgId: "org-acme",
      repoId: "repo-web",
      title: "이슈 리스트 필터 성능 최적화",
      description: "필터 조건 메모이제이션",
      status: "backlog",
      assigneeId: "user-mina",
      labelIds: ["frontend"],
      priority: "medium",
      dueDate: "2026-03-05",
      estimatePoints: 3,
      difficultyScore: 50,
      impactScore: 60,
      createdBy: "user-owner",
      createdAt: "2026-02-24T10:00:00.000Z",
      updatedAt: "2026-02-24T10:00:00.000Z",
      order: 2,
    },
  ];

  await page.route("**/__mock_api__/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/__mock_api__", "");

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
        body: JSON.stringify({ organizations, defaultOrgId: organizations[0].id }),
      });
    }

    if (request.method() === "GET" && path === `/orgs/${organizations[0].id}/repos`) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ repositories }),
      });
    }

    if (request.method() === "GET" && path === "/notifications") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ notifications: [] }),
      });
    }

    if (request.method() === "GET" && path === "/issues") {
      const orgId = url.searchParams.get("orgId");
      const repoId = url.searchParams.get("repoId");
      const q = url.searchParams.get("q");

      let filtered = [...issues];
      if (orgId) filtered = filtered.filter((issue) => issue.orgId === orgId);
      if (repoId) filtered = filtered.filter((issue) => issue.repoId === repoId);
      if (q) filtered = filtered.filter((issue) => String(issue.title).includes(q));

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ issues: filtered, users }),
      });
    }

    if (request.method() === "POST" && path === "/issues") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const now = new Date().toISOString();
      const nextIssue = {
        id: `ISS-${301 + issues.length}`,
        orgId: payload.orgId,
        repoId: payload.repoId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? "backlog",
        assigneeId: payload.assigneeId,
        labelIds: payload.labelIds ?? [],
        priority: payload.priority ?? "medium",
        dueDate: payload.dueDate,
        estimatePoints: payload.estimatePoints ?? 3,
        difficultyScore: payload.difficultyScore ?? 50,
        impactScore: payload.impactScore ?? 50,
        createdBy: payload.createdBy ?? "user-owner",
        createdAt: now,
        updatedAt: now,
        order: issues.length + 1,
      };

      issues.push(nextIssue);

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ issue: nextIssue }),
      });
    }

    if (request.method() === "GET" && path.startsWith("/issues/")) {
      const issueId = path.split("/")[2];
      const issue = issues.find((item) => item.id === issueId);

      if (!issue) {
        return route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "NOT_FOUND" }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ issue, comments: [], users }),
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

  await page.goto("/issues");
  await page.getByRole("button", { name: "이슈 생성" }).click();

  await page.getByLabel("제목").fill("E2E 생성 이슈");
  await page.getByLabel("설명").fill("E2E 시나리오용 이슈");
  await page.getByRole("button", { name: "생성" }).click();
  await expect(page.getByRole("dialog", { name: "새 이슈 생성" })).toBeHidden();

  await expect(page.getByRole("link", { name: "E2E 생성 이슈" }).first()).toBeVisible();

  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "칸반 보드" })).toBeVisible();
  await expect(page.getByText("E2E 생성 이슈")).toBeVisible();

  await page.goto("/issues");
  await page.getByRole("link", { name: /E2E 생성 이슈/ }).first().click();
  await expect(page).toHaveURL(/\/issues\/ISS-/);
  await expect(page.getByRole("heading", { name: /ISS-\d+/, level: 2 })).toBeVisible();
});

