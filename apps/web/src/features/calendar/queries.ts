"use client";

import { useQuery } from "@tanstack/react-query";

import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useCalendarEntriesQuery(orgId: string, params: { from: string; to: string }) {
  const searchParams = new URLSearchParams(params);
  const rangeKey = searchParams.toString();

  return useQuery({
    queryKey: queryKeys.calendarEntries(orgId, rangeKey),
    queryFn: () => backendClient.listCalendarEntries(orgId, searchParams),
    enabled: Boolean(orgId),
  });
}
