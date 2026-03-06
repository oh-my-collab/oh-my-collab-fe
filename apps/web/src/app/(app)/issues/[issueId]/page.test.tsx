import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import IssueDetailPage from "./page";
import { useIssueQuery } from "@/features/issues/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";

vi.mock("next/navigation", () => ({
  useParams: () => ({ issueId: "ISS-1" }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/issues/ISS-1",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/features/issues/queries", () => ({
  useIssueQuery: vi.fn(),
}));

vi.mock("@/features/orgs/queries", () => ({
  useOrganizationsQuery: vi.fn(),
}));

vi.mock("@/features/shared/ui-store", () => ({
  useUiStore: (selector: (state: unknown) => unknown) =>
    selector({
      activeOrgId: "org-store",
      activeRepoId: "repo-store",
      setActiveOrgId: vi.fn(),
      setActiveRepoId: vi.fn(),
    }),
}));

const mockedUseIssueQuery = vi.mocked(useIssueQuery);
const mockedUseOrganizationsQuery = vi.mocked(useOrganizationsQuery);

describe("IssueDetailPage", () => {
  it("shows recovery links when orgId is missing from the URL", () => {
    mockedUseIssueQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useIssueQuery>);
    mockedUseOrganizationsQuery.mockReturnValue({
      data: {
        defaultOrgId: "org-store",
        organizations: [
          { id: "org-store", name: "스토어 조직" },
          { id: "org-2", name: "백업 조직" },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOrganizationsQuery>);

    render(<IssueDetailPage />);

    expect(screen.getByText("조직을 선택해 이슈를 다시 열어 주세요")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "현재 선택한 조직으로 다시 열기" })
    ).toHaveAttribute("href", "/issues/ISS-1?orgId=org-store");
    expect(screen.getByRole("link", { name: "스토어 조직에서 열기" })).toHaveAttribute(
      "href",
      "/issues/ISS-1?orgId=org-store"
    );
    expect(screen.getByRole("link", { name: "백업 조직에서 열기" })).toHaveAttribute(
      "href",
      "/issues/ISS-1?orgId=org-2"
    );
  });
});
