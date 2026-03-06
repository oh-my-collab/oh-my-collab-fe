"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useRepositoriesByOrgQuery } from "@/features/repos/queries";
import {
  buildCurrentPageHref,
  resolveContext,
  selectRepoIdForOrganization,
  shouldIncludeRepoIdForPathname,
} from "@/features/shared/context-resolver";
import { useUiStore } from "@/features/shared/ui-store";

export function OrgRepoSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: orgData } = useOrganizationsQuery();
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const activeRepoId = useUiStore((state) => state.activeRepoId);
  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);
  const setActiveRepoId = useUiStore((state) => state.setActiveRepoId);

  const currentContext = useMemo(
    () =>
      resolveContext({
        pathname,
        currentSearchParams: searchParams,
        storeOrgId: activeOrgId,
        storeRepoId: activeRepoId,
        defaultOrgId: orgData?.defaultOrgId,
        includeRepoIdInQuery: shouldIncludeRepoIdForPathname(pathname),
      }),
    [activeOrgId, activeRepoId, orgData?.defaultOrgId, pathname, searchParams]
  );

  const resolvedOrgId = currentContext.orgId ?? orgData?.organizations[0]?.id ?? null;
  const repoQuery = useRepositoriesByOrgQuery(resolvedOrgId ?? "");
  const repoIds = useMemo(
    () => (repoQuery.data?.repositories ?? []).map((repo) => repo.id),
    [repoQuery.data?.repositories]
  );
  const selectedRepoId = selectRepoIdForOrganization(repoIds, currentContext.repoId ?? activeRepoId);
  const currentPageHref = buildCurrentPageHref({
    pathname,
    searchParams,
    orgId: currentContext.orgId,
    repoId: currentContext.repoId,
  });

  useEffect(() => {
    if (!resolvedOrgId || activeOrgId === resolvedOrgId) {
      return;
    }

    setActiveOrgId(resolvedOrgId);
  }, [activeOrgId, resolvedOrgId, setActiveOrgId]);

  useEffect(() => {
    if (!resolvedOrgId || !repoQuery.data) {
      return;
    }

    if (selectedRepoId !== activeRepoId) {
      setActiveRepoId(selectedRepoId);
    }

    const shouldRepairUrl = Boolean(currentContext.repoId) && currentContext.repoId !== selectedRepoId;
    if (!shouldRepairUrl) {
      return;
    }

    const nextHref = buildCurrentPageHref({
      pathname,
      searchParams,
      orgId: resolvedOrgId,
      repoId: selectedRepoId,
    });

    if (nextHref !== currentPageHref) {
      router.replace(nextHref);
    }
  }, [
    activeRepoId,
    currentContext.repoId,
    currentPageHref,
    pathname,
    repoQuery.data,
    resolvedOrgId,
    router,
    searchParams,
    selectedRepoId,
    setActiveRepoId,
  ]);

  return (
    <div className="grid gap-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">조직</label>
        <Select
          aria-label="조직 선택"
          value={resolvedOrgId ?? ""}
          onChange={(event) => {
            const nextOrgId = event.target.value || null;
            setActiveOrgId(nextOrgId);
            setActiveRepoId(null);

            const nextHref = buildCurrentPageHref({
              pathname,
              searchParams,
              orgId: nextOrgId,
              repoId: null,
            });

            if (nextHref !== currentPageHref) {
              router.push(nextHref);
            }
          }}
        >
          {(orgData?.organizations ?? []).map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">레포지토리</label>
        <Select
          aria-label="레포지토리 선택"
          value={selectedRepoId ?? ""}
          onChange={(event) => {
            const nextRepoId = event.target.value || null;
            setActiveRepoId(nextRepoId);

            const nextHref = buildCurrentPageHref({
              pathname,
              searchParams,
              orgId: resolvedOrgId,
              repoId: nextRepoId,
            });

            if (nextHref !== currentPageHref) {
              router.push(nextHref);
            }
          }}
          disabled={!repoQuery.data?.repositories.length || !resolvedOrgId}
        >
          {(repoQuery.data?.repositories ?? []).map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
