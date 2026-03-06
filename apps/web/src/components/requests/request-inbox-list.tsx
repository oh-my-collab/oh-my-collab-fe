"use client";

import { toast } from "sonner";

import { useUpdateRequestMutation } from "@/features/requests/mutations";
import type { CollabRequest, User } from "@/features/shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { getApiErrorDescription } from "@/lib/api/error";

function statusVariant(status: CollabRequest["status"]) {
  switch (status) {
    case "accepted":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    case "questioned":
      return "warn" as const;
    default:
      return "secondary" as const;
  }
}

function getUserName(users: User[], userId: string) {
  return users.find((user) => user.id === userId)?.name ?? userId;
}

export function RequestInboxList({
  orgId,
  currentUserId,
  requests,
  users,
}: {
  orgId: string;
  currentUserId: string;
  requests: CollabRequest[];
  users: User[];
}) {
  const updateMutation = useUpdateRequestMutation(orgId);
  const [questionMap, setQuestionMap] = useState<Record<string, string>>({});

  const inbox = requests.filter((request) => request.toUserId === currentUserId);
  const sent = requests.filter((request) => request.fromUserId === currentUserId);

  const respond = async (
    requestId: string,
    input: {
      status?: "accepted" | "rejected" | "questioned";
      comment?: string;
    }
  ) => {
    try {
      await updateMutation.mutateAsync({ requestId, input });
      toast.success("요청 상태를 업데이트했습니다.");
      setQuestionMap((prev) => ({ ...prev, [requestId]: "" }));
    } catch (updateError) {
      toast.error(getApiErrorDescription(updateError, "요청 상태 업데이트에 실패했습니다."));
    }
  };

  return (
    <Tabs defaultValue="inbox">
      <TabsList>
        <TabsTrigger value="inbox">받은 요청</TabsTrigger>
        <TabsTrigger value="sent">보낸 요청</TabsTrigger>
      </TabsList>

      <TabsContent value="inbox">
        <div className="space-y-3">
          {inbox.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{request.id} · {request.type}</span>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{request.message}</p>
                <p className="text-xs text-muted-foreground">
                  요청자: {getUserName(users, request.fromUserId)} · 기간: {request.fromDate.slice(0, 10)} ~ {request.toDate.slice(0, 10)}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">이메일 알림 발송됨</p>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => respond(request.id, { status: "accepted" })}>수락</Button>
                  <Button variant="outline" size="sm" onClick={() => respond(request.id, { status: "rejected" })}>거절</Button>
                </div>

                <Textarea
                  value={questionMap[request.id] ?? ""}
                  onChange={(event) =>
                    setQuestionMap((prev) => ({ ...prev, [request.id]: event.target.value }))
                  }
                  placeholder="추가 질문을 남겨주세요"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    respond(request.id, {
                      status: "questioned",
                      comment: questionMap[request.id],
                    })
                  }
                >
                  추가 질문 전송
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="sent">
        <div className="space-y-3">
          {sent.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{request.id} · {request.type}</span>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{request.message}</p>
                <p className="text-xs text-muted-foreground">
                  수신자: {getUserName(users, request.toUserId)} · 이메일 알림 발송됨
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
