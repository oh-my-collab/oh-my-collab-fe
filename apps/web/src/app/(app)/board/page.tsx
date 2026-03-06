"use client";

import { KanbanBoard } from "@/components/board/kanban-board";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useIssuesQuery } from "@/features/issues/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useResolvedContext } from "@/features/shared/use-resolved-context";
import { getApiErrorDescription } from "@/lib/api/error";

export default function BoardPage() {
  const orgQuery = useOrganizationsQuery();
  const resolvedContext = useResolvedContext({
    defaultOrgId: orgQuery.data?.defaultOrgId,
    includeRepoIdInQuery: true,
  });

  const query = useIssuesQuery({
    orgId: resolvedContext.orgId ?? undefined,
    repoId: resolvedContext.repoId ?? undefined,
  });

  if (orgQuery.isLoading || (resolvedContext.orgId && query.isLoading)) {
    return <TableSkeleton rows={5} />;
  }

  if (orgQuery.isError || query.isError) {
    const sourceError = orgQuery.error ?? query.error;
    return (
      <ErrorState
        title="보드를 불러오지 못했습니다"
        description={getApiErrorDescription(sourceError, "조직과 레포 선택 상태를 확인해 주세요.")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (!resolvedContext.orgId || !resolvedContext.repoId) {
    return (
      <EmptyState
        title="조직과 레포를 선택해 주세요"
        description="현재 URL에 작업 범위가 잡히면 보드가 바로 열립니다."
      />
    );
  }

  const issues = query.data?.issues ?? [];

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Board</p>
        <h2 className="text-2xl font-bold">칸반 보드</h2>
        <p className="text-sm text-muted-foreground">카드를 드래그해 상태를 변경하세요.</p>
      </header>

      <KanbanBoard orgId={resolvedContext.orgId} repoId={resolvedContext.repoId} issues={issues} />
    </section>
  );
}
