"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReorderPlanningTasksMutation } from "@/features/planning/mutations";
import type { PlanningTask } from "@/features/shared/types";
import { cn } from "@/lib/utils";

type Status = PlanningTask["status"];

const STATUS_LIST: Status[] = ["backlog", "in_progress", "review", "done"];

const STATUS_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

function groupTasks(tasks: PlanningTask[]) {
  return {
    backlog: tasks.filter((task) => task.status === "backlog"),
    in_progress: tasks.filter((task) => task.status === "in_progress"),
    review: tasks.filter((task) => task.status === "review"),
    done: tasks.filter((task) => task.status === "done"),
  } as Record<Status, PlanningTask[]>;
}

function findStatusByTaskId(buckets: Record<Status, PlanningTask[]>, taskId: string) {
  return STATUS_LIST.find((status) => buckets[status].some((task) => task.id === taskId));
}

function SortableTaskCard({ task }: { task: PlanningTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
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
      aria-label={`${task.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{task.repoId ? "repo-linked" : "org-wide"}</p>
        <Badge variant={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warn" : "secondary"}>
          {task.priority}
        </Badge>
      </div>
      <p className="mt-1 text-sm font-semibold">{task.title}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description || "설명 없음"}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {task.assigneeId ? <span>담당 {task.assigneeId}</span> : <span>담당 미지정</span>}
        {task.dueDate ? <span>마감 {task.dueDate.slice(0, 10)}</span> : null}
        {task.linkedIssueId ? <span>GitHub 이슈 연결</span> : null}
      </div>
    </article>
  );
}

function DroppableColumn({ status, tasks, taskMap }: { status: Status; tasks: PlanningTask[]; taskMap: Map<string, PlanningTask> }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Card id={status}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{STATUS_LABEL[status]}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className={cn("min-h-40 space-y-2 transition-colors", isOver && "bg-muted/20") }>
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={taskMap.get(task.id) ?? task} />
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ orgId, repoId, tasks }: { orgId: string; repoId?: string; tasks: PlanningTask[] }) {
  const [buckets, setBuckets] = useState<Record<Status, PlanningTask[]>>(groupTasks(tasks));
  const reorderMutation = useReorderPlanningTasksMutation(orgId, repoId);

  useEffect(() => {
    setBuckets(groupTasks(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const taskMap = useMemo(() => {
    const map = new Map<string, PlanningTask>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromStatus = findStatusByTaskId(buckets, activeId);
    const toStatus = findStatusByTaskId(buckets, overId) ?? (STATUS_LIST.includes(overId as Status) ? (overId as Status) : undefined);

    if (!fromStatus || !toStatus) return;

    const fromItems = [...buckets[fromStatus]];
    const activeIndex = fromItems.findIndex((task) => task.id === activeId);
    if (activeIndex < 0) return;

    const movingTask = fromItems[activeIndex];

    if (fromStatus === toStatus) {
      const toIndex = fromItems.findIndex((task) => task.id === overId);
      if (toIndex < 0) return;
      const nextItems = arrayMove(fromItems, activeIndex, toIndex);
      const nextBuckets = { ...buckets, [fromStatus]: nextItems };
      setBuckets(nextBuckets);
      reorderMutation.mutate(
        {
          repoId,
          backlog: nextBuckets.backlog.map((item) => item.id),
          in_progress: nextBuckets.in_progress.map((item) => item.id),
          review: nextBuckets.review.map((item) => item.id),
          done: nextBuckets.done.map((item) => item.id),
        },
        {
          onError: () => toast.error("보드 순서 저장에 실패했습니다."),
        }
      );
      return;
    }

    fromItems.splice(activeIndex, 1);
    const toItems = [...buckets[toStatus]];
    const targetIndex = toItems.findIndex((task) => task.id === overId);
    const insertIndex = targetIndex < 0 ? toItems.length : targetIndex;
    toItems.splice(insertIndex, 0, { ...movingTask, status: toStatus });

    const nextBuckets = {
      ...buckets,
      [fromStatus]: fromItems,
      [toStatus]: toItems,
    };

    setBuckets(nextBuckets);
    reorderMutation.mutate(
      {
        repoId,
        backlog: nextBuckets.backlog.map((item) => item.id),
        in_progress: nextBuckets.in_progress.map((item) => item.id),
        review: nextBuckets.review.map((item) => item.id),
        done: nextBuckets.done.map((item) => item.id),
      },
      {
        onSuccess: () => toast.success("작업 상태를 업데이트했습니다."),
        onError: () => toast.error("보드 업데이트에 실패했습니다."),
      }
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4">
        {STATUS_LIST.map((status) => (
          <DroppableColumn key={status} status={status} tasks={buckets[status]} taskMap={taskMap} />
        ))}
      </div>
    </DndContext>
  );
}