"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OrgRepoSwitcher } from "@/components/app-shell/org-repo-switcher";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { TopHeader } from "@/components/app-shell/top-header";
import { ErrorState } from "@/components/shared/error-state";
import { useSessionQuery } from "@/features/auth/queries";
import { buildRedirectedFrom, withRedirectedFrom } from "@/features/auth/redirect";
import { getApiErrorDescription } from "@/lib/api/error";

export function SessionGateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-8 w-full rounded bg-muted" />
        <div className="h-8 w-full rounded bg-muted" />
        <div className="h-32 w-full rounded bg-muted" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionQuery = useSessionQuery();
  const redirectedFrom = buildRedirectedFrom(pathname, searchParams);
  const loginPath = withRedirectedFrom("/login", redirectedFrom);
  const sessionUser = sessionQuery.data?.user;

  useEffect(() => {
    if (sessionQuery.isLoading || sessionQuery.isError || sessionUser) {
      return;
    }

    router.replace(loginPath);
  }, [loginPath, router, sessionQuery.isError, sessionQuery.isLoading, sessionUser]);

  if (sessionQuery.isLoading) {
    return <SessionGateFallback />;
  }

  if (sessionQuery.isError) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl">
          <ErrorState
            title="세션을 확인할 수 없습니다"
            description={getApiErrorDescription(sessionQuery.error, "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.")}
            onRetry={() => {
              void sessionQuery.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return <SessionGateFallback />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-border bg-card p-4 lg:block">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">OH-MY-COLLAB</p>
            <h1 className="mt-1 text-lg font-semibold">GitHub 연결 협업 허브</h1>
          </div>
          <OrgRepoSwitcher />
          <div className="mt-4 border-t border-border pt-4">
            <SidebarNav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <TopHeader />
          <div className="border-b border-border p-3 lg:hidden">
            <OrgRepoSwitcher />
            <div className="mt-3 rounded-md border border-border p-2">
              <SidebarNav />
            </div>
          </div>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
