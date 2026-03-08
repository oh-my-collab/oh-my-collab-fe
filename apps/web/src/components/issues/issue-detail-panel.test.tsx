import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IssueDetailPanel } from "./issue-detail-panel";

vi.mock("@/features/issues/mutations", () => ({
  useUpdateIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("IssueDetailPanel", () => {
  it("renders read-only guidance for mirrored GitHub issues", () => {
    render(
      <IssueDetailPanel
        orgId="org-1"
        issue={{
          id: "GH-101",
          orgId: "org-1",
          repoId: "repo-1",
          title: "동기화된 GitHub 이슈",
          description: "설명",
          readOnly: true,
          sourceUrl: "https://github.com/example/repo/issues/101",
          status: "backlog",
          labelIds: [],
          priority: "medium",
          estimatePoints: 3,
          difficultyScore: 50,
          impactScore: 50,
          createdBy: "user-1",
          createdAt: "2026-03-08T00:00:00.000Z",
          updatedAt: "2026-03-08T00:00:00.000Z",
          order: 1,
        }}
        comments={[]}
      />,
    );

    expect(screen.getByText("GitHub 미러 이슈는 앱에서 직접 수정할 수 없습니다. 상태와 우선순위 운영은 계획 보드에서, 원본 수정은 GitHub에서 진행하세요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub 원본 열기" })).toHaveAttribute("href", "https://github.com/example/repo/issues/101");
  });
});
