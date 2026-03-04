"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AUTH_SESSION_COOKIE_NAME } from "@/features/auth/constants";
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
      document.cookie = `${AUTH_SESSION_COOKIE_NAME}=active; Path=/; Max-Age=2592000; SameSite=Lax`;
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) => backendClient.signup(input),
    onSuccess: () => {
      document.cookie = `${AUTH_SESSION_COOKIE_NAME}=active; Path=/; Max-Age=2592000; SameSite=Lax`;
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => backendClient.logout(),
    onSuccess: () => {
      document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}
