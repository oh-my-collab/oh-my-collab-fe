export type UserRole = "owner" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

export type GitHubOrgConnection = {
  orgId: string;
  login?: string;
  installationId?: string;
  connectedAt?: string;
};

export type GitHubIntegrationStatus = {
  configured: boolean;
  canBootstrap: boolean;
  slug?: string;
  appUrl?: string;
  installationCount: number;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  memberIds: string[];
  source?: "manual" | "github";
  syncState?: "pending" | "active" | "error" | "disconnected";
  github?: GitHubOrgConnection;
  createdAt: string;
};

export type Repository = {
  id: string;
  orgId: string;
  provider?: "github" | "gitlab" | "mock";
  name: string;
  fullName?: string;
  slug: string;
  description: string;
  language: string;
  sourceUrl?: string;
  defaultBranch?: string;
  syncState?: "pending" | "active" | "error" | "disconnected";
  lastSyncedAt?: string;
  openIssueCount: number;
  weeklyCommits: number;
  weeklyMerges: number;
  activityScore: number;
};

export type IssueStatus = "backlog" | "in_progress" | "review" | "done";
export type IssuePriority = "low" | "medium" | "high" | "urgent";

export type Issue = {
  id: string;
  issueId?: string;
  orgId: string;
  repoId: string;
  title: string;
  description: string;
  externalNumber?: number;
  sourceUrl?: string;
  readOnly?: boolean;
  status: IssueStatus;
  assigneeId?: string;
  labelIds: string[];
  priority: IssuePriority;
  dueDate?: string;
  estimatePoints: number;
  difficultyScore: number;
  impactScore: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  version?: number;
};

export type IssueComment = {
  id: string;
  issueId: string;
  userId: string;
  body: string;
  sourceUrl?: string;
  readOnly?: boolean;
  createdAt: string;
};

export type PlanningTaskStatus = "backlog" | "in_progress" | "review" | "done";
export type ScheduleEventType = "meeting" | "milestone" | "event";

export type PlanningTask = {
  id: string;
  orgId: string;
  repoId?: string;
  linkedIssueId?: string;
  title: string;
  description: string;
  status: PlanningTaskStatus;
  priority: IssuePriority;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleEvent = {
  id: string;
  title: string;
  description: string;
  type: "task" | "request" | ScheduleEventType;
  startAt: string;
  endAt: string;
  allDay: boolean;
  taskId?: string;
};

export type CalendarEntry = {
  id: string;
  source: "task" | "request" | "meeting" | "milestone" | "event";
  title: string;
  description: string;
  startAt?: string;
  endAt?: string;
  allDay: boolean;
  taskId?: string;
  requestId?: string;
  eventId?: string;
  status?: string;
  assigneeId?: string;
  repoId?: string;
  linkedIssueId?: string;
};

export type NotificationType = "request" | "mention" | "issue_status";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
};

export type CollabRequestStatus = "pending" | "accepted" | "rejected" | "questioned";
export type CollabRequestType = "review" | "pair_programming" | "bug_fix" | "architecture";

export type CollabRequest = {
  id: string;
  orgId: string;
  fromUserId: string;
  toUserId: string;
  type: CollabRequestType;
  message: string;
  fromDate: string;
  toDate: string;
  status: CollabRequestStatus;
  emailSent: boolean;
  comments: Array<{ id: string; userId: string; body: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
};

export type RepoActivityPoint = {
  date: string;
  commits: number;
  merges: number;
};

export type UserContributionCard = {
  userId: string;
  userName: string;
  taskCount: number;
  difficultyScore: number;
  impactScore: number;
  highlights: string[];
};

export type AiEvidence = {
  model: string;
  promptVersion: string;
  reasoning: string[];
  activityTypes: string[];
};

export type RiskItem = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
};

export type NextAction = {
  id: string;
  title: string;
  owner: string;
  dueDate?: string;
};

export type TeamReport = {
  period: "week" | "month";
  summary: string;
  totalTasks: number;
  completedTasks: number;
  avgDifficulty: number;
  timeline: Array<{ date: string; completed: number; created: number }>;
  contributors: UserContributionCard[];
  evidence: AiEvidence;
  risks: RiskItem[];
  nextActions: NextAction[];
};

export type UserReport = {
  userId: string;
  userName: string;
  summary: string;
  taskCount: number;
  completedTaskCount: number;
  avgDifficulty: number;
  impactScore: number;
  byRepo: Array<{ repoId: string; repoName: string; taskCount: number; difficultyAvg: number }>;
  recentIssues: Issue[];
  evidence: AiEvidence;
  risks: RiskItem[];
  nextActions: NextAction[];
};

export type AppSettings = {
  defaultOrgId: string;
  defaultRepoId?: string;
  emailNotifications: boolean;
  mentionNotifications: boolean;
  issueStatusNotifications: boolean;
};

export type SessionPayload = {
  user: User | null;
};
