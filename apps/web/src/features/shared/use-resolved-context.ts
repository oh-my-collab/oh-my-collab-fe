"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { resolveContext, type ResolveContextInput } from "@/features/shared/context-resolver";
import { useUiStore } from "@/features/shared/ui-store";

type UseResolvedContextOptions = Omit<
  ResolveContextInput,
  "pathname" | "currentSearchParams" | "storeOrgId" | "storeRepoId"
>;

export function useResolvedContext(options: UseResolvedContextOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const activeRepoId = useUiStore((state) => state.activeRepoId);
  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);
  const setActiveRepoId = useUiStore((state) => state.setActiveRepoId);

  const resolvedContext = useMemo(
    () =>
      resolveContext({
        pathname,
        currentSearchParams: searchParams,
        storeOrgId: activeOrgId,
        storeRepoId: activeRepoId,
        ...options,
      }),
    [activeOrgId, activeRepoId, options, pathname, searchParams]
  );

  useEffect(() => {
    if (!resolvedContext.canonicalUrl) {
      return;
    }

    router.replace(resolvedContext.canonicalUrl);
  }, [resolvedContext.canonicalUrl, router]);

  useEffect(() => {
    if (!resolvedContext.orgId) {
      return;
    }

    if (resolvedContext.orgId !== activeOrgId) {
      setActiveOrgId(resolvedContext.orgId);
    }

    if (resolvedContext.repoId && resolvedContext.repoId !== activeRepoId) {
      setActiveRepoId(resolvedContext.repoId);
      return;
    }

    if (
      resolvedContext.usesRouteContext &&
      !resolvedContext.repoId &&
      activeOrgId &&
      activeOrgId !== resolvedContext.orgId
    ) {
      setActiveRepoId(null);
    }
  }, [
    activeOrgId,
    activeRepoId,
    resolvedContext.orgId,
    resolvedContext.repoId,
    resolvedContext.usesRouteContext,
    setActiveOrgId,
    setActiveRepoId,
  ]);

  return {
    ...resolvedContext,
    pathname,
    searchParams,
  };
}
