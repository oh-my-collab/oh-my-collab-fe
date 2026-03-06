"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useSessionQuery } from "@/features/auth/queries";
import { clearAuthSessionCookie } from "@/features/auth/session-cookie";
import { getApiErrorDescription, isUnauthorizedApiError } from "@/lib/api/error";

export function ProtectedSessionBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionQuery = useSessionQuery();
  const search = searchParams.toString();
  const redirectedFrom = search ? `${pathname}?${search}` : pathname;
  const loginHref = `/login?${new URLSearchParams({ redirectedFrom }).toString()}`;
  const shouldRedirectForMissingUser = !sessionQuery.isPending && sessionQuery.data?.user === null;
  const shouldRedirectForUnauthorizedError =
    sessionQuery.isError && isUnauthorizedApiError(sessionQuery.error);

  useEffect(() => {
    if (!shouldRedirectForMissingUser && !shouldRedirectForUnauthorizedError) {
      return;
    }

    clearAuthSessionCookie();
    router.replace(loginHref);
  }, [loginHref, router, shouldRedirectForMissingUser, shouldRedirectForUnauthorizedError]);

  if (sessionQuery.isPending || shouldRedirectForMissingUser || shouldRedirectForUnauthorizedError) {
    return <TableSkeleton rows={4} />;
  }

  if (sessionQuery.isError) {
    return (
      <ErrorState
        title="세션 상태를 확인하지 못했습니다"
        description={getApiErrorDescription(
          sessionQuery.error,
          "잠시 후 다시 시도해 주세요."
        )}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  return <>{children}</>;
}
