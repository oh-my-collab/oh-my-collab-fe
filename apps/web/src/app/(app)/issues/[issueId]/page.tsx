"use client";

import { useParams, useSearchParams } from "next/navigation";

import { IssueDetailPanel } from "@/components/issues/issue-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useIssueQuery } from "@/features/issues/queries";
import { useUiStore } from "@/features/shared/ui-store";
import { getApiErrorDescription } from "@/lib/api/error";

export default function IssueDetailPage() {
  const params = useParams<{ issueId: string }>();
  const searchParams = useSearchParams();
  const activeOrgId = useUiStore((state) => state.activeOrgId);

  const issueId = params.issueId;
  const orgId = searchParams.get("orgId") ?? activeOrgId ?? "";

  const query = useIssueQuery(orgId, issueId);

  if (!orgId) {
    return (
      <ErrorState
        title="조직 컨텍스트가 필요합니다"
        description="조직 화면에서 이슈를 다시 열거나 orgId 쿼리를 포함해 접근해 주세요."
      />
    );
  }

  if (query.isLoading) return <TableSkeleton rows={4} />;

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
