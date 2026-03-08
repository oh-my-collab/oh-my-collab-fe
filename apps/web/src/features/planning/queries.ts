"use client";

import { useQuery } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function usePlanningTasksQuery(orgId: string, repoId?: string) {
  const params = new URLSearchParams();
  if (repoId) {
    params.set("repoId", repoId);
  }

  return useQuery({
    queryKey: queryKeys.planningTasks(orgId, repoId),
    queryFn: () => backendClient.listPlanningTasks(orgId, params),
    enabled: Boolean(orgId),
  });
}
