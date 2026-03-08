"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { KanbanBoard } from "@/components/board/kanban-board";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useIssuesQuery } from "@/features/issues/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useCreatePlanningTaskMutation } from "@/features/planning/mutations";
import { usePlanningTasksQuery } from "@/features/planning/queries";
import { useUiStore } from "@/features/shared/ui-store";
import { getApiErrorDescription } from "@/lib/api/error";

export default function BoardPage() {
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const activeRepoId = useUiStore((state) => state.activeRepoId);
  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);

  const orgQuery = useOrganizationsQuery();

  useEffect(() => {
    if (!activeOrgId && orgQuery.data?.defaultOrgId) {
      setActiveOrgId(orgQuery.data.defaultOrgId);
    }
  }, [activeOrgId, orgQuery.data?.defaultOrgId, setActiveOrgId]);

  const resolvedOrgId = activeOrgId ?? orgQuery.data?.defaultOrgId ?? "";
  const planningQuery = usePlanningTasksQuery(resolvedOrgId, activeRepoId ?? undefined);
  const issuesQuery = useIssuesQuery({ orgId: resolvedOrgId || undefined, repoId: activeRepoId ?? undefined, size: "50" });
  const createTaskMutation = useCreatePlanningTaskMutation(resolvedOrgId, activeRepoId ?? undefined);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [linkedIssueId, setLinkedIssueId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const users = planningQuery.data?.users ?? [];
  const issues = issuesQuery.data?.issues ?? [];
  const linkedIssueOptions = useMemo(() => issues.filter((issue) => issue.readOnly), [issues]);

  const onCreateTask = async () => {
    if (!resolvedOrgId || !title.trim()) {
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        repoId: activeRepoId ?? undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeId: assigneeId || undefined,
        linkedIssueId: linkedIssueId || undefined,
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setDescription("");
      setLinkedIssueId("");
      setDueDate("");
      toast.success("계획 작업을 추가했습니다.");
    } catch {
      toast.error("작업 추가에 실패했습니다.");
    }
  };

  if (planningQuery.isLoading) return <TableSkeleton rows={5} />;

  if (planningQuery.isError) {
    return (
      <ErrorState
        title="보드를 불러오지 못했습니다"
        description={getApiErrorDescription(planningQuery.error, "레포 선택 상태를 확인해 주세요.")}
      />
    );
  }

  if (!resolvedOrgId) {
    return <EmptyState title="조직을 먼저 연결해 주세요" description="GitHub 조직을 연결하면 계획 보드를 사용할 수 있습니다." />;
  }

  const tasks = planningQuery.data?.tasks ?? [];

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Planning Board</p>
        <h2 className="text-2xl font-bold">내부 계획 칸반</h2>
        <p className="text-sm text-muted-foreground">GitHub 이슈는 읽기 전용으로 참고하고, 실제 일정/우선순위 관리는 내부 작업 카드로 운영합니다.</p>
      </header>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 xl:grid-cols-[1.2fr_1fr_180px_180px_180px_160px_auto]">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="새 작업 제목" aria-label="새 작업 제목" />
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="설명 또는 실행 메모" aria-label="작업 설명" className="min-h-10" />
        <Select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="우선순위 선택">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </Select>
        <Select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} aria-label="담당자 선택">
          <option value="">담당 미지정</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </Select>
        <Select value={linkedIssueId} onChange={(event) => setLinkedIssueId(event.target.value)} aria-label="GitHub 이슈 연결">
          <option value="">이슈 연결 안 함</option>
          {linkedIssueOptions.map((issue) => (
            <option key={issue.issueId ?? issue.id} value={issue.issueId ?? issue.id}>{issue.id} · {issue.title}</option>
          ))}
        </Select>
        <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" aria-label="마감일" />
        <Button onClick={onCreateTask} disabled={createTaskMutation.isPending || !title.trim()}>
          {createTaskMutation.isPending ? "추가 중..." : "작업 추가"}
        </Button>
      </div>

      {!tasks.length ? (
        <EmptyState title="아직 계획 작업이 없습니다" description="GitHub 이슈를 참고해 내부 작업 카드를 만들고 칸반 흐름을 운영해 보세요." />
      ) : (
        <KanbanBoard orgId={resolvedOrgId} repoId={activeRepoId ?? undefined} tasks={tasks} />
      )}
    </section>
  );
}
