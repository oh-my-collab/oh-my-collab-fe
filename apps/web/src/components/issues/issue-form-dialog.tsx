"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";

import { useCreateIssueMutation } from "@/features/issues/mutations";
import type { User } from "@/features/shared/types";
import { createIssueSchema } from "@/features/shared/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorDescription } from "@/lib/api/error";

type FormValues = z.input<typeof createIssueSchema>;

export function IssueFormDialog({
  orgId,
  repoId,
  users,
  currentUserId,
}: {
  orgId: string;
  repoId: string;
  users: User[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const mutation = useCreateIssueMutation(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      orgId,
      repoId,
      title: "",
      description: "",
      status: "backlog",
      assigneeId: users[0]?.id,
      labelIds: [],
      priority: "medium",
      dueDate: undefined,
      estimatePoints: 3,
      difficultyScore: 50,
      impactScore: 50,
      createdBy: currentUserId,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        ...values,
        labelIds: values.labelIds,
      });
      toast.success("이슈를 생성했습니다.");
      form.reset({ ...values, title: "", description: "" });
      setOpen(false);
    } catch (createError) {
      toast.error(getApiErrorDescription(createError, "이슈 생성에 실패했습니다."));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button aria-label="이슈 생성">이슈 생성</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 이슈 생성</DialogTitle>
          <DialogDescription>요청 내용을 입력하고 바로 보드/리스트에 반영합니다.</DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="issue-title">제목</Label>
            <Input id="issue-title" {...form.register("title")} />
          </div>

          <div>
            <Label htmlFor="issue-description">설명</Label>
            <Textarea id="issue-description" {...form.register("description")} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="issue-assignee">담당자</Label>
              <Select id="issue-assignee" {...form.register("assigneeId")}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="issue-priority">우선순위</Label>
              <Select id="issue-priority" {...form.register("priority")}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="issue-status">상태</Label>
              <Select id="issue-status" {...form.register("status")}>
                <option value="backlog">backlog</option>
                <option value="in_progress">in_progress</option>
                <option value="review">review</option>
                <option value="done">done</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="issue-dueDate">마감일</Label>
              <Input id="issue-dueDate" type="date" {...form.register("dueDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
