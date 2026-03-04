import { z } from "zod";

export const issueStatusSchema = z.enum(["backlog", "in_progress", "review", "done"]);
export const issuePrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const createIssueSchema = z.object({
  orgId: z.string().min(1),
  repoId: z.string().min(1),
  title: z.string().min(2).max(140),
  description: z.string().min(1).max(3000),
  status: issueStatusSchema.default("backlog"),
  assigneeId: z.string().optional(),
  labelIds: z.array(z.string()).default([]),
  priority: issuePrioritySchema.default("medium"),
  dueDate: z.string().optional(),
  estimatePoints: z.number().int().min(1).max(21).default(3),
  difficultyScore: z.number().min(0).max(100).default(50),
  impactScore: z.number().min(0).max(100).default(50),
  createdBy: z.string().min(1),
});

export const updateIssueSchema = z
  .object({
    title: z.string().min(2).max(140).optional(),
    description: z.string().min(1).max(3000).optional(),
    status: issueStatusSchema.optional(),
    assigneeId: z.string().optional(),
    labelIds: z.array(z.string()).optional(),
    priority: issuePrioritySchema.optional(),
    dueDate: z.string().optional(),
    estimatePoints: z.number().int().min(1).max(21).optional(),
    difficultyScore: z.number().min(0).max(100).optional(),
    impactScore: z.number().min(0).max(100).optional(),
    comment: z.string().min(1).max(1000).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "EMPTY_PATCH",
  });

export const issueReorderSchema = z.object({
  orgId: z.string().min(1),
  repoId: z.string().min(1),
  buckets: z.object({
    backlog: z.array(z.string()),
    in_progress: z.array(z.string()),
    review: z.array(z.string()),
    done: z.array(z.string()),
  }),
});

export const createRequestSchema = z.object({
  orgId: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  type: z.enum(["review", "pair_programming", "bug_fix", "architecture"]),
  message: z.string().min(5).max(1000),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
});

export const updateRequestSchema = z
  .object({
    status: z.enum(["pending", "accepted", "rejected", "questioned"]).optional(),
    comment: z.string().min(1).max(800).optional(),
  })
  .refine((input) => input.status || input.comment, { message: "EMPTY_PATCH" });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signupSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const createOrgSchema = z.object({
  name: z.string().min(2).max(80),
});

export const updateSettingsSchema = z
  .object({
    defaultOrgId: z.string().optional(),
    defaultRepoId: z.string().optional(),
    emailNotifications: z.boolean().optional(),
    mentionNotifications: z.boolean().optional(),
    issueStatusNotifications: z.boolean().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, { message: "EMPTY_PATCH" });
