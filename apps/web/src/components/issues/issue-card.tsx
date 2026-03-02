import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Issue } from "@/features/shared/types";

function statusLabel(status: Issue["status"]) {
  switch (status) {
    case "backlog":
      return "Backlog";
    case "in_progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return status;
  }
}

function statusTone(status: Issue["status"]) {
  switch (status) {
    case "done":
      return "success" as const;
    case "review":
      return "warn" as const;
    case "in_progress":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Card className="transition hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={statusTone(issue.status)}>{statusLabel(issue.status)}</Badge>
          <span className="text-xs text-muted-foreground">{issue.id}</span>
        </div>
        <CardTitle className="text-sm leading-5">
          <Link href={`/issues/${issue.id}?orgId=${issue.orgId}`} className="hover:underline">
            {issue.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p>우선순위: {issue.priority}</p>
        <p>담당자: {issue.assigneeId ?? "미지정"}</p>
        <p>마감일: {formatDate(issue.dueDate)}</p>
      </CardContent>
    </Card>
  );
}