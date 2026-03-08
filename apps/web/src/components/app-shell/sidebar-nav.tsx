"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  KanbanSquare,
  ListChecks,
  Settings,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/orgs", label: "조직", icon: Building2 },
  { href: "/board", label: "보드", icon: KanbanSquare },
  { href: "/calendar", label: "일정", icon: CalendarDays },
  { href: "/issues", label: "이슈", icon: ListChecks },
  { href: "/requests", label: "협업 요청", icon: UsersRound },
  { href: "/reports", label: "리포트", icon: ChartNoAxesCombined },
  { href: "/settings", label: "설정", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-semibold text-muted-foreground">작업 흐름</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" />
            <span>GitHub 이슈는 읽기 전용으로 조회</span>
          </li>
          <li>보드에서 내부 계획 카드로 일정/우선순위 운영</li>
          <li>일정 화면에서 작업·요청·이벤트를 함께 관리</li>
        </ul>
      </div>
    </nav>
  );
}
