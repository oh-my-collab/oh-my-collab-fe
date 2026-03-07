import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LandingPage from "@/app/(public)/page";
import LoginPage from "@/app/(public)/login/page";
import SignupPage from "@/app/(public)/signup/page";
import { useLoginMutation, useSessionQuery, useSignupMutation } from "@/features/auth/queries";

const { navigation, notifications } = vi.hoisted(() => {
  let currentSearchParams = new URLSearchParams();

  return {
    navigation: {
      router: {
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
      },
      getSearchParams: () => currentSearchParams,
      setSearchParams: (value = "") => {
        currentSearchParams = new URLSearchParams(value);
      },
    },
    notifications: {
      toast: {
        success: vi.fn(),
        error: vi.fn(),
      },
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.getSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: notifications.toast,
}));

vi.mock("@/features/auth/queries", () => ({
  useSessionQuery: vi.fn(),
  useLoginMutation: vi.fn(),
  useSignupMutation: vi.fn(),
}));

const mockedUseSessionQuery = vi.mocked(useSessionQuery);
const mockedUseLoginMutation = vi.mocked(useLoginMutation);
const mockedUseSignupMutation = vi.mocked(useSignupMutation);

function mockSessionQuery(options?: {
  user?: { id: string; name: string; email: string; role: "owner" | "user" } | null;
  isError?: boolean;
  error?: Error | null;
}) {
  mockedUseSessionQuery.mockReturnValue({
    data: options?.user === undefined ? { user: null } : { user: options.user },
    isError: options?.isError ?? false,
    error: options?.error ?? null,
  } as ReturnType<typeof useSessionQuery>);
}

describe("public entry pages", () => {
  beforeEach(() => {
    cleanup();
    navigation.setSearchParams();
    navigation.router.push.mockReset();
    navigation.router.replace.mockReset();
    navigation.router.refresh.mockReset();
    notifications.toast.success.mockReset();
    notifications.toast.error.mockReset();
    mockedUseLoginMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
      isPending: false,
    } as ReturnType<typeof useLoginMutation>);
    mockedUseSignupMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
      isPending: false,
    } as ReturnType<typeof useSignupMutation>);
    mockSessionQuery();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows direct login and signup CTAs on the landing page", () => {
    render(<LandingPage />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "시작하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "리포트 미리보기" })).not.toBeInTheDocument();
  });

  it("preserves redirectedFrom on the login page and redirects there after login", async () => {
    navigation.setSearchParams("redirectedFrom=%2Freports");
    const mutateAsync = vi.fn().mockResolvedValue({ user: { id: "user-1" } });
    mockedUseLoginMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useLoginMutation>);

    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute(
      "href",
      "/signup?redirectedFrom=%2Freports"
    );

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "owner@example.com",
        password: "password123",
      })
    );
    await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith("/reports"));
    expect(navigation.router.refresh).toHaveBeenCalled();
  });

  it("shows a non-blocking notice when the login session check fails", () => {
    mockSessionQuery({
      isError: true,
      error: new Error("NETWORK_DOWN"),
    });

    render(<LoginPage />);

    expect(
      screen.getByText("세션을 확인하지 못했습니다. 로그인은 계속 진행할 수 있습니다.")
    ).toBeInTheDocument();
  });

  it("preserves redirectedFrom on the signup page and redirects there after signup", async () => {
    navigation.setSearchParams("redirectedFrom=%2Fissues");
    const mutateAsync = vi.fn().mockResolvedValue({ user: { id: "user-1" } });
    mockedUseSignupMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useSignupMutation>);

    render(<SignupPage />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login?redirectedFrom=%2Fissues"
    );

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "김오너" } });
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "김오너",
        email: "owner@example.com",
        password: "password123",
      })
    );
    await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith("/issues"));
    expect(navigation.router.refresh).toHaveBeenCalled();
  });

  it("redirects already authenticated visitors to their intended page", async () => {
    navigation.setSearchParams("redirectedFrom=%2Freports");
    mockSessionQuery({
      user: {
        id: "user-1",
        name: "김오너",
        email: "owner@example.com",
        role: "owner",
      },
    });

    render(<LoginPage />);

    await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith("/reports"));
  });
});
