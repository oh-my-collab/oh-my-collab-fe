"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReorderIssuesMutation } from "@/features/issues/mutations";
import type { Issue } from "@/features/shared/types";
import type { ApiError } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

type Status = Issue["status"];
type Buckets = Record<Status, Issue[]>;

const STATUS_LIST: Status[] = ["backlog", "in_progress", "review", "done"];

const STATUS_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

function groupIssues(issues: Issue[]): Buckets {
  return {
    backlog: issues.filter((issue) => issue.status === "backlog"),
    in_progress: issues.filter((issue) => issue.status === "in_progress"),
    review: issues.filter((issue) => issue.status === "review"),
    done: issues.filter((issue) => issue.status === "done"),
  };
}

function serializeBuckets(buckets: Buckets) {
  return {
    backlog: buckets.backlog.map((item) => item.id),
    in_progress: buckets.in_progress.map((item) => item.id),
    review: buckets.review.map((item) => item.id),
    done: buckets.done.map((item) => item.id),
  };
}

function findStatusByIssueId(buckets: Buckets, issueId: string) {
  return STATUS_LIST.find((status) => buckets[status].some((issue) => issue.id === issueId));
}

function extractLatestIssue(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const apiError = error as ApiError;
  const latestIssue = (apiError.issues as { latestIssue?: Issue } | undefined)?.latestIssue;
  if (!latestIssue) {
    return null;
  }

  return latestIssue;
}

function syncLatestIssue(previousBuckets: Buckets, latestIssue: Issue) {
  const remainingIssues = STATUS_LIST.flatMap((status) => previousBuckets[status]).filter(
    (issue) => issue.id !== latestIssue.id
  );
  return groupIssues([...remainingIssues, latestIssue]);
}

function SortableIssueCard({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-md border border-border bg-card p-3 ${isDragging ? "opacity-70" : ""}`}
      {...attributes}
      {...listeners}
      aria-label={`${issue.id} ${issue.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{issue.id}</p>
        <Badge variant={issue.priority === "urgent" ? "danger" : issue.priority === "high" ? "warn" : "secondary"}>
          {issue.priority}
        </Badge>
      </div>
      <p className="mt-1 text-sm font-semibold">{issue.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">담당: {issue.assigneeId ?? "미지정"}</p>
    </article>
  );
}

export function KanbanBoard({
  orgId,
  repoId,
  issues,
}: {
  orgId: string;
  repoId: string;
  issues: Issue[];
}) {
  const [buckets, setBuckets] = useState<Buckets>(groupIssues(issues));
  const reorderMutation = useReorderIssuesMutation(orgId, repoId);
  const queryClient = useQueryClient();

  useEffect(() => {
    setBuckets(groupIssues(issues));
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const issueIds = useMemo(() => {
    const map = new Map<string, Issue>();
    issues.forEach((issue) => map.set(issue.id, issue));
    return map;
  }, [issues]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const fromStatus = findStatusByIssueId(buckets, activeId);
    const toStatus =
      findStatusByIssueId(buckets, overId) ??
      (STATUS_LIST.includes(overId as Status) ? (overId as Status) : undefined);

    if (!fromStatus || !toStatus) return;

    const previousBuckets = buckets;
    const fromItems = [...buckets[fromStatus]];
    const activeIndex = fromItems.findIndex((issue) => issue.id === activeId);
    if (activeIndex < 0) return;

    const movingIssue = fromItems[activeIndex];

    if (fromStatus === toStatus) {
      const toIndex = fromItems.findIndex((issue) => issue.id === overId);
      if (toIndex < 0) return;

      const nextItems = arrayMove(fromItems, activeIndex, toIndex);
      const nextBuckets = {
        ...buckets,
        [fromStatus]: nextItems,
      };

      setBuckets(nextBuckets);
      reorderMutation.mutate(serializeBuckets(nextBuckets), {
        onError: () => {
          setBuckets(previousBuckets);
          toast.error("보드 순서 저장에 실패했습니다.");
        },
        onSettled: () => {
          void queryClient.invalidateQueries({ queryKey: ["issues"] });
          void queryClient.invalidateQueries({ queryKey: queryKeys.repo(orgId, repoId) });
        },
      });
      return;
    }

    fromItems.splice(activeIndex, 1);

    const toItems = [...buckets[toStatus]];
    const targetIndex = toItems.findIndex((issue) => issue.id === overId);
    const insertIndex = targetIndex < 0 ? toItems.length : targetIndex;

    toItems.splice(insertIndex, 0, {
      ...movingIssue,
      status: toStatus,
    });

    const nextBuckets = {
      ...buckets,
      [fromStatus]: fromItems,
      [toStatus]: toItems,
    };

    setBuckets(nextBuckets);

    reorderMutation.mutate(serializeBuckets(nextBuckets), {
      onSuccess: () => toast.success("이슈 상태를 업데이트했습니다."),
      onError: (error) => {
        const apiError = error as ApiError;
        const latestIssue = extractLatestIssue(error);

        if (apiError.code === "VERSION_CONFLICT" && latestIssue) {
          setBuckets(syncLatestIssue(previousBuckets, latestIssue));
          toast.error("최신 이슈 상태를 다시 반영했습니다.");
          return;
        }

        setBuckets(previousBuckets);
        toast.error("보드 업데이트에 실패했습니다.");
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: ["issues"] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.repo(orgId, repoId) });
      },
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4">
        {STATUS_LIST.map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{STATUS_LABEL[status]}</span>
                <Badge variant="secondary">{buckets[status].length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SortableContext
                items={buckets[status].map((issue) => issue.id)}
                strategy={verticalListSortingStrategy}
              >
                {buckets[status].map((issue) => (
                  <SortableIssueCard key={issue.id} issue={issueIds.get(issue.id) ?? issue} />
                ))}
              </SortableContext>
            </CardContent>
          </Card>
        ))}
      </div>
    </DndContext>
  );
}
