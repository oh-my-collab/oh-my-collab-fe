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
  planning: {
    tasks: "/planning/tasks",
    detail: (taskId: string) => `/planning/tasks/${taskId}`,
    reorder: "/planning/tasks/reorder",
  },
  calendar: {
    events: "/calendar/events",
    detail: (eventId: string) => `/calendar/events/${eventId}`,
  },
  github: {
    status: "/integrations/github/status",
    bootstrapManifest: "/integrations/github/bootstrap/manifest",
    install: "/integrations/github/install",
    resync: (orgId: string) => `/integrations/github/orgs/${orgId}/resync`,
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
