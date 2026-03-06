import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TopHeader } from "./top-header";
import { useSessionQuery } from "@/features/auth/queries";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/queries";

const mockPush = vi.fn();
const mockSetTheme = vi.fn();
const mockSetIssueSearch = vi.fn();
const mockMarkRead = vi.fn();
const mockRefetchNotifications = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports",
  useSearchParams: () => new URLSearchParams("orgId=org-1"),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: mockSetTheme }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/features/shared/ui-store", () => ({
  useUiStore: (selector: (state: unknown) => unknown) =>
    selector({
      activeOrgId: "org-1",
      activeRepoId: null,
      issueSearch: "",
      setIssueSearch: mockSetIssueSearch,
    }),
}));

vi.mock("@/features/auth/queries", () => ({
  useSessionQuery: vi.fn(),
}));

vi.mock("@/features/notifications/queries", () => ({
  useNotificationsQuery: vi.fn(),
  useMarkNotificationReadMutation: vi.fn(),
}));

const mockedUseSessionQuery = vi.mocked(useSessionQuery);
const mockedUseNotificationsQuery = vi.mocked(useNotificationsQuery);
const mockedUseMarkNotificationReadMutation = vi.mocked(useMarkNotificationReadMutation);

afterEach(() => {
  cleanup();
});

describe("TopHeader", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSetTheme.mockReset();
    mockSetIssueSearch.mockReset();
    mockMarkRead.mockReset();
    mockRefetchNotifications.mockReset();

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

    mockedUseNotificationsQuery.mockReturnValue({
      data: { notifications: [] },
      isError: false,
      refetch: mockRefetchNotifications,
    } as ReturnType<typeof useNotificationsQuery>);

    mockedUseMarkNotificationReadMutation.mockReturnValue({
      mutate: mockMarkRead,
    } as ReturnType<typeof useMarkNotificationReadMutation>);
  });

  it("shows current user name and non-owner role from session", () => {
    render(<TopHeader />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("사용자")).toBeInTheDocument();
  });

  it("renders a clickable profile entry", () => {
    render(<TopHeader />);

    const profileLinks = screen.getAllByRole("link", { name: "프로필" });
    expect(profileLinks[0]).toHaveAttribute("href", "/settings?orgId=org-1");
  });

  it("shows an explicit error state and retry action when notifications fail", () => {
    mockedUseNotificationsQuery.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: mockRefetchNotifications,
    } as ReturnType<typeof useNotificationsQuery>);

    render(<TopHeader />);

    expect(screen.getByText("알림을 불러오지 못했습니다")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "알림 다시 시도" }));
    expect(mockRefetchNotifications).toHaveBeenCalled();
  });
});
