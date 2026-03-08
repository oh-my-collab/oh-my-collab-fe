import type {
  AppSettings,
  CalendarEntry,
  CollabRequest,
  GitHubIntegrationStatus,
  Issue,
  IssueComment,
  Notification,
  Organization,
  PlanningTask,
  Repository,
  ScheduleEvent,
  SessionPayload,
  TeamReport,
  User,
  UserReport,
} from "@/features/shared/types";
import { endpoints } from "@/lib/api/endpoints";

type ApiErrorPayload = {
  message?: string;
  issues?: unknown;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  searchParams?: URLSearchParams;
};

export const CONFIG_MISSING_API_BASE_URL = "CONFIG_MISSING_API_BASE_URL";

export function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error(CONFIG_MISSING_API_BASE_URL);
  }
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function buildBackendUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

function buildUrl(path: string, searchParams?: URLSearchParams) {
  const query = searchParams ? `?${searchParams.toString()}` : "";
  return `${buildBackendUrl(path)}${query}`;
}

function withOrgId(searchParams: URLSearchParams | undefined, orgId: string) {
  const next = new URLSearchParams(searchParams);
  next.set("orgId", orgId);
  return next;
}

function apiFetch(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const init: RequestInit = {
    method: options.method,
    headers,
    credentials: "include",
    cache: options.cache,
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  return fetch(buildUrl(path, options.searchParams), init);
}

async function parseResponse<T>(responseLike: Response | Promise<Response>): Promise<T> {
  const response = await responseLike;
  const raw = await response.text();
  let body: unknown = null;

  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = { message: raw };
    }
  }

  if (!response.ok) {
    const errorPayload = (body ?? {}) as ApiErrorPayload;
    const message =
      (typeof errorPayload.message === "string" && errorPayload.message) ||
      `HTTP_${response.status}`;
    const error = new Error(message) as Error & { issues?: unknown };
    error.issues = errorPayload.issues;
    throw error;
  }

  return body as T;
}

export const backendClient = {
  getSession: () => parseResponse<SessionPayload>(apiFetch(endpoints.session.get, { cache: "no-store" })),

  signup: (input: { name: string; email: string; password: string }) =>
    parseResponse<{ user: User }>(
      apiFetch(endpoints.session.signup, {
        method: "POST",
        body: input,
      })
    ),

  login: (input: { email: string; password: string }) =>
    parseResponse<{ user: User }>(
      apiFetch(endpoints.session.login, {
        method: "POST",
        body: input,
      })
    ),

  logout: () =>
    parseResponse<{ success: boolean }>(
      apiFetch(endpoints.session.logout, {
        method: "POST",
      })
    ),

  listOrgs: () =>
    parseResponse<{ organizations: Organization[]; defaultOrgId?: string }>(
      apiFetch(endpoints.orgs.list, { cache: "no-store" })
    ),

  createOrg: (name: string) =>
    parseResponse<{ organization: Organization }>(
      apiFetch(endpoints.orgs.list, {
        method: "POST",
        body: { name },
      })
    ),

  getOrg: (orgId: string) =>
    parseResponse<{
      organization: Organization;
      summary: {
        repositoryCount: number;
        openIssueCount: number;
        inProgressCount: number;
        weeklyCommits: number;
        weeklyMerges: number;
      };
    }>(apiFetch(endpoints.orgs.detail(orgId), { cache: "no-store" })),

  listReposByOrg: (orgId: string) =>
    parseResponse<{ repositories: Repository[] }>(
      apiFetch(endpoints.orgs.repos(orgId), { cache: "no-store" })
    ),

  getRepo: (orgId: string, repoId: string) =>
    parseResponse<{
      repository: Repository;
      summary: { openIssueCount: number; doneIssueCount: number; highPriorityCount: number };
    }>(
      apiFetch(endpoints.repos.detail(repoId), {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  getRepoActivity: (orgId: string, repoId: string) =>
    parseResponse<{ activity: Array<{ date: string; commits: number; merges: number }> }>(
      apiFetch(endpoints.repos.activity(repoId), {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  listIssues: (orgId: string, params: URLSearchParams) =>
    parseResponse<{
      issues: Issue[];
      users: User[];
      page: number;
      size: number;
      totalCount: number;
      sort: string;
      filtersEcho: Record<string, string | undefined>;
    }>(
      apiFetch(endpoints.issues.list, {
        cache: "no-store",
        searchParams: withOrgId(params, orgId),
      })
    ),

  createIssue: (orgId: string, input: Record<string, unknown>) =>
    parseResponse<{ issue: Issue }>(
      apiFetch(endpoints.issues.list, {
        method: "POST",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  getIssue: (orgId: string, issueId: string) =>
    parseResponse<{
      issue: Issue;
      comments: IssueComment[];
      users: User[];
    }>(
      apiFetch(endpoints.issues.detail(issueId), {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  updateIssue: (orgId: string, issueId: string, patch: Record<string, unknown>) =>
    parseResponse<{ issue: Issue }>(
      apiFetch(endpoints.issues.detail(issueId), {
        method: "PATCH",
        body: patch,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  reorderIssues: (orgId: string, payload: Record<string, unknown>) =>
    parseResponse<{ issues: Issue[] }>(
      apiFetch(endpoints.issues.reorder, {
        method: "PATCH",
        body: payload,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  listPlanningTasks: (orgId: string, params?: URLSearchParams) =>
    parseResponse<{ tasks: PlanningTask[]; users: User[] }>(
      apiFetch(endpoints.planning.tasks, {
        cache: "no-store",
        searchParams: withOrgId(params, orgId),
      })
    ),

  createPlanningTask: (orgId: string, input: Record<string, unknown>) =>
    parseResponse<{ task: PlanningTask }>(
      apiFetch(endpoints.planning.tasks, {
        method: "POST",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  updatePlanningTask: (orgId: string, taskId: string, input: Record<string, unknown>) =>
    parseResponse<{ task: PlanningTask }>(
      apiFetch(endpoints.planning.detail(taskId), {
        method: "PATCH",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  reorderPlanningTasks: (orgId: string, payload: Record<string, unknown>) =>
    parseResponse<{ tasks: PlanningTask[]; users: User[] }>(
      apiFetch(endpoints.planning.reorder, {
        method: "POST",
        body: payload,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  listCalendarEntries: (orgId: string, params: URLSearchParams) =>
    parseResponse<{ entries: CalendarEntry[] }>(
      apiFetch(endpoints.calendar.events, {
        cache: "no-store",
        searchParams: withOrgId(params, orgId),
      })
    ),

  createScheduleEvent: (orgId: string, input: Record<string, unknown>) =>
    parseResponse<{ event: ScheduleEvent }>(
      apiFetch(endpoints.calendar.events, {
        method: "POST",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  updateScheduleEvent: (orgId: string, eventId: string, input: Record<string, unknown>) =>
    parseResponse<{ event: ScheduleEvent }>(
      apiFetch(endpoints.calendar.detail(eventId), {
        method: "PATCH",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  getGitHubStatus: () =>
    parseResponse<{ github: GitHubIntegrationStatus }>(
      apiFetch(endpoints.github.status, { cache: "no-store" })
    ),

  createGitHubBootstrapManifest: () =>
    parseResponse<{ alreadyConfigured?: boolean; github?: GitHubIntegrationStatus; submitUrl: string; manifest: Record<string, unknown> }>(
      apiFetch(endpoints.github.bootstrapManifest, {
        method: "POST",
      })
    ),

  transferPlatformOwner: (email: string) =>
    parseResponse<{ owner: { id: string; email: string; name: string; isPlatformOwner: boolean } }>(
      apiFetch(endpoints.settings.transferOwner, {
        method: "PATCH",
        body: { email },
      })
    ),

  resyncGitHubOrg: (orgId: string) =>
    parseResponse<{ status: string }>(
      apiFetch(endpoints.github.resync(orgId), {
        method: "POST",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  listRequests: (orgId: string) =>
    parseResponse<{ requests: CollabRequest[]; users: User[] }>(
      apiFetch(endpoints.requests.list, {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  createRequest: (orgId: string, input: Record<string, unknown>) => {
    const { orgId: _orgId, fromUserId: _fromUserId, ...payload } = input;

    return parseResponse<{ request: CollabRequest }>(
      apiFetch(endpoints.requests.list, {
        method: "POST",
        body: payload,
        searchParams: withOrgId(undefined, orgId),
      })
    );
  },

  updateRequest: (orgId: string, requestId: string, input: Record<string, unknown>) =>
    parseResponse<{ request: CollabRequest }>(
      apiFetch(endpoints.requests.detail(requestId), {
        method: "PATCH",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  getTeamReport: (orgId: string, period: "week" | "month") =>
    parseResponse<{ report: TeamReport }>(
      apiFetch(endpoints.reports.summary, {
        cache: "no-store",
        searchParams: withOrgId(new URLSearchParams({ period }), orgId),
      })
    ),

  getUserReport: (orgId: string, userId: string, period: "week" | "month") =>
    parseResponse<{ report: UserReport }>(
      apiFetch(endpoints.reports.user(userId), {
        cache: "no-store",
        searchParams: withOrgId(new URLSearchParams({ period }), orgId),
      })
    ),

  listNotifications: (orgId: string) =>
    parseResponse<{ notifications: Notification[] }>(
      apiFetch(endpoints.notifications.list, {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  markNotificationRead: (orgId: string, id: string) =>
    parseResponse<{ notification: Notification }>(
      apiFetch(endpoints.notifications.read(id), {
        method: "PATCH",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  getSettings: (orgId: string) =>
    parseResponse<{ settings: AppSettings }>(
      apiFetch(endpoints.settings.detail, {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  updateSettings: (orgId: string, input: Record<string, unknown>) =>
    parseResponse<{ settings: AppSettings }>(
      apiFetch(endpoints.settings.detail, {
        method: "PATCH",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),
};
