"use client";

import Link from "next/link";
import { BarChart3, KanbanSquare, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "지라급 칸반 UX",
    description: "Backlog/In Progress/Review/Done 보드에서 드래그 앤 드롭으로 상태를 즉시 변경합니다.",
    icon: KanbanSquare,
  },
  {
    title: "협업 요청 인박스",
    description: "유저 간 요청을 앱 내 인박스에서 수락/거절/질문까지 처리합니다.",
    icon: Users,
  },
  {
    title: "AI 난이도 리포트",
    description: "오너가 한 화면에서 결론을 보고, 클릭해 근거로 드릴다운할 수 있습니다.",
    icon: BarChart3,
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Collaborative OS</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
          기여도 추적 + AI 난이도 리포트를 위한
          <br />
          Jira급 협업 플랫폼
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          오너는 팀 성과를 한눈에 파악하고, 구성원은 2~3클릭 내 작업을 완료하는 UX를 제공합니다.
          모바일 퍼스트와 접근성을 기본으로 설계되었습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5 text-primary" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{feature.description}</CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}