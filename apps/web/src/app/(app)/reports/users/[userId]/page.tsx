"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { InsightPanel } from "@/components/reports/insight-panel";
import { ReportKpiCards } from "@/components/reports/report-kpi-cards";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useUserReportQuery } from "@/features/reports/queries";
import { useResolvedContext } from "@/features/shared/use-resolved-context";
import { getApiErrorDescription } from "@/lib/api/error";

export default function UserReportPage() {
  const params = useParams<{ userId: string }>();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const orgQuery = useOrganizationsQuery();
  const resolvedContext = useResolvedContext({
    defaultOrgId: orgQuery.data?.defaultOrgId,
  });

  const reportQuery = useUserReportQuery(resolvedContext.orgId ?? "", params.userId, period);

  if (orgQuery.isLoading || (resolvedContext.orgId && reportQuery.isLoading)) {
    return <TableSkeleton rows={4} />;
  }

  if (orgQuery.isError || reportQuery.isError || (resolvedContext.orgId && !reportQuery.data?.report)) {
    const sourceError = orgQuery.error ?? reportQuery.error;
    return (
      <ErrorState
        title="유저 리포트를 불러오지 못했습니다"
        description={getApiErrorDescription(sourceError, "조직 또는 유저를 확인해 주세요.")}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  if (!resolvedContext.orgId || !reportQuery.data?.report) {
    return (
      <ErrorState
        title="조직 컨텍스트가 필요합니다"
        description="URL에 조직이 포함되면 유저 드릴다운 리포트가 복구됩니다."
      />
    );
  }

  const report = reportQuery.data.report;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">User Drill-down</p>
        <h2 className="text-2xl font-bold">{report.userName} 리포트</h2>
        <p className="text-sm text-muted-foreground">{report.summary}</p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm ${period === "week" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          onClick={() => setPeriod("week")}
        >
          이번 주
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm ${period === "month" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          onClick={() => setPeriod("month")}
        >
          이번 달
        </button>
      </div>

      <ReportKpiCards
        totalTasks={report.taskCount}
        completedTasks={report.completedTaskCount}
        avgDifficulty={report.avgDifficulty}
      />

      <Card>
        <CardHeader>
          <CardTitle>레포별 기여</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {report.byRepo.map((item) => (
            <div key={item.repoId} className="flex items-center justify-between rounded-md border border-border p-2">
              <div>
                <p className="text-sm font-semibold">{item.repoName}</p>
                <p className="text-xs text-muted-foreground">작업 {item.taskCount}건</p>
              </div>
              <Badge variant={item.difficultyAvg >= 70 ? "warn" : "secondary"}>
                난이도 {item.difficultyAvg}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 이슈</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {report.recentIssues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}?orgId=${resolvedContext.orgId}`}
              className="block rounded-md border border-border p-2 transition hover:bg-muted"
            >
              <p className="text-sm font-semibold">{issue.id} · {issue.title}</p>
              <p className="text-xs text-muted-foreground">{issue.status} · {issue.priority}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <InsightPanel evidence={report.evidence} risks={report.risks} nextActions={report.nextActions} />
    </section>
  );
}
