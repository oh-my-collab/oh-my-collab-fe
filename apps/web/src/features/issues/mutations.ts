"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useCreateIssueMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.createIssue(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.org(orgId) });
    },
  });
}

export function useUpdateIssueMutation(orgId: string, issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => backendClient.updateIssue(orgId, issueId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.issue(orgId, issueId) });
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.org(orgId) });
    },
  });
}

export function useReorderIssuesMutation(orgId: string, repoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (buckets: Record<string, unknown>) =>
      backendClient.reorderIssues(orgId, { orgId, repoId, buckets }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.repo(orgId, repoId) });
    },
  });
}
