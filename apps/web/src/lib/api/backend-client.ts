import type {
  AppSettings,
  CollabRequest,
  Issue,
  Notification,
  Organization,
  Repository,
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

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error(CONFIG_MISSING_API_BASE_URL);
  }
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildUrl(path: string, searchParams?: URLSearchParams) {
  const query = searchParams ? `?${searchParams.toString()}` : "";
  return `${getApiBaseUrl()}${path}${query}`;
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
      comments: Array<{ id: string; issueId: string; userId: string; body: string; createdAt: string }>;
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

  listRequests: (orgId: string) =>
    parseResponse<{ requests: CollabRequest[]; users: User[] }>(
      apiFetch(endpoints.requests.list, {
        cache: "no-store",
        searchParams: withOrgId(undefined, orgId),
      })
    ),

  createRequest: (orgId: string, input: Record<string, unknown>) =>
    parseResponse<{ request: CollabRequest }>(
      apiFetch(endpoints.requests.list, {
        method: "POST",
        body: input,
        searchParams: withOrgId(undefined, orgId),
      })
    ),

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
