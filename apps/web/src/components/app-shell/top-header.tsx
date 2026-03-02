"use client";

import { Bell, Moon, Plus, Search, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { useNotificationsQuery, useMarkNotificationReadMutation } from "@/features/notifications/queries";
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
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const issueSearch = useUiStore((state) => state.issueSearch);
  const setIssueSearch = useUiStore((state) => state.setIssueSearch);

  const { data: notificationData } = useNotificationsQuery(activeOrgId ?? "");
  const markReadMutation = useMarkNotificationReadMutation(activeOrgId ?? "");

  const unreadCount = (notificationData?.notifications ?? []).filter((item) => !item.isRead).length;
  const breadcrumb =
    Object.entries(breadcrumbMap).find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ?? [{ label: "대시보드" }];

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
            placeholder="이슈/요청 검색"
            className="pl-9"
            aria-label="검색"
          />
        </div>
        <Button asChild aria-label="빠른 생성">
          <Link href="/issues?create=1">
            <Plus className="mr-1 h-4 w-4" />
            빠른 생성
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="알림" disabled={!activeOrgId}>
              <Bell className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {(notificationData?.notifications ?? []).slice(0, 6).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => {
                  if (!activeOrgId) return;

                  if (!notification.isRead) {
                    markReadMutation.mutate(notification.id);
                    toast.success("알림을 읽음 처리했습니다.");
                  }

                  if (notification.relatedId?.startsWith("ISS")) {
                    router.push(`/issues/${notification.relatedId}?orgId=${activeOrgId}`);
                  }
                }}
                className="flex flex-col items-start gap-1"
              >
                <span className="text-xs font-semibold">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.body}</span>
              </DropdownMenuItem>
            ))}
            {notificationData?.notifications.length ? null : (
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

        <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
          <Avatar>
            <AvatarFallback>KO</AvatarFallback>
          </Avatar>
          <div className="text-xs">
            <p className="font-semibold">오너</p>
            <p className="text-muted-foreground">미확인 {unreadCount}건</p>
          </div>
        </div>
      </div>
    </header>
  );
}
