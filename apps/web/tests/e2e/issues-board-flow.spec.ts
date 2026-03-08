import { expect, test } from "@playwright/test";

type User = { id: string; name: string; email: string; role: "owner" | "user" };

test("GitHub 미러 이슈를 읽고 내부 계획 보드와 일정 화면을 함께 운영할 수 있다", async ({ page }) => {
  const users: User[] = [
    { id: "user-owner", name: "김오너", email: "owner@example.com", role: "owner" },
    { id: "user-jordan", name: "조단", email: "jordan@example.com", role: "user" },
  ];

  const organizations = [
    {
      id: "org-acme",
      name: "Acme Platform",
      slug: "acme-platform",
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
      createdAt: "2026-03-01T00:00:00.000Z",
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
      openIssueCount: 2,
      weeklyCommits: 12,
      weeklyMerges: 5,
      activityScore: 78,
    },
  ];

  const issues: Array<Record<string, unknown>> = [
    {
      id: "ISS-101",
      issueId: "issue-101",
      orgId: "org-acme",
      repoId: "repo-web",
      title: "릴리즈 노트 자동화",
      description: "GitHub 릴리즈 노트를 읽기 전용으로 노출합니다.",
      externalNumber: 101,
      sourceUrl: "https://github.com/acme/web-app/issues/101",
      readOnly: true,
      status: "backlog",
      assigneeId: "user-jordan",
      labelIds: ["release"],
      priority: "high",
      dueDate: "2026-03-12",
      estimatePoints: 5,
      difficultyScore: 70,
      impactScore: 85,
      createdBy: "user-owner",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
      order: 1,
    },
  ];

  const issueComments = [
    {
      id: "comment-101",
      issueId: "ISS-101",
      userId: "github-bot",
      body: "원본 코멘트는 GitHub에서 이어집니다.",
      sourceUrl: "https://github.com/acme/web-app/issues/101#issuecomment-1",
      readOnly: true,
      createdAt: "2026-03-01T11:00:00.000Z",
    },
  ];

  const requests = [
    {
      id: "request-1",
      title: "디자인 QA 동행",
      description: "협업 요청 일정",
      startAt: "2026-03-11T02:00:00.000Z",
      endAt: "2026-03-11T03:00:00.000Z",
      source: "request",
      allDay: false,
      status: "accepted",
      assigneeId: "user-jordan",
    },
  ];

  const scheduleEvents: Array<Record<string, unknown>> = [];
  const tasks: Array<Record<string, unknown>> = [];

  const buildCalendarEntries = () => {
    const taskEntries = tasks.map((task) => ({
      id: `task-${task.id}`,
      source: "task",
      title: String(task.title),
      description: String(task.description ?? ""),
      startAt: task.startDate ?? `${String(task.dueDate)}T00:00:00.000Z`,
      endAt: task.dueDate ? `${String(task.dueDate)}T23:59:59.000Z` : task.startDate,
      allDay: true,
      taskId: task.id,
      status: task.status,
      repoId: task.repoId,
      linkedIssueId: task.linkedIssueId,
    }));

    const eventEntries = scheduleEvents.map((event) => ({
      id: `event-${event.id}`,
      source: event.type,
      title: event.title,
      description: event.description,
      startAt: event.startAt,
      endAt: event.endAt,
      allDay: false,
      taskId: event.taskId,
      eventId: event.id,
    }));

    return [...taskEntries, ...requests, ...eventEntries];
  };

  await page.route("**/__mock_api__/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/__mock_api__", "");
    const orgId = url.searchParams.get("orgId");
    const repoId = url.searchParams.get("repoId");

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

    if (request.method() === "GET" && path === "/notifications") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ notifications: [] }),
      });
    }

    if (request.method() === "GET" && path === "/issues") {
      let filtered = [...issues];
      if (orgId) filtered = filtered.filter((issue) => issue.orgId === orgId);
      if (repoId) filtered = filtered.filter((issue) => issue.repoId === repoId);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          issues: filtered,
          users,
          totalCount: filtered.length,
          page: 1,
          size: filtered.length,
        }),
      });
    }

    if (request.method() === "GET" && path.startsWith("/issues/")) {
      const issueId = path.split("/")[2];
      const issue = issues.find((item) => item.id === issueId);
      return route.fulfill({
        status: issue ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(issue ? { issue, comments: issueComments, users } : { message: "NOT_FOUND" }),
      });
    }

    if (request.method() === "GET" && path === "/planning/tasks") {
      const filtered = orgId
        ? tasks.filter((task) => task.orgId === orgId && (!repoId || task.repoId === repoId))
        : tasks;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tasks: filtered, users }),
      });
    }

    if (request.method() === "POST" && path === "/planning/tasks") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const nextTask = {
        id: `task-${tasks.length + 1}`,
        orgId: orgId ?? "org-acme",
        repoId: payload.repoId ?? "repo-web",
        linkedIssueId: payload.linkedIssueId,
        title: payload.title,
        description: payload.description ?? "",
        status: "backlog",
        priority: payload.priority ?? "medium",
        assigneeId: payload.assigneeId,
        startDate: payload.startDate,
        dueDate: payload.dueDate,
        order: tasks.length + 1,
        createdBy: "user-owner",
        createdAt: "2026-03-10T00:00:00.000Z",
        updatedAt: "2026-03-10T00:00:00.000Z",
      };
      tasks.push(nextTask);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ task: nextTask }),
      });
    }

    if (request.method() === "POST" && path === "/planning/tasks/reorder") {
      const payload = request.postDataJSON() as Record<string, string[]>;
      const orderedStatuses = ["backlog", "in_progress", "review", "done"] as const;
      orderedStatuses.forEach((status) => {
        (payload[status] ?? []).forEach((taskId, index) => {
          const target = tasks.find((task) => task.id === taskId);
          if (target) {
            target.status = status;
            target.order = index + 1;
            target.updatedAt = "2026-03-10T01:00:00.000Z";
          }
        });
      });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tasks }),
      });
    }

    if (request.method() === "GET" && path === "/calendar/events") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ entries: buildCalendarEntries() }),
      });
    }

    if (request.method() === "POST" && path === "/calendar/events") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const nextEvent = {
        id: `event-${scheduleEvents.length + 1}`,
        title: payload.title,
        description: payload.description ?? "",
        type: payload.type ?? "meeting",
        startAt: payload.startAt,
        endAt: payload.endAt,
        allDay: false,
        taskId: payload.taskId,
      };
      scheduleEvents.push(nextEvent);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ event: nextEvent }),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: `NOT_MOCKED:${request.method()} ${path}` }),
    });
  });

  await page.goto("/issues");
  await expect(page.getByRole("heading", { name: "GitHub 이슈 미러", level: 2 })).toBeVisible();
  await expect(page.getByText("GitHub 레포는 읽기 전용입니다.")).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" }).first()).toBeVisible();

  const issueDetailLink = page.getByRole("link", { name: "ISS-101" }).first();
  await expect(issueDetailLink).toHaveAttribute("href", "/issues/ISS-101?orgId=org-acme");
  await page.goto("/issues/ISS-101?orgId=org-acme");
  await expect(page.getByText("GitHub 미러 이슈는 앱에서 직접 수정할 수 없습니다.")).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub 원본 열기" })).toBeVisible();

  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "내부 계획 칸반", level: 2 })).toBeVisible();
  await page.getByLabel("새 작업 제목").fill("릴리즈 체크리스트");
  await page.getByLabel("작업 설명").fill("배포 전 확인이 필요한 체크리스트입니다.");
  await page.getByLabel("GitHub 이슈 연결").selectOption("issue-101");
  await page.getByLabel("마감일").fill("2026-03-12");
  await page.getByRole("button", { name: "작업 추가" }).click();
  await expect(page.getByLabel("릴리즈 체크리스트")).toBeVisible();

  await page.getByLabel("릴리즈 체크리스트").dragTo(page.locator("#review"));
  await expect(page.locator("#review").getByText("릴리즈 체크리스트")).toBeVisible();

  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "팀 일정 아젠다", level: 2 })).toBeVisible();
  await expect(page.getByText("디자인 QA 동행")).toBeVisible();
  await expect(page.locator("article").filter({ hasText: "릴리즈 체크리스트" }).first()).toBeVisible();

  await page.getByLabel("독립 일정 제목").fill("런칭 리허설");
  await page.getByLabel("설명").fill("배포 전 최종 리허설");
  await page.getByLabel("연결 작업").selectOption({ label: "릴리즈 체크리스트" });
  await page.getByRole("button", { name: "일정 추가" }).click();

  await expect(page.locator("article").filter({ hasText: "런칭 리허설" }).first()).toBeVisible();
});
