import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KanbanBoard } from "./kanban-board";
import { useReorderIssuesMutation } from "@/features/issues/mutations";
import type { Issue } from "@/features/shared/types";

const mockInvalidateQueries = vi.fn();
const mockMutate = vi.fn();
let capturedOnDragEnd: ((event: { active: { id: string }; over: { id: string } }) => void) | null = null;
let capturedMutationHandlers: Record<string, ((...args: unknown[]) => void) | undefined> = {};

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: typeof capturedOnDragEnd }) => {
    capturedOnDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
  PointerSensor: function PointerSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  arrayMove: (items: unknown[], from: number, to: number) => {
    const nextItems = [...items];
    const [moved] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, moved);
    return nextItems;
  },
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/features/issues/mutations", () => ({
  useReorderIssuesMutation: vi.fn(),
}));

const mockedUseReorderIssuesMutation = vi.mocked(useReorderIssuesMutation);

const issues: Issue[] = [
  {
    id: "ISS-1",
    orgId: "org-1",
    repoId: "repo-1",
    title: "로그인 오류 수정",
    description: "",
    status: "backlog",
    assigneeId: "user-1",
    labelIds: [],
    priority: "high",
    dueDate: undefined,
    estimatePoints: 3,
    difficultyScore: 40,
    impactScore: 50,
    createdBy: "user-1",
    createdAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-03-06T00:00:00.000Z",
    order: 1,
  },
];

function getColumn(title: string) {
  const heading = screen.getByRole("heading", { name: new RegExp(`^${title}`) });
  const card = heading.closest("div.rounded-xl.border.border-border.bg-card.text-card-foreground");
  if (!card) {
    throw new Error(`Column ${title} not found`);
  }
  return card;
}

describe("KanbanBoard", () => {
  beforeEach(() => {
    capturedOnDragEnd = null;
    capturedMutationHandlers = {};
    mockInvalidateQueries.mockReset();
    mockMutate.mockReset();
    mockedUseReorderIssuesMutation.mockReturnValue({
      mutate: mockMutate,
    } as ReturnType<typeof useReorderIssuesMutation>);
    mockMutate.mockImplementation((_payload, handlers) => {
      capturedMutationHandlers = handlers as Record<string, ((...args: unknown[]) => void) | undefined>;
    });
  });

  it("rolls back the optimistic board state when saving fails", () => {
    render(<KanbanBoard orgId="org-1" repoId="repo-1" issues={issues} />);

    expect(within(getColumn("Backlog")).getByText("ISS-1")).toBeInTheDocument();

    act(() => {
      capturedOnDragEnd?.({
        active: { id: "ISS-1" },
        over: { id: "done" },
      });
    });

    expect(within(getColumn("Done")).getByText("ISS-1")).toBeInTheDocument();

    act(() => {
      capturedMutationHandlers.onError?.(new Error("save failed"));
    });

    expect(within(getColumn("Backlog")).getByText("ISS-1")).toBeInTheDocument();
  });

  it("refetches issue queries after the reorder request settles", () => {
    render(<KanbanBoard orgId="org-1" repoId="repo-1" issues={issues} />);

    act(() => {
      capturedOnDragEnd?.({
        active: { id: "ISS-1" },
        over: { id: "done" },
      });
    });

    act(() => {
      capturedMutationHandlers.onSettled?.();
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["issues"] });
  });
});
