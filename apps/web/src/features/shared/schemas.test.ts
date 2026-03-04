import { describe, expect, it } from "vitest";

import {
  createIssueSchema,
  loginSchema,
  signupSchema,
  createRequestSchema,
  issueReorderSchema,
  updateSettingsSchema,
} from "./schemas";

describe("schemas", () => {
  it("validates issue creation payload", () => {
    const parsed = createIssueSchema.parse({
      orgId: "org-acme",
      repoId: "repo-web",
      title: "새 이슈",
      description: "설명",
      createdBy: "user-owner",
    });

    expect(parsed.status).toBe("backlog");
    expect(parsed.priority).toBe("medium");
  });

  it("rejects invalid request payload", () => {
    expect(() =>
      createRequestSchema.parse({
        orgId: "org-acme",
        fromUserId: "user-owner",
        toUserId: "user-jordan",
        type: "review",
        message: "짧음",
        fromDate: "",
        toDate: "",
      })
    ).toThrow();
  });

  it("accepts board reorder buckets", () => {
    const parsed = issueReorderSchema.parse({
      orgId: "org-acme",
      repoId: "repo-web",
      buckets: {
        backlog: ["ISS-1"],
        in_progress: [],
        review: [],
        done: [],
      },
    });

    expect(parsed.buckets.backlog).toContain("ISS-1");
  });

  it("rejects empty settings patch", () => {
    expect(() => updateSettingsSchema.parse({})).toThrow();
  });

  it("validates login payload with email and password", () => {
    expect(() =>
      loginSchema.parse({
        email: "owner@example.com",
        password: "password123",
      })
    ).not.toThrow();
  });

  it("validates signup payload with name, email and password", () => {
    expect(() =>
      signupSchema.parse({
        name: "김오너",
        email: "owner@example.com",
        password: "password123",
      })
    ).not.toThrow();
  });
});
