"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { IssueDetailPanel } from "@/components/issues/issue-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useIssueQuery } from "@/features/issues/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useUiStore } from "@/features/shared/ui-store";
import { useResolvedContext } from "@/features/shared/use-resolved-context";
import { getApiErrorDescription } from "@/lib/api/error";

export default function IssueDetailPage() {
  const params = useParams<{ issueId: string }>();
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const organizationsQuery = useOrganizationsQuery();
  const resolvedContext = useResolvedContext({
    allowStoreFallback: false,
    allowDefaultOrgFallback: false,
  });

  const issueId = params.issueId;
  const orgId = resolvedContext.orgId;
  const query = useIssueQuery(orgId ?? "", issueId);

  if (!orgId) {
    const organizations = organizationsQuery.data?.organizations ?? [];
    const recoveryOrgId = activeOrgId ?? organizationsQuery.data?.defaultOrgId ?? null;

    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Issue Detail</p>
          <h2 className="text-2xl font-bold">조직 선택이 필요합니다</h2>
        </header>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">조직을 선택해 이슈를 다시 열어 주세요</h3>
            <p className="text-sm text-muted-foreground">
              이슈 상세 링크는 조직 컨텍스트를 함께 받아야 합니다. 아래 링크로 현재 이슈를 다시 열 수 있습니다.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {recoveryOrgId ? (
              <Link
                href={`/issues/${issueId}?orgId=${recoveryOrgId}`}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-primary transition hover:bg-muted"
              >
                현재 선택한 조직으로 다시 열기
              </Link>
            ) : null}
            {organizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/issues/${issueId}?orgId=${organization.id}`}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                {organization.name}에서 열기
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (query.isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="이슈 상세를 불러오지 못했습니다"
        description={getApiErrorDescription(query.error, "잠시 후 다시 시도해 주세요.")}
      />
    );
  }

  const issue = query.data?.issue;
  if (!issue) {
    return <EmptyState title="이슈가 존재하지 않습니다" description="목록에서 다른 이슈를 선택해 주세요." />;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Issue Detail</p>
        <h2 className="text-2xl font-bold">{issue.id}</h2>
      </header>
      <IssueDetailPanel orgId={issue.orgId} issue={issue} comments={query.data?.comments ?? []} />
    </section>
  );
}
