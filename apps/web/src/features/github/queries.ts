"use client";

import { useQuery } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useGitHubStatusQuery() {
  return useQuery({
    queryKey: queryKeys.githubStatus,
    queryFn: () => backendClient.getGitHubStatus(),
  });
}
