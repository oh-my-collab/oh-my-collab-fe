"use client";

import Link from "next/link";
import { Bell, Moon, Plus, Search, Sun } from "lucide-react";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSessionQuery } from "@/features/auth/queries";
import { useMarkNotificationReadMutation, useNotificationsQuery } from "@/features/notifications/queries";
import {
  buildContextHref,
  resolveContext,
  shouldIncludeRepoIdForPathname,
} from "@/features/shared/context-resolver";
import { useUiStore } from "@/features/shared/ui-store";

const breadcrumbMap: Record<string, Array<{ label: string; href?: string }>> = {
  "/orgs": [{ label: "조직" }],
  "/board": [{ label: "보드" }],
  "/issues": [{ label: "이슈" }],
  "/requests": [{ label: "협업 요청" }],
  "/reports": [{ label: "리포트" }],
  "/settings": [{ label: "설정" }],
};

export function TopHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const sessionQuery = useSessionQuery();
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const activeRepoId = useUiStore((state) => state.activeRepoId);
  const issueSearch = useUiStore((state) => state.issueSearch);
  const setIssueSearch = useUiStore((state) => state.setIssueSearch);

  const currentContext = useMemo(
    () =>
      resolveContext({
        pathname,
        currentSearchParams: searchParams,
        storeOrgId: activeOrgId,
        storeRepoId: activeRepoId,
        includeRepoIdInQuery: shouldIncludeRepoIdForPathname(pathname),
      }),
    [activeOrgId, activeRepoId, pathname, searchParams]
  );

  const notificationsQuery = useNotificationsQuery(currentContext.orgId ?? "");
  const markReadMutation = useMarkNotificationReadMutation(currentContext.orgId ?? "");

  const unreadCount = (notificationsQuery.data?.notifications ?? []).filter((item) => !item.isRead).length;
  const sessionUser = sessionQuery.data?.user;
  const displayName = sessionUser?.name?.trim() || "프로필";
  const roleLabel = sessionUser?.role === "owner" ? "오너" : "사용자";
  const avatarFallback = displayName.slice(0, 2).toUpperCase();
  const breadcrumb =
    Object.entries(breadcrumbMap).find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ??
    [{ label: "대시보드" }];
  const quickCreateHref = buildContextHref("/issues", {
    searchParams: new URLSearchParams("create=1"),
    orgId: currentContext.orgId,
    repoId: currentContext.repoId,
    includeRepoId: true,
  });
  const settingsHref = buildContextHref("/settings", {
    orgId: currentContext.orgId,
    includeRepoId: false,
  });

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-52 flex-1">
          <BreadcrumbNav items={breadcrumb} />
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={issueSearch}
            onChange={(event) => setIssueSearch(event.target.value)}
            placeholder="이슈 또는 요청 검색"
            className="pl-9"
            aria-label="검색"
          />
        </div>
        <Button asChild aria-label="빠른 생성">
          <Link href={quickCreateHref}>
            <Plus className="mr-1 h-4 w-4" />
            빠른 생성
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="알림" disabled={!currentContext.orgId}>
              <Bell className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {(notificationsQuery.data?.notifications ?? []).slice(0, 6).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => {
                  if (!currentContext.orgId) {
                    return;
                  }

                  if (!notification.isRead) {
                    markReadMutation.mutate(notification.id);
                    toast.success("알림을 읽음 처리했습니다.");
                  }

                  if (notification.relatedId?.startsWith("ISS")) {
                    router.push(`/issues/${notification.relatedId}?orgId=${currentContext.orgId}`);
                  }
                }}
                className="flex flex-col items-start gap-1"
              >
                <span className="text-xs font-semibold">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.body}</span>
              </DropdownMenuItem>
            ))}
            {notificationsQuery.data?.notifications.length ? null : (
              <DropdownMenuItem className="text-xs text-muted-foreground">알림이 없습니다.</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          aria-label="테마 전환"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Link
          href={settingsHref}
          aria-label="프로필"
          className="flex items-center gap-2 rounded-md border border-border px-2 py-1 transition-colors hover:bg-muted/50"
        >
          <Avatar>
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="text-xs">
            <p className="font-semibold">{displayName}</p>
            <p className="text-muted-foreground">{roleLabel}</p>
            <p className="text-muted-foreground">미확인 {unreadCount}건</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
