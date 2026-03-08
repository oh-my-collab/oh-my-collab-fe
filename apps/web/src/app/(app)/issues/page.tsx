"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { IssueCard } from "@/components/issues/issue-card";
import { IssueFormDialog } from "@/components/issues/issue-form-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSessionQuery } from "@/features/auth/queries";
import { useIssuesQuery } from "@/features/issues/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useRepositoriesByOrgQuery } from "@/features/repos/queries";
import { useUiStore } from "@/features/shared/ui-store";
import { getApiErrorDescription } from "@/lib/api/error";
import { formatDate } from "@/lib/utils";

export default function IssuesPage() {
  const { data: orgData } = useOrganizationsQuery();
  const { data: sessionData } = useSessionQuery();
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const activeRepoId = useUiStore((state) => state.activeRepoId);
  const issueSearch = useUiStore((state) => state.issueSearch);
  const setIssueSearch = useUiStore((state) => state.setIssueSearch);
  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [labelFilter, setLabelFilter] = useState<string>("");

  useEffect(() => {
    if (!activeOrgId && orgData?.defaultOrgId) {
      setActiveOrgId(orgData.defaultOrgId);
    }
  }, [activeOrgId, orgData?.defaultOrgId, setActiveOrgId]);

  const resolvedOrgId = activeOrgId ?? orgData?.defaultOrgId;
  const reposQuery = useRepositoriesByOrgQuery(resolvedOrgId ?? "");
  const activeRepo = (reposQuery.data?.repositories ?? []).find((repo) => repo.id === activeRepoId);

  const filters = useMemo(
    () => ({
      orgId: resolvedOrgId,
      repoId: activeRepoId ?? undefined,
      status: statusFilter || undefined,
      assigneeId: assigneeFilter || undefined,
      label: labelFilter || undefined,
      q: issueSearch || undefined,
    }),
    [resolvedOrgId, activeRepoId, statusFilter, assigneeFilter, labelFilter, issueSearch]
  );

  const query = useIssuesQuery(filters);

  if (query.isLoading) {
    return <TableSkeleton />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="이슈 목록을 불러오지 못했습니다"
        description={getApiErrorDescription(query.error, "필터를 초기화하고 다시 시도해 주세요.")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const issues = query.data?.issues ?? [];
  const users = query.data?.users ?? [];
  const totalCount = query.data?.totalCount ?? issues.length;
  const labels = Array.from(new Set(issues.flatMap((issue) => issue.labelIds)));
  const isReadOnlyRepo = activeRepo?.provider === "github";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Issues</p>
        <h2 className="text-2xl font-bold">GitHub 이슈 미러</h2>
        <p className="text-sm text-muted-foreground">연결된 GitHub 이슈를 읽기 전용으로 조회합니다. 상태·우선순위 운영은 내부 계획 보드에서 진행합니다.</p>
        <p className="text-xs text-muted-foreground">서버 기준 총 {totalCount}건</p>
      </header>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-2 xl:grid-cols-5">
        <Input value={issueSearch} onChange={(event) => setIssueSearch(event.target.value)} placeholder="이슈 검색" aria-label="이슈 검색" />
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="상태 필터">
          <option value="">상태 전체</option>
          <option value="backlog">backlog</option>
          <option value="in_progress">in_progress</option>
          <option value="review">review</option>
          <option value="done">done</option>
        </Select>
        <Select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} aria-label="담당자 필터">
          <option value="">담당자 전체</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </Select>
        <Select value={labelFilter} onChange={(event) => setLabelFilter(event.target.value)} aria-label="라벨 필터">
          <option value="">라벨 전체</option>
          {labels.map((label) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </Select>
        {filters.orgId && activeRepoId && sessionData?.user && !isReadOnlyRepo ? (
          <IssueFormDialog orgId={filters.orgId} repoId={activeRepoId} users={users} currentUserId={sessionData.user.id} />
        ) : (
          <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            {isReadOnlyRepo ? "GitHub 레포는 읽기 전용입니다." : "레포를 선택하면 생성 동작이 활성화됩니다."}
          </div>
        )}
      </div>

      {!issues.length ? (
        <EmptyState title="조건에 맞는 이슈가 없습니다" description="다른 레포를 선택하거나 GitHub 동기화를 확인해 주세요." />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "id",
                label: "ID",
                sortable: true,
                render: (value, row) => (
                  <Link className="text-primary hover:underline" href={`/issues/${String(value)}?orgId=${String(row.orgId ?? "")}`}>
                    {String(value)}
                  </Link>
                ),
              },
              { key: "title", label: "제목", sortable: true },
              { key: "status", label: "상태", sortable: true },
              { key: "priority", label: "우선순위", sortable: true },
              { key: "assigneeId", label: "담당자", sortable: true },
              { key: "dueDate", label: "마감일", sortable: true, render: (value) => formatDate(String(value ?? "")) },
              {
                key: "sourceUrl",
                label: "원본",
                render: (value) =>
                  value ? (
                    <a href={String(value)} target="_blank" rel="noreferrer" className="text-primary hover:underline">GitHub</a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  ),
              },
            ]}
            rows={issues}
            pageSize={8}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {issues.slice(0, 6).map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
