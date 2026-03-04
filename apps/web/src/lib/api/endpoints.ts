export const endpoints = {
  session: {
    signup: "/auth/signup",
    get: "/auth/session",
    login: "/auth/login",
    logout: "/auth/logout",
  },
  orgs: {
    list: "/orgs",
    detail: (orgId: string) => `/orgs/${orgId}`,
    repos: (orgId: string) => `/orgs/${orgId}/repos`,
  },
  repos: {
    detail: (repoId: string) => `/repos/${repoId}`,
    activity: (repoId: string) => `/repos/${repoId}/activity`,
  },
  issues: {
    list: "/issues",
    detail: (issueId: string) => `/issues/${issueId}`,
    reorder: "/issues/reorder",
  },
  requests: {
    list: "/requests",
    detail: (requestId: string) => `/requests/${requestId}`,
  },
  reports: {
    summary: "/reports/summary",
    user: (userId: string) => `/reports/users/${userId}`,
  },
  notifications: {
    list: "/notifications",
    read: (notificationId: string) => `/notifications/${notificationId}/read`,
  },
  settings: {
    detail: "/settings",
  },
};
