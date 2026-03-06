import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProtectedSessionBoundary } from "./protected-session-boundary";
import { useSessionQuery } from "@/features/auth/queries";
import type { ApiError } from "@/lib/api/backend-client";

const mockReplace = vi.fn();
const mockPathname = vi.fn(() => "/orgs");
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@/features/auth/queries", () => ({
  useSessionQuery: vi.fn(),
}));

const mockedUseSessionQuery = vi.mocked(useSessionQuery);

function createApiError({
  message = "Unexpected failure",
  code,
  status = 500,
  requestId,
}: Partial<ApiError> = {}) {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.status = status;
  error.requestId = requestId;
  return error;
}

describe("ProtectedSessionBoundary", () => {
  afterEach(() => {
    mockReplace.mockReset();
    mockPathname.mockReset();
    mockSearchParams.mockReset();
    mockPathname.mockReturnValue("/orgs");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockedUseSessionQuery.mockReset();
    document.cookie = "auth_session=; Path=/; Max-Age=0; SameSite=Lax";
  });

  it("renders children when the session has a user", () => {
    mockedUseSessionQuery.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "홍길동",
          email: "hong@example.com",
          role: "user",
        },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useSessionQuery>);

    render(
      <ProtectedSessionBoundary>
        <div>secure content</div>
      </ProtectedSessionBoundary>
    );

    expect(screen.getByText("secure content")).toBeInTheDocument();
  });

  it("redirects to login and clears the helper cookie when session user is null", async () => {
    document.cookie = "auth_session=active; Path=/; SameSite=Lax";
    mockPathname.mockReturnValue("/requests");
    mockSearchParams.mockReturnValue(new URLSearchParams("orgId=org-1"));
    mockedUseSessionQuery.mockReturnValue({
      data: { user: null },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useSessionQuery>);

    render(
      <ProtectedSessionBoundary>
        <div>secure content</div>
      </ProtectedSessionBoundary>
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?redirectedFrom=%2Frequests%3ForgId%3Dorg-1")
    );
    expect(document.cookie).not.toContain("auth_session=");
  });

  it("redirects to login when the session query returns an unauthorized error", async () => {
    document.cookie = "auth_session=active; Path=/; SameSite=Lax";
    mockPathname.mockReturnValue("/board");
    mockedUseSessionQuery.mockReturnValue({
      data: undefined,
      error: createApiError({
        message: "Session expired.",
        code: "UNAUTHORIZED",
        status: 401,
      }),
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useSessionQuery>);

    render(
      <ProtectedSessionBoundary>
        <div>secure content</div>
      </ProtectedSessionBoundary>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login?redirectedFrom=%2Fboard"));
  });

  it("shows a retry state for non-auth session errors", () => {
    const refetch = vi.fn();
    mockedUseSessionQuery.mockReturnValue({
      data: undefined,
      error: createApiError({
        message: "Session service is unavailable.",
        status: 503,
      }),
      isPending: false,
      isError: true,
      refetch,
    } as ReturnType<typeof useSessionQuery>);

    render(
      <ProtectedSessionBoundary>
        <div>secure content</div>
      </ProtectedSessionBoundary>
    );

    expect(screen.getByText("세션 상태를 확인하지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("Session service is unavailable.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalled();
  });
});
