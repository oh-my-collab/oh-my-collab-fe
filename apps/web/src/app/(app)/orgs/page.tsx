"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { OrganizationCard } from "@/components/orgs/organization-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateOrganizationMutation, useOrganizationsQuery } from "@/features/orgs/queries";
import { getApiErrorDescription } from "@/lib/api/error";

function normalizeGitHubOrgSlug(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const withoutHost = withoutProtocol.replace(/^github\.com\//i, "");
  const normalizedPath = withoutHost.replace(/^orgs\//i, "");
  const withoutHandle = normalizedPath.replace(/^@/, "");
  const [slug = ""] = withoutHandle.split(/[/?#]/);

  return slug.trim();
}

export default function OrgsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [githubOrgInput, setGitHubOrgInput] = useState("");
  const { data, isLoading, isError, refetch, error } = useOrganizationsQuery();
  const createOrgMutation = useCreateOrganizationMutation();

  const onConnect = async () => {
    const githubOrgSlug = normalizeGitHubOrgSlug(githubOrgInput);
    if (!githubOrgSlug) {
      toast.error("GitHub 조직 slug를 입력해 주세요.");
      inputRef.current?.focus();
      return;
    }

    try {
      const response = await createOrgMutation.mutateAsync(githubOrgSlug);
      setGitHubOrgInput("");
      toast.success("GitHub 조직을 연결했습니다.");

      if (response.organization?.id) {
        router.push(`/orgs/${response.organization.id}`);
      }
    } catch (connectError) {
      toast.error(getApiErrorDescription(connectError, "GitHub 조직 연결에 실패했습니다."));
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">GitHub Organization</p>
        <h2 className="text-2xl font-bold">연결된 GitHub 조직</h2>
        <p className="text-sm text-muted-foreground">
          GitHub 조직 slug를 연결하고, 다음 단계에서 레포를 동기화해 협업을 시작하세요.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            ref={inputRef}
            value={githubOrgInput}
            onChange={(event) => setGitHubOrgInput(event.target.value)}
            placeholder="acme-platform 또는 https://github.com/acme-platform"
            className="max-w-xl"
            aria-label="GitHub 조직 slug"
          />
          <Button onClick={onConnect} disabled={createOrgMutation.isPending}>
            <Link2 className="mr-1 h-4 w-4" />
            {createOrgMutation.isPending ? "연결 중..." : "GitHub 조직 연결"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          조직 slug만 입력하면 됩니다. GitHub URL을 붙여 넣어도 자동으로 정리합니다.
        </p>
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
          title="연결된 GitHub 조직이 없습니다"
          description="첫 GitHub 조직을 연결하고 레포 동기화를 시작하세요."
          cta={{ label: "GitHub 조직 연결", onClick: () => inputRef.current?.focus() }}
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
