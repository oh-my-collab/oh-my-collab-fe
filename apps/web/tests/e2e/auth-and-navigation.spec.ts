import { expect, test } from "@playwright/test";

type User = { id: string; name: string; email: string; role: "owner" | "user" };

test("랜딩 CTA와 보호 라우트 로그인 복귀가 동작한다", async ({ page }) => {
  const users: User[] = [
    { id: "user-owner", name: "김오너", email: "owner@example.com", role: "owner" },
    { id: "user-jordan", name: "조단", email: "jordan@example.com", role: "user" },
  ];

  const organizations = [
    {
      id: "org-acme",
      name: "Acme Product",
      slug: "acme-product",
      ownerId: "user-owner",
      memberIds: users.map((user) => user.id),
      source: "github",
      syncState: "active",
      github: {
        orgId: "github-org-acme",
        login: "acme",
        installationId: "inst-acme",
        connectedAt: "2026-03-01T00:00:00.000Z",
      },
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  const repositories = [
    {
      id: "repo-web",
      orgId: "org-acme",
      provider: "github",
      name: "web-app",
      fullName: "acme/web-app",
      slug: "web-app",
      description: "웹 프론트엔드",
      language: "TypeScript",
      sourceUrl: "https://github.com/acme/web-app",
      defaultBranch: "main",
      syncState: "active",
      openIssueCount: 1,
      weeklyCommits: 12,
      weeklyMerges: 5,
      activityScore: 78,
    },
  ];

  const issues = [
    {
      id: "ISS-101",
      issueId: "issue-101",
      orgId: "org-acme",
      repoId: "repo-web",
      title: "보드에서 이슈 카드 드래그 앤 드롭 개선",
      description: "보드 DnD 접근성 개선",
      externalNumber: 101,
      sourceUrl: "https://github.com/acme/web-app/issues/101",
      readOnly: true,
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

  let authenticated = false;

  await page.route("**/__mock_api__/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/__mock_api__", "");

    if (request.method() === "GET" && path === "/auth/session") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: authenticated ? users[0] : null }),
      });
    }

    if (request.method() === "POST" && path === "/auth/login") {
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

    if (request.method() === "GET" && path === "/issues") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ issues, users, totalCount: issues.length }),
      });
    }

    if (request.method() === "GET" && path === "/notifications") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ notifications: [] }),
      });
    }

    if (request.method() === "GET" && path === "/integrations/github/status") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          github: {
            configured: true,
            canBootstrap: true,
            installationCount: 1,
            slug: "oh-my-collab-app",
            appUrl: "https://github.com/apps/oh-my-collab-app",
          },
        }),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: `NOT_MOCKED:${request.method()} ${path}` }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
  await expect(page.getByRole("link", { name: "회원가입" })).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("link", { name: "시작하기" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "리포트 미리보기" })).toHaveCount(0);

  await page.goto("/issues");
  await expect(page).toHaveURL(/\/login\?redirectedFrom=%2Fissues$/);
  await expect(page.getByRole("link", { name: "회원가입" })).toHaveAttribute(
    "href",
    "/signup?redirectedFrom=%2Fissues"
  );

  authenticated = true;

  await page.getByLabel("이메일").fill("owner@example.com");
  await page.getByLabel("비밀번호").fill("password123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/issues$/);
  await expect(page.getByRole("heading", { name: "GitHub 이슈 미러", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" }).first()).toBeVisible();
});

test("세션 확인 실패가 있어도 로그인 폼은 계속 사용할 수 있다", async ({ page }) => {
  const users: User[] = [{ id: "user-owner", name: "김오너", email: "owner@example.com", role: "owner" }];

  let authenticated = false;
  let failInitialSessionCheck = true;

  await page.route("**/__mock_api__/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/__mock_api__", "");

    if (request.method() === "GET" && path === "/auth/session") {
      if (failInitialSessionCheck) {
        failInitialSessionCheck = false;
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "SESSION_DOWN" }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: authenticated ? users[0] : null }),
      });
    }

    if (request.method() === "POST" && path === "/auth/login") {
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
        body: JSON.stringify({ organizations: [], defaultOrgId: null }),
      });
    }

    if (request.method() === "GET" && path === "/integrations/github/status") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          github: {
            configured: false,
            canBootstrap: true,
            installationCount: 0,
          },
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

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: `NOT_MOCKED:${request.method()} ${path}` }),
    });
  });

  await page.goto("/login");
  await expect(page.getByText("세션을 확인하지 못했습니다. 로그인은 계속 진행할 수 있습니다.")).toBeVisible();

  authenticated = true;

  await page.getByLabel("이메일").fill("owner@example.com");
  await page.getByLabel("비밀번호").fill("password123");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/orgs$/);
  await expect(page.getByRole("heading", { name: "GitHub 조직 연결", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "GitHub App 설정" }).first()).toBeVisible();
});
