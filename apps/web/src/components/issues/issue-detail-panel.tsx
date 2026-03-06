"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useUpdateIssueMutation } from "@/features/issues/mutations";
import type { Issue } from "@/features/shared/types";
import { updateIssueSchema } from "@/features/shared/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorDescription } from "@/lib/api/error";
import { formatDate } from "@/lib/utils";

type FormValues = z.input<typeof updateIssueSchema>;

export function IssueDetailPanel({
  issue,
  orgId,
  comments,
}: {
  issue: Issue;
  orgId: string;
  comments: Array<{ id: string; userId: string; body: string; createdAt: string }>;
}) {
  const mutation = useUpdateIssueMutation(orgId, issue.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(updateIssueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      assigneeId: issue.assigneeId,
      priority: issue.priority,
      dueDate: issue.dueDate,
      estimatePoints: issue.estimatePoints,
      difficultyScore: issue.difficultyScore,
      impactScore: issue.impactScore,
    },
  });

  const commentForm = useForm<{ comment: string }>({
    defaultValues: { comment: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("이슈를 업데이트했습니다.");
    } catch (updateError) {
      toast.error(getApiErrorDescription(updateError, "이슈 업데이트에 실패했습니다."));
    }
  });

  const onComment = commentForm.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({ comment: values.comment });
      commentForm.reset();
      toast.success("코멘트를 등록했습니다.");
    } catch (commentError) {
      toast.error(getApiErrorDescription(commentError, "코멘트 등록에 실패했습니다."));
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{issue.id} 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="detail-title">제목</Label>
              <Input id="detail-title" {...form.register("title")} />
            </div>
            <div>
              <Label htmlFor="detail-description">설명</Label>
              <Textarea id="detail-description" {...form.register("description")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="detail-status">상태</Label>
                <Select id="detail-status" {...form.register("status")}>
                  <option value="backlog">backlog</option>
                  <option value="in_progress">in_progress</option>
                  <option value="review">review</option>
                  <option value="done">done</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="detail-priority">우선순위</Label>
                <Select id="detail-priority" {...form.register("priority")}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="detail-dueDate">마감일</Label>
              <Input id="detail-dueDate" type="date" {...form.register("dueDate")} />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              저장
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>코멘트</CardTitle>
          <p className="text-xs text-muted-foreground">최종 업데이트: {formatDate(issue.updatedAt)}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="space-y-2" onSubmit={onComment}>
            <Textarea
              aria-label="코멘트 입력"
              placeholder="추가 질문 또는 진행 상황을 남겨주세요."
              {...commentForm.register("comment", { required: true })}
            />
            <Button type="submit" size="sm">
              코멘트 등록
            </Button>
          </form>
          <ul className="space-y-2">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-md border border-border bg-muted/30 p-2 text-xs">
                <p className="font-semibold">{comment.userId}</p>
                <p className="mt-1 text-muted-foreground">{comment.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(comment.createdAt)}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
