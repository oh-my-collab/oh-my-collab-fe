import { expect, test } from "@playwright/test";

type User = { id: string; name: string; email: string; role: "owner" | "user" };

test("GitHub App 설정과 조직 연결, 설정 저장이 로그인 이후 동작한다", async ({ page }) => {
  const users: User[] = [{ id: "user-owner", name: "김오너", email: "owner@example.com", role: "owner" }];

  const repositoriesByOrg: Record<string, Array<Record<string, unknown>>> = {
    "org-acme": [
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
        openIssueCount: 3,
        weeklyCommits: 14,
        weeklyMerges: 4,
        activityScore: 82,
      },
    ],
  };

  const organizations: Array<Record<string, unknown>> = [];
  let githubConfigured = false;
  let installationCount = 0;
  let settings = {
    defaultOrgId: "",
    emailNotifications: true,
    mentionNotifications: true,
    issueStatusNotifications: true,
  };

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
        body: JSON.stringify({
          organizations,
          defaultOrgId: settings.defaultOrgId || organizations[0]?.id || null,
        }),
      });
    }

    if (request.method() === "GET" && path.startsWith("/orgs/") && path.endsWith("/repos")) {
      const orgId = path.split("/")[2];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ repositories: repositoriesByOrg[orgId] ?? [] }),
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
            configured: githubConfigured,
            canBootstrap: true,
            installationCount,
            slug: githubConfigured ? "oh-my-collab-app" : undefined,
            appUrl: githubConfigured ? "https://github.com/apps/oh-my-collab-app" : undefined,
          },
        }),
      });
    }

    if (request.method() === "POST" && path === "/integrations/github/bootstrap/manifest") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          submitUrl: "http://localhost:3000/__mock_api__/github/app-manifest",
          manifest: {
            name: "OH-MY-COLLAB",
            url: "https://oh-my-collab-fe.vercel.app",
          },
        }),
      });
    }

    if (request.method() === "POST" && path === "/github/app-manifest") {
      githubConfigured = true;
      return route.fulfill({
        status: 302,
        headers: { location: "/orgs?bootstrapped=1" },
        body: "",
      });
    }

    if (request.method() === "GET" && path === "/integrations/github/install") {
      installationCount = 1;
      if (!organizations.length) {
        organizations.push({
          id: "org-acme",
          name: "Acme Platform",
          slug: "acme-platform",
          ownerId: "user-owner",
          memberIds: ["user-owner"],
          source: "github",
          syncState: "active",
          github: {
            orgId: "github-org-acme",
            login: "acme",
            installationId: "inst-acme",
            connectedAt: "2026-03-01T00:00:00.000Z",
          },
          createdAt: "2026-03-01T00:00:00.000Z",
        });
        settings = { ...settings, defaultOrgId: "org-acme" };
      }

      return route.fulfill({
        status: 302,
        headers: { location: "/orgs?connected=1" },
        body: "",
      });
    }

    if (request.method() === "GET" && path === "/settings") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          settings: {
            ...settings,
            defaultOrgId: settings.defaultOrgId || organizations[0]?.id || "",
          },
        }),
      });
    }

    if (request.method() === "PATCH" && path === "/settings") {
      settings = { ...settings, ...(request.postDataJSON() as typeof settings) };
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

  await page.goto("/orgs");
  await expect(page.getByRole("heading", { name: "GitHub 조직 연결", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "GitHub App 설정" }).first()).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/orgs\?bootstrapped=1$/),
    page.getByRole("button", { name: "GitHub App 설정" }).first().click(),
  ]);

  await expect(page.getByRole("button", { name: "GitHub 조직 연결" }).first()).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/orgs\?connected=1$/),
    page.getByRole("button", { name: "GitHub 조직 연결" }).first().click(),
  ]);

  await expect(page.getByRole("heading", { name: "Acme Platform", level: 3 })).toBeVisible();
  await expect(page.getByText("GitHub 조직: acme")).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "조직/연동 설정", level: 2 })).toBeVisible();
  await expect(page.getByText("연동 준비 완료. 설치 1건")).toBeVisible();
  await expect(page.getByRole("button", { name: "GitHub 조직 연결" }).first()).toBeVisible();

  const emailCheckbox = page.getByLabel("이메일 알림");
  await expect(emailCheckbox).toBeChecked();
  await emailCheckbox.uncheck();
  await page.getByRole("button", { name: "저장" }).click();
  await expect(emailCheckbox).not.toBeChecked();
});
