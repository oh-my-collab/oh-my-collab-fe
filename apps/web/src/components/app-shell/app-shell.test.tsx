import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";
import { useSessionQuery } from "@/features/auth/queries";

const navigation = vi.hoisted(() => ({
  router: {
    replace: vi.fn(),
  },
  pathname: "/issues",
  searchParams: new URLSearchParams("orgId=org-1"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("@/components/app-shell/org-repo-switcher", () => ({
  OrgRepoSwitcher: () => <div>OrgRepoSwitcher</div>,
}));

vi.mock("@/components/app-shell/sidebar-nav", () => ({
  SidebarNav: () => <div>SidebarNav</div>,
}));

vi.mock("@/components/app-shell/top-header", () => ({
  TopHeader: () => <div>TopHeader</div>,
}));

vi.mock("@/features/auth/queries", () => ({
  useSessionQuery: vi.fn(),
}));

const mockedUseSessionQuery = vi.mocked(useSessionQuery);

describe("AppShell", () => {
  beforeEach(() => {
    cleanup();
    navigation.router.replace.mockReset();
    mockedUseSessionQuery.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects unauthenticated visitors to login with the current location", async () => {
    mockedUseSessionQuery.mockReturnValue({
      data: { user: null },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useSessionQuery>);

    render(
      <AppShell>
        <div>보호된 화면</div>
      </AppShell>
    );

    await waitFor(() =>
      expect(navigation.router.replace).toHaveBeenCalledWith(
        "/login?redirectedFrom=%2Fissues%3ForgId%3Dorg-1"
      )
    );
  });

  it("renders protected children when the session exists", () => {
    mockedUseSessionQuery.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "홍길동",
          email: "hong@example.com",
          role: "owner",
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useSessionQuery>);

    render(
      <AppShell>
        <div>보호된 화면</div>
      </AppShell>
    );

    expect(screen.getByText("보호된 화면")).toBeInTheDocument();
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});