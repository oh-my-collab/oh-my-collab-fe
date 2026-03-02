"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useNotificationsQuery(orgId: string) {
  return useQuery({
    queryKey: queryKeys.notifications(orgId),
    queryFn: () => backendClient.listNotifications(orgId),
    refetchInterval: 30_000,
    enabled: Boolean(orgId),
  });
}

export function useMarkNotificationReadMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => backendClient.markNotificationRead(orgId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(orgId) });
    },
  });
}
