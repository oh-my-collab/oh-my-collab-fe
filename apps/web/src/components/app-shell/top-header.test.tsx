import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TopHeader } from "./top-header";
import { useSessionQuery } from "@/features/auth/queries";

vi.mock("next/navigation", () => ({
  usePathname: () => "/orgs",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/features/notifications/queries", () => ({
  useNotificationsQuery: () => ({ data: { notifications: [] } }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/shared/ui-store", () => ({
  useUiStore: (selector: (state: unknown) => unknown) =>
    selector({
      activeOrgId: "org-1",
      activeRepoId: null,
      issueSearch: "",
      setIssueSearch: vi.fn(),
    }),
}));

vi.mock("@/features/auth/queries", () => ({
  useSessionQuery: vi.fn(),
}));

const mockedUseSessionQuery = vi.mocked(useSessionQuery);

describe("TopHeader", () => {
  it("shows current user name and non-owner role from session", () => {
    mockedUseSessionQuery.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "홍길동",
          email: "hong@example.com",
          role: "user",
        },
      },
    } as ReturnType<typeof useSessionQuery>);

    render(<TopHeader />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("사용자")).toBeInTheDocument();
  });

  it("renders a clickable profile entry", () => {
    mockedUseSessionQuery.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "홍길동",
          email: "hong@example.com",
          role: "user",
        },
      },
    } as ReturnType<typeof useSessionQuery>);

    render(<TopHeader />);

    const profileLinks = screen.getAllByRole("link", { name: "프로필" });
    expect(profileLinks[0]).toHaveAttribute("href", "/settings?orgId=org-1");
  });
});
