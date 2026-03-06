"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

import { useCreateRequestMutation } from "@/features/requests/mutations";
import { createRequestSchema } from "@/features/shared/schemas";
import type { User } from "@/features/shared/types";
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

type FormValues = z.infer<typeof createRequestSchema>;

export function RequestComposerModal({
  orgId,
  fromUserId,
  users,
}: {
  orgId: string;
  fromUserId: string;
  users: User[];
}) {
  const [open, setOpen] = useState(false);
  const mutation = useCreateRequestMutation(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      orgId,
      fromUserId,
      toUserId: users.find((user) => user.id !== fromUserId)?.id,
      type: "review",
      message: "",
      fromDate: "",
      toDate: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("협업 요청을 전송했습니다. 이메일 알림이 발송되었습니다.");
      form.reset({ ...values, message: "" });
      setOpen(false);
    } catch (createError) {
      toast.error(getApiErrorDescription(createError, "협업 요청 전송에 실패했습니다."));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>협업 요청 보내기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>협업 요청 작성</DialogTitle>
          <DialogDescription>요청 메시지, 기간, 유형을 지정해 바로 인박스로 전달합니다.</DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="request-to-user">요청 대상</Label>
            <Select id="request-to-user" {...form.register("toUserId")}>
              {users
                .filter((user) => user.id !== fromUserId)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="request-type">요청 유형</Label>
            <Select id="request-type" {...form.register("type")}>
              <option value="review">코드 리뷰</option>
              <option value="pair_programming">페어 프로그래밍</option>
              <option value="bug_fix">버그 해결</option>
              <option value="architecture">아키텍처 논의</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="request-message">요청 메시지</Label>
            <Textarea id="request-message" {...form.register("message")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="request-from-date">시작일</Label>
              <Input id="request-from-date" type="date" {...form.register("fromDate")} />
            </div>
            <div>
              <Label htmlFor="request-to-date">종료일</Label>
              <Input id="request-to-date" type="date" {...form.register("toDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "전송 중..." : "요청 전송"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
