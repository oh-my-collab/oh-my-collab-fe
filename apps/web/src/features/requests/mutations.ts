"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useCreateRequestMutation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.createRequest(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(orgId) });
    },
  });
}

export function useUpdateRequestMutation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, input }: { requestId: string; input: Record<string, unknown> }) =>
      backendClient.updateRequest(orgId, requestId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(orgId) });
    },
  });
}
