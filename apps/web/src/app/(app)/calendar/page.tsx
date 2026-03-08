"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCalendarEntriesQuery } from "@/features/calendar/queries";
import { useCreateScheduleEventMutation } from "@/features/calendar/mutations";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { usePlanningTasksQuery } from "@/features/planning/queries";
import { useUiStore } from "@/features/shared/ui-store";
import { getApiErrorDescription } from "@/lib/api/error";
import { formatDate } from "@/lib/utils";

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toDateTimeInput(value: Date) {
  return value.toISOString().slice(0, 16);
}

export default function CalendarPage() {
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const activeRepoId = useUiStore((state) => state.activeRepoId);
  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);
  const orgQuery = useOrganizationsQuery();

  useEffect(() => {
    if (!activeOrgId && orgQuery.data?.defaultOrgId) {
      setActiveOrgId(orgQuery.data.defaultOrgId);
    }
  }, [activeOrgId, orgQuery.data?.defaultOrgId, setActiveOrgId]);

  const resolvedOrgId = activeOrgId ?? orgQuery.data?.defaultOrgId ?? "";

  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => toDateInput(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("meeting");
  const [startAt, setStartAt] = useState(() => toDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [endAt, setEndAt] = useState(() => toDateTimeInput(new Date(Date.now() + 25 * 60 * 60 * 1000)));
  const [taskId, setTaskId] = useState("");

  const calendarQuery = useCalendarEntriesQuery(resolvedOrgId, { from, to });
  const planningQuery = usePlanningTasksQuery(resolvedOrgId, activeRepoId ?? undefined);
  const createEventMutation = useCreateScheduleEventMutation(resolvedOrgId);

  const groupedEntries = useMemo(() => {
    const entries = calendarQuery.data?.entries ?? [];
    return entries.reduce<Record<string, typeof entries>>((acc, entry) => {
      const key = String(entry.startAt ?? entry.endAt ?? "미정").slice(0, 10);
      acc[key] ??= [];
      acc[key].push(entry);
      return acc;
    }, {});
  }, [calendarQuery.data?.entries]);

  const onCreateEvent = async () => {
    if (!resolvedOrgId || !title.trim()) {
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        taskId: taskId || undefined,
      });
      setTitle("");
      setDescription("");
      setTaskId("");
      toast.success("일정을 추가했습니다.");
    } catch (error) {
      toast.error(getApiErrorDescription(error, "일정 생성에 실패했습니다."));
    }
  };

  if (calendarQuery.isLoading || planningQuery.isLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (calendarQuery.isError || planningQuery.isError) {
    const error = calendarQuery.error ?? planningQuery.error;
    return <ErrorState title="일정 화면을 불러오지 못했습니다" description={getApiErrorDescription(error, "잠시 후 다시 시도해 주세요.")} />;
  }

  if (!resolvedOrgId) {
    return <EmptyState title="조직을 먼저 연결해 주세요" description="GitHub 조직을 연결하면 일정 집계를 사용할 수 있습니다." />;
  }

  const entries = calendarQuery.data?.entries ?? [];
  const tasks = planningQuery.data?.tasks ?? [];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Calendar</p>
        <h2 className="text-2xl font-bold">팀 일정 아젠다</h2>
        <p className="text-sm text-muted-foreground">계획 작업, 협업 요청, 독립 이벤트를 한 화면에서 관리합니다.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="calendar-from">조회 시작</Label>
              <Input id="calendar-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="calendar-to">조회 종료</Label>
              <Input id="calendar-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          </div>

          {!entries.length ? (
            <EmptyState title="표시할 일정이 없습니다" description="작업 마감일이나 협업 요청이 생기면 이 화면에 함께 모입니다." />
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEntries)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([day, dayEntries]) => (
                  <div key={day} className="space-y-2">
                    <h3 className="text-sm font-semibold">{day}</h3>
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <article key={entry.id} className="rounded-lg border border-border bg-background/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{entry.title}</p>
                              <p className="text-xs text-muted-foreground">{entry.description || "설명 없음"}</p>
                            </div>
                            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{entry.source}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(entry.startAt)} - {formatDate(entry.endAt)}</span>
                            {entry.status ? <span>status {entry.status}</span> : null}
                            {entry.linkedIssueId ? <span>linked issue {entry.linkedIssueId}</span> : null}
                            {entry.taskId ? <span>task {entry.taskId}</span> : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="event-title">독립 일정 제목</Label>
              <Input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 스프린트 계획 회의" />
            </div>
            <div>
              <Label htmlFor="event-description">설명</Label>
              <Textarea id="event-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="회의 목적이나 메모" />
            </div>
            <div>
              <Label htmlFor="event-type">이벤트 유형</Label>
              <Select id="event-type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="meeting">meeting</option>
                <option value="milestone">milestone</option>
                <option value="event">event</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="event-start">시작</Label>
              <Input id="event-start" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="event-end">종료</Label>
              <Input id="event-end" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="event-task">연결 작업</Label>
              <Select id="event-task" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
                <option value="">연결 안 함</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </Select>
            </div>
            <Button onClick={onCreateEvent} disabled={createEventMutation.isPending || !title.trim()} className="w-full">
              {createEventMutation.isPending ? "추가 중..." : "일정 추가"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
