"use client";

import { RequestComposerModal } from "@/components/requests/request-composer-modal";
import { RequestInboxList } from "@/components/requests/request-inbox-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useSessionQuery } from "@/features/auth/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useRequestsQuery } from "@/features/requests/queries";
import { useResolvedContext } from "@/features/shared/use-resolved-context";
import { getApiErrorDescription } from "@/lib/api/error";

export default function RequestsPage() {
  const orgQuery = useOrganizationsQuery();
  const sessionQuery = useSessionQuery();
  const resolvedContext = useResolvedContext({
    defaultOrgId: orgQuery.data?.defaultOrgId,
  });

  const requestsQuery = useRequestsQuery(resolvedContext.orgId ?? "");

  if (orgQuery.isLoading || sessionQuery.isLoading || (resolvedContext.orgId && requestsQuery.isLoading)) {
    return <TableSkeleton rows={4} />;
  }

  if (orgQuery.isError || sessionQuery.isError || requestsQuery.isError) {
    const sourceError = orgQuery.error ?? sessionQuery.error ?? requestsQuery.error;
    return (
      <ErrorState
        title="협업 요청을 불러오지 못했습니다"
        description={getApiErrorDescription(sourceError, "잠시 후 다시 시도해 주세요.")}
        onRetry={() => void requestsQuery.refetch()}
      />
    );
  }

  if (!resolvedContext.orgId || !sessionQuery.data?.user) {
    return (
      <EmptyState
        title="협업 요청을 표시할 수 없습니다"
        description="조직 선택과 로그인 상태를 확인해 주세요."
      />
    );
  }

  const users = requestsQuery.data?.users ?? [];
  const requests = requestsQuery.data?.requests ?? [];

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Collaboration Requests</p>
        <h2 className="text-2xl font-bold">협업 요청</h2>
        <p className="text-sm text-muted-foreground">인박스와 보낸 요청을 한 화면에서 관리합니다.</p>
      </header>

      <RequestComposerModal orgId={resolvedContext.orgId} fromUserId={sessionQuery.data.user.id} users={users} />

      <RequestInboxList
        orgId={resolvedContext.orgId}
        currentUserId={sessionQuery.data.user.id}
        requests={requests}
        users={users}
      />
    </section>
  );
}
