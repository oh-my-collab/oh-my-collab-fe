"use client";

import { useQuery } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useRepositoriesByOrgQuery(orgId: string) {
  return useQuery({
    queryKey: queryKeys.reposByOrg(orgId),
    queryFn: () => backendClient.listReposByOrg(orgId),
    enabled: Boolean(orgId),
  });
}

export function useRepositoryQuery(orgId: string, repoId: string) {
  return useQuery({
    queryKey: queryKeys.repo(orgId, repoId),
    queryFn: () => backendClient.getRepo(orgId, repoId),
    enabled: Boolean(orgId && repoId),
  });
}

export function useRepositoryActivityQuery(orgId: string, repoId: string) {
  return useQuery({
    queryKey: queryKeys.repoActivity(orgId, repoId),
    queryFn: () => backendClient.getRepoActivity(orgId, repoId),
    enabled: Boolean(orgId && repoId),
  });
}
