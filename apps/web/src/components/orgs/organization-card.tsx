import Link from "next/link";

import type { Organization } from "@/features/shared/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrganizationCard({
  organization,
  summary,
}: {
  organization: Organization;
  summary?: {
    repositoryCount: number;
    openIssueCount: number;
    weeklyCommits: number;
    weeklyMerges: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{organization.name}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {(organization.source ?? "manual").toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{organization.slug}</p>
        {organization.github?.login ? (
          <div className="rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
            <p>GitHub 조직: {organization.github.login}</p>
            <p>동기화 상태: {organization.syncState ?? "pending"}</p>
          </div>
        ) : null}
        {summary ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground">레포 수</p>
              <p className="font-semibold">{summary.repositoryCount}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground">오픈 이슈</p>
              <p className="font-semibold">{summary.openIssueCount}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground">주간 커밋</p>
              <p className="font-semibold">{summary.weeklyCommits}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground">주간 머지</p>
              <p className="font-semibold">{summary.weeklyMerges}</p>
            </div>
          </div>
        ) : null}
        <Button asChild className="w-full">
          <Link href={`/orgs/${organization.id}`}>조직 대시보드</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
