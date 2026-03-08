"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useCreatePlanningTaskMutation(orgId: string, repoId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.createPlanningTask(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.planningTasks(orgId, repoId) });
      void queryClient.invalidateQueries({ queryKey: [queryKeys.calendarEntries(orgId, "")[0], orgId] });
    },
  });
}

export function useUpdatePlanningTaskMutation(orgId: string, taskId: string, repoId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => backendClient.updatePlanningTask(orgId, taskId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.planningTasks(orgId, repoId) });
      void queryClient.invalidateQueries({ queryKey: [queryKeys.calendarEntries(orgId, "")[0], orgId] });
    },
  });
}

export function useReorderPlanningTasksMutation(orgId: string, repoId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => backendClient.reorderPlanningTasks(orgId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.planningTasks(orgId, repoId) });
      void queryClient.invalidateQueries({ queryKey: [queryKeys.calendarEntries(orgId, "")[0], orgId] });
    },
  });
}