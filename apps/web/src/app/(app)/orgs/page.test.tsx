import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrgsPage from "./page";
import { useCreateOrganizationMutation, useOrganizationsQuery } from "@/features/orgs/queries";

const {
  mockPush,
  mockMutateAsync,
  mockRefetch,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockMutateAsync: vi.fn(),
  mockRefetch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock("@/features/orgs/queries", () => ({
  useOrganizationsQuery: vi.fn(),
  useCreateOrganizationMutation: vi.fn(),
}));

const mockedUseOrganizationsQuery = vi.mocked(useOrganizationsQuery);
const mockedUseCreateOrganizationMutation = vi.mocked(useCreateOrganizationMutation);

describe("OrgsPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockMutateAsync.mockReset();
    mockRefetch.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();

    mockedUseOrganizationsQuery.mockReturnValue({
      data: { organizations: [], defaultOrgId: undefined },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      error: null,
    } as ReturnType<typeof useOrganizationsQuery>);

    mockedUseCreateOrganizationMutation.mockReturnValue({
      isPending: false,
      mutateAsync: mockMutateAsync,
    } as ReturnType<typeof useCreateOrganizationMutation>);
  });

  afterEach(() => {
    cleanup();
  });

  it("connects a GitHub organization from a slug or URL and redirects to the org dashboard", async () => {
    mockMutateAsync.mockResolvedValue({
      organization: { id: "org-acme" },
    });

    render(<OrgsPage />);

    expect(screen.getByRole("heading", { name: "연결된 GitHub 조직" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("GitHub 조직 slug"), {
      target: { value: "https://github.com/acme-platform/" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "GitHub 조직 연결" })[0]);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith("acme-platform");
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/orgs/org-acme");
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("GitHub 조직을 연결했습니다.");
  });
});
