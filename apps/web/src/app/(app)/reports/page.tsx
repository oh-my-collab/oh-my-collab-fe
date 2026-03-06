"use client";

import Link from "next/link";
import { useState } from "react";

import { ChartCard } from "@/components/reports/chart-card";
import { InsightPanel } from "@/components/reports/insight-panel";
import { ReportKpiCards } from "@/components/reports/report-kpi-cards";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useTeamReportQuery } from "@/features/reports/queries";
import { useResolvedContext } from "@/features/shared/use-resolved-context";
import { getApiErrorDescription } from "@/lib/api/error";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const orgQuery = useOrganizationsQuery();
  const resolvedContext = useResolvedContext({
    defaultOrgId: orgQuery.data?.defaultOrgId,
  });

  const reportQuery = useTeamReportQuery(resolvedContext.orgId ?? "", period);

  if (orgQuery.isLoading || (resolvedContext.orgId && reportQuery.isLoading)) {
    return <TableSkeleton rows={5} />;
  }

  if (orgQuery.isError || reportQuery.isError || (resolvedContext.orgId && !reportQuery.data?.report)) {
    const sourceError = orgQuery.error ?? reportQuery.error;
    return (
      <ErrorState
        title="리포트를 불러오지 못했습니다"
        description={getApiErrorDescription(sourceError, "조직 선택 상태를 확인해 주세요.")}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  if (!resolvedContext.orgId || !reportQuery.data?.report) {
    return (
      <ErrorState
        title="조직 컨텍스트가 필요합니다"
        description="보고 싶은 조직을 선택하면 리포트가 같은 URL 기준으로 열립니다."
      />
    );
  }

  const report = reportQuery.data.report;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Owner Report</p>
        <h2 className="text-2xl font-bold">AI 기여도/난이도 리포트</h2>
        <p className="text-sm text-muted-foreground">한 화면에서 결론을 보고, 근거로 드릴다운할 수 있습니다.</p>
      </header>

      <div className="flex gap-2">
        <Button variant={period === "week" ? "default" : "outline"} onClick={() => setPeriod("week")}>이번 주</Button>
        <Button variant={period === "month" ? "default" : "outline"} onClick={() => setPeriod("month")}>이번 달</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>팀 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{report.summary}</p>
        </CardContent>
      </Card>

      <ReportKpiCards
        totalTasks={report.totalTasks}
        completedTasks={report.completedTasks}
        avgDifficulty={report.avgDifficulty}
      />

      <ChartCard title="작업 생성/완료 타임라인" data={report.timeline} />

      <Card>
        <CardHeader>
          <CardTitle>유저별 기여도 카드</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.contributors.map((contributor) => (
            <article key={contributor.userId} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{contributor.userName}</h4>
                <Badge variant={contributor.difficultyScore >= 70 ? "warn" : "secondary"}>
                  난이도 {contributor.difficultyScore}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">작업 {contributor.taskCount}건 · 영향도 {contributor.impactScore}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {contributor.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                <Link href={`/reports/users/${contributor.userId}?orgId=${resolvedContext.orgId}`}>
                  근거 보기
                </Link>
              </Button>
            </article>
          ))}
        </CardContent>
      </Card>

      <InsightPanel evidence={report.evidence} risks={report.risks} nextActions={report.nextActions} />
    </section>
  );
}
