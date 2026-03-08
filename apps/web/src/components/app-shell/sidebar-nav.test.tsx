import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarNav } from "./sidebar-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/calendar",
}));

describe("SidebarNav", () => {
  it("renders the calendar route and OH-MY-COLLAB workflow copy", () => {
    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "일정" })).toHaveAttribute("href", "/calendar");
    expect(screen.getByText("GitHub 이슈는 읽기 전용으로 조회")).toBeInTheDocument();
  });
});
