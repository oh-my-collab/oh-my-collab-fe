"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clearAuthSessionCookie, persistAuthSessionCookie } from "@/features/auth/session-cookie";
import { backendClient } from "@/lib/api/backend-client";
import { queryKeys } from "@/lib/api/query-keys";

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => backendClient.getSession(),
    staleTime: 10_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => backendClient.login(input),
    onSuccess: () => {
      persistAuthSessionCookie();
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) => backendClient.signup(input),
    onSuccess: () => {
      persistAuthSessionCookie();
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => backendClient.logout(),
    onSuccess: () => {
      clearAuthSessionCookie();
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}
