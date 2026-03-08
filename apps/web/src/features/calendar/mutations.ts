"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useCreateScheduleEventMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.createScheduleEvent(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.calendarEntries(orgId, "")[0], orgId] });
    },
  });
}

export function useUpdateScheduleEventMutation(orgId: string, eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.updateScheduleEvent(orgId, eventId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.calendarEntries(orgId, "")[0], orgId] });
    },
  });
}
