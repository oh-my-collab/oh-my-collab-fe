"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { OrganizationCard } from "@/components/orgs/organization-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateOrganizationMutation, useOrganizationsQuery } from "@/features/orgs/queries";
import { getApiErrorDescription } from "@/lib/api/error";

export default function OrgsPage() {
  const [name, setName] = useState("");
  const { data, isLoading, isError, refetch, error } = useOrganizationsQuery();
  const createOrgMutation = useCreateOrganizationMutation();

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await createOrgMutation.mutateAsync(name.trim());
      setName("");
      toast.success("조직을 생성했습니다.");
    } catch (createError) {
      toast.error(getApiErrorDescription(createError, "조직 생성에 실패했습니다."));
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Organization</p>
        <h2 className="text-2xl font-bold">조직 목록</h2>
        <p className="text-sm text-muted-foreground">
          여러 조직의 레포/이슈 현황을 한 번에 관리하세요.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="새 조직 이름"
          className="max-w-xs"
          aria-label="새 조직 이름"
        />
        <Button onClick={onCreate} disabled={createOrgMutation.isPending}>
          <Plus className="mr-1 h-4 w-4" />
          조직 생성
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="조직을 불러오지 못했습니다"
          description={getApiErrorDescription(error, "네트워크 상태를 확인한 뒤 다시 시도해 주세요.")}
          onRetry={() => void refetch()}
        />
      ) : !data?.organizations.length ? (
        <EmptyState
          title="생성된 조직이 없습니다"
          description="첫 조직을 만들고 레포를 연결해 협업을 시작하세요."
          cta={{ label: "조직 생성", onClick: () => document.activeElement instanceof HTMLElement && document.activeElement.blur() }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.organizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </div>
      )}
    </section>
  );
}
