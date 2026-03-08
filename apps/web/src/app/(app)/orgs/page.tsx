"use client";

import { useState } from "react";
import { toast } from "sonner";

import { OrganizationCard } from "@/components/orgs/organization-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useGitHubStatusQuery } from "@/features/github/queries";
import { launchGitHubBootstrap, launchGitHubInstall } from "@/features/github/browser";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { getApiErrorDescription } from "@/lib/api/error";

export default function OrgsPage() {
  const { data, isLoading, isError, refetch, error } = useOrganizationsQuery();
  const githubStatusQuery = useGitHubStatusQuery();
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const onSetupGitHub = async () => {
    try {
      setIsBootstrapping(true);
      await launchGitHubBootstrap();
    } catch (setupError) {
      toast.error(getApiErrorDescription(setupError, "GitHub App 설정을 시작하지 못했습니다."));
      setIsBootstrapping(false);
    }
  };

  const onConnectGitHubOrg = () => {
    try {
      launchGitHubInstall();
    } catch (connectError) {
      toast.error(getApiErrorDescription(connectError, "GitHub 조직 연결을 시작하지 못했습니다."));
    }
  };

  const github = githubStatusQuery.data?.github;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Organizations</p>
        <h2 className="text-2xl font-bold">GitHub 조직 연결</h2>
        <p className="text-sm text-muted-foreground">신규 진입은 조직 생성이 아니라 GitHub 조직 설치로 통합합니다. 기존 수동 조직은 그대로 유지됩니다.</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">GitHub App 상태</p>
            <p className="text-sm text-muted-foreground">
              {githubStatusQuery.isLoading
                ? "GitHub 연동 상태를 확인하는 중입니다."
                : github?.configured
                  ? `앱이 준비되었습니다. 설치 ${github.installationCount}건`
                  : "아직 GitHub App이 구성되지 않았습니다."}
            </p>
            {github?.slug ? <p className="text-xs text-muted-foreground">app slug: {github.slug}</p> : null}
            {github?.ownerEmail ? <p className="text-xs text-muted-foreground">현재 플랫폼 오너: {github.ownerEmail}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!github?.configured && github?.canBootstrap ? (
              <Button onClick={onSetupGitHub} disabled={isBootstrapping || githubStatusQuery.isLoading}>
                {isBootstrapping ? "GitHub App 생성 중..." : "GitHub App 설정"}
              </Button>
            ) : null}
            {github?.configured ? (
              <Button onClick={onConnectGitHubOrg}>GitHub 조직 연결</Button>
            ) : null}
          </div>
        </div>
        {!github?.configured && !github?.canBootstrap && !githubStatusQuery.isLoading ? (
          <p className="mt-4 text-xs text-muted-foreground">
            현재 계정은 플랫폼 오너 권한이 없어 GitHub App 설정을 직접 시작할 수 없습니다.
            {github?.ownerEmail ? ` 현재 플랫폼 오너는 ${github.ownerEmail} 입니다.` : ""}
          </p>
        ) : null}
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
          title="연결된 조직이 없습니다"
          description={github?.configured ? "GitHub 조직 연결 버튼으로 첫 설치를 시작해 주세요." : "먼저 GitHub App을 설정한 뒤 조직을 연결해 주세요."}
          cta={github?.configured
            ? { label: "GitHub 조직 연결", onClick: onConnectGitHubOrg }
            : github?.canBootstrap
              ? { label: "GitHub App 설정", onClick: onSetupGitHub }
              : undefined}
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
