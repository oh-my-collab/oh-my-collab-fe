"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/reports/chart-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useRepositoryActivityQuery, useRepositoryQuery } from "@/features/repos/queries";
import { useIssuesQuery } from "@/features/issues/queries";
import { getApiErrorDescription } from "@/lib/api/error";

export default function RepoDetailPage() {
  const params = useParams<{ orgId: string; repoId: string }>();
  const orgId = params.orgId;
  const repoId = params.repoId;

  const repoQuery = useRepositoryQuery(orgId, repoId);
  const activityQuery = useRepositoryActivityQuery(orgId, repoId);
  const issuesQuery = useIssuesQuery({ orgId, repoId });

  if (repoQuery.isLoading || activityQuery.isLoading || issuesQuery.isLoading) {
    return <TableSkeleton />;
  }

  if (repoQuery.isError || activityQuery.isError || issuesQuery.isError) {
    const sourceError = repoQuery.error ?? activityQuery.error ?? issuesQuery.error;
    return (
      <ErrorState
        title="레포 정보를 불러오지 못했습니다"
        description={getApiErrorDescription(sourceError, "잠시 후 다시 시도해 주세요.")}
      />
    );
  }

  const repository = repoQuery.data?.repository;
  if (!repository) {
    return <EmptyState title="레포를 찾을 수 없습니다" description="경로를 확인해 주세요." />;
  }

  const chartData = (activityQuery.data?.activity ?? []).map((point) => ({
    date: point.date.slice(5),
    created: point.commits,
    completed: point.merges,
  }));

  const issues = issuesQuery.data?.issues ?? [];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Repository</p>
        <h2 className="text-2xl font-bold">{repository.name}</h2>
        <p className="text-sm text-muted-foreground">{repository.description}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs">오픈 이슈</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{repoQuery.data?.summary.openIssueCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs">완료 이슈</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{repoQuery.data?.summary.doneIssueCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs">높은 우선순위</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{repoQuery.data?.summary.highPriorityCount}</p></CardContent></Card>
      </div>

      <ChartCard title="커밋/머지 추이" data={chartData} />

      <Card>
        <CardHeader>
          <CardTitle>레포 이슈</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}?orgId=${orgId}`}
              className="block rounded-md border border-border p-2 hover:bg-muted/40"
            >
              <p className="text-sm font-semibold">{issue.id} · {issue.title}</p>
              <p className="text-xs text-muted-foreground">{issue.status} · {issue.priority}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
