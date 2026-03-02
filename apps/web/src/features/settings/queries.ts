"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useSettingsQuery(orgId: string) {
  return useQuery({
    queryKey: queryKeys.settings(orgId),
    queryFn: () => backendClient.getSettings(orgId),
    enabled: Boolean(orgId),
  });
}

export function useUpdateSettingsMutation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.updateSettings(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings(orgId) });
    },
  });
}
