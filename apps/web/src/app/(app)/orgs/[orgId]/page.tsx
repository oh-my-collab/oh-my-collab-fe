"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useOrganizationQuery } from "@/features/orgs/queries";
import { useRepositoriesByOrgQuery } from "@/features/repos/queries";
import { useIssuesQuery } from "@/features/issues/queries";
import { useUiStore } from "@/features/shared/ui-store";
import { getApiErrorDescription } from "@/lib/api/error";

export default function OrgDashboardPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;

  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);

  useEffect(() => {
    if (orgId) setActiveOrgId(orgId);
  }, [orgId, setActiveOrgId]);

  const orgQuery = useOrganizationQuery(orgId);
  const reposQuery = useRepositoriesByOrgQuery(orgId);
  const issuesQuery = useIssuesQuery({ orgId });

  if (orgQuery.isLoading || reposQuery.isLoading || issuesQuery.isLoading) {
    return <TableSkeleton />;
  }

  if (orgQuery.isError || reposQuery.isError || issuesQuery.isError) {
    const sourceError = orgQuery.error ?? reposQuery.error ?? issuesQuery.error;
    return (
      <ErrorState
        title="조직 대시보드를 불러오지 못했습니다"
        description={getApiErrorDescription(sourceError, "잠시 후 다시 시도해 주세요.")}
      />
    );
  }

  const summary = orgQuery.data?.summary;
  const repos = reposQuery.data?.repositories ?? [];
  const issues = issuesQuery.data?.issues ?? [];

  if (!orgQuery.data?.organization) {
    return (
      <EmptyState title="조직을 찾을 수 없습니다" description="다른 조직을 선택해 주세요." />
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Organization Dashboard</p>
        <h2 className="text-2xl font-bold">{orgQuery.data.organization.name}</h2>
        <p className="text-sm text-muted-foreground">레포 상태, 활동량, 오픈 이슈를 요약합니다.</p>
      </header>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs">레포 수</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.repositoryCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs">오픈 이슈</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.openIssueCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs">진행 중</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.inProgressCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs">주간 커밋</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.weeklyCommits}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs">주간 머지</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.weeklyMerges}</p></CardContent></Card>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>레포 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {repos.map((repo) => (
              <article key={repo.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{repo.name}</p>
                    <p className="text-xs text-muted-foreground">{repo.description}</p>
                  </div>
                  <Badge variant="secondary">활동 {repo.activityScore}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>오픈 이슈 {repo.openIssueCount}</span>
                  <span>커밋 {repo.weeklyCommits}</span>
                  <span>머지 {repo.weeklyMerges}</span>
                </div>
                <div className="mt-3">
                  <Link href={`/orgs/${orgId}/repos/${repo.id}`} className="text-sm font-medium text-primary hover:underline">
                    레포 상세 보기
                  </Link>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 오픈 이슈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues
              .filter((issue) => issue.status !== "done")
              .slice(0, 8)
              .map((issue) => (
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
      </div>
    </section>
  );
}
