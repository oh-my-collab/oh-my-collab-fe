export const queryKeys = {
  session: ["session"] as const,
  orgs: ["orgs"] as const,
  org: (orgId: string) => ["org", orgId] as const,
  reposByOrg: (orgId: string) => ["repos", orgId] as const,
  repo: (orgId: string, repoId: string) => ["repo", orgId, repoId] as const,
  repoActivity: (orgId: string, repoId: string) => ["repoActivity", orgId, repoId] as const,
  issues: (params: string) => ["issues", params] as const,
  issue: (orgId: string, issueId: string) => ["issue", orgId, issueId] as const,
  requests: (orgId: string) => ["requests", orgId] as const,
  reportsSummary: (orgId: string, period: string) => ["reportsSummary", orgId, period] as const,
  reportUser: (orgId: string, userId: string, period: string) =>
    ["reportUser", orgId, userId, period] as const,
  notifications: (orgId: string) => ["notifications", orgId] as const,
  settings: (orgId: string) => ["settings", orgId] as const,
};
