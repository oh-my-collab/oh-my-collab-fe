"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { launchGitHubBootstrap, launchGitHubInstall } from "@/features/github/browser";
import { useGitHubStatusQuery } from "@/features/github/queries";
import { useOrganizationsQuery } from "@/features/orgs/queries";
import { useUiStore } from "@/features/shared/ui-store";
import {
  useSettingsQuery,
  useTransferPlatformOwnerMutation,
  useUpdateSettingsMutation,
} from "@/features/settings/queries";
import { getApiErrorDescription } from "@/lib/api/error";

const schema = z.object({
  defaultOrgId: z.string().min(1),
  emailNotifications: z.boolean(),
  mentionNotifications: z.boolean(),
  issueStatusNotifications: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const activeOrgId = useUiStore((state) => state.activeOrgId);
  const setActiveOrgId = useUiStore((state) => state.setActiveOrgId);

  const orgQuery = useOrganizationsQuery();
  const githubStatusQuery = useGitHubStatusQuery();
  const resolvedOrgId = activeOrgId ?? orgQuery.data?.defaultOrgId ?? "";

  const settingsQuery = useSettingsQuery(resolvedOrgId);
  const updateMutation = useUpdateSettingsMutation(resolvedOrgId);
  const transferOwnerMutation = useTransferPlatformOwnerMutation();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultOrgId: "",
      emailNotifications: true,
      mentionNotifications: true,
      issueStatusNotifications: true,
    },
  });

  useEffect(() => {
    if (!activeOrgId && orgQuery.data?.defaultOrgId) {
      setActiveOrgId(orgQuery.data.defaultOrgId);
    }
  }, [activeOrgId, orgQuery.data?.defaultOrgId, setActiveOrgId]);

  useEffect(() => {
    if (!settingsQuery.data?.settings) return;

    form.reset({
      defaultOrgId: settingsQuery.data.settings.defaultOrgId,
      emailNotifications: settingsQuery.data.settings.emailNotifications,
      mentionNotifications: settingsQuery.data.settings.mentionNotifications,
      issueStatusNotifications: settingsQuery.data.settings.issueStatusNotifications,
    });
  }, [form, settingsQuery.data?.settings]);

  if (orgQuery.isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (orgQuery.isError) {
    return (
      <ErrorState
        title="설정 정보를 불러오지 못했습니다"
        description={getApiErrorDescription(orgQuery.error, "잠시 후 다시 시도해 주세요.")}
      />
    );
  }

  const github = githubStatusQuery.data?.github;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("설정을 저장했습니다.");
    } catch (error) {
      toast.error(getApiErrorDescription(error, "설정 저장에 실패했습니다."));
    }
  });

  const onSetupGitHub = async () => {
    try {
      setIsBootstrapping(true);
      await launchGitHubBootstrap();
    } catch (error) {
      toast.error(getApiErrorDescription(error, "GitHub App 설정을 시작하지 못했습니다."));
      setIsBootstrapping(false);
    }
  };

  const onTransferPlatformOwner = async () => {
    if (!transferEmail.trim()) {
      toast.error("양도할 사용자 이메일을 입력해 주세요.");
      return;
    }

    try {
      const result = await transferOwnerMutation.mutateAsync(transferEmail.trim());
      toast.success(`${result.owner.email} 계정으로 플랫폼 오너 권한을 양도했습니다.`);
      setTransferEmail("");
    } catch (error) {
      toast.error(getApiErrorDescription(error, "플랫폼 오너 권한을 양도하지 못했습니다."));
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Settings</p>
        <h2 className="text-2xl font-bold">조직/연동 설정</h2>
        <p className="text-sm text-muted-foreground">기본 조직과 알림 정책, GitHub 연동 상태를 한곳에서 관리합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <p className="font-semibold">클릭형 GitHub App 부트스트랩</p>
            <p className="text-muted-foreground">
              {githubStatusQuery.isLoading
                ? "GitHub 연동 상태를 확인하는 중입니다."
                : github?.configured
                  ? `연동 준비 완료. 설치 ${github.installationCount}건`
                  : "아직 GitHub App이 준비되지 않았습니다."}
            </p>
            {github?.ownerEmail ? <p className="text-xs text-muted-foreground">현재 플랫폼 오너: {github.ownerEmail}</p> : null}
            {github?.appUrl ? (
              <a href={github.appUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                GitHub App 설정 열기
              </a>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!github?.configured && github?.canBootstrap ? (
              <Button onClick={onSetupGitHub} disabled={isBootstrapping || githubStatusQuery.isLoading}>
                {isBootstrapping ? "GitHub App 생성 중..." : "GitHub App 설정"}
              </Button>
            ) : null}
            {github?.configured ? (
              <Button onClick={launchGitHubInstall}>GitHub 조직 연결</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Owner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold">플랫폼 오너 권한</p>
            <p className="text-muted-foreground">
              첫 가입자는 자동으로 플랫폼 오너가 됩니다. 이 권한은 GitHub App 설정 시작 권한과 함께 양도됩니다.
            </p>
            {github?.ownerEmail ? <p className="text-xs text-muted-foreground">현재 플랫폼 오너: {github.ownerEmail}</p> : null}
          </div>

          {github?.platformOwner ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="platform-owner-email">양도할 사용자 이메일</Label>
                <Input
                  id="platform-owner-email"
                  type="email"
                  placeholder="next-owner@example.com"
                  value={transferEmail}
                  onChange={(event) => setTransferEmail(event.target.value)}
                />
              </div>
              <Button type="button" onClick={onTransferPlatformOwner} disabled={transferOwnerMutation.isPending || githubStatusQuery.isLoading}>
                {transferOwnerMutation.isPending ? "양도 중..." : "오너 권한 양도"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              현재 계정은 플랫폼 오너가 아니므로 권한 양도를 실행할 수 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {resolvedOrgId ? (
        settingsQuery.isLoading ? (
          <TableSkeleton rows={4} />
        ) : settingsQuery.isError ? (
          <ErrorState
            title="조직 설정을 불러오지 못했습니다"
            description={getApiErrorDescription(settingsQuery.error, "잠시 후 다시 시도해 주세요.")}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>기본 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="default-org">기본 조직</Label>
                  <Select id="default-org" {...form.register("defaultOrgId")}>
                    {(orgQuery.data?.organizations ?? []).map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2 rounded-md border border-border p-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...form.register("emailNotifications")} /> 이메일 알림
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...form.register("mentionNotifications")} /> 멘션 알림
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...form.register("issueStatusNotifications")} /> 이슈 상태 변경 알림
                  </label>
                </div>

                <Button type="submit" disabled={updateMutation.isPending || !resolvedOrgId}>
                  {updateMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>기본 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">조직을 연결한 뒤 기본 조직과 알림 정책을 설정할 수 있습니다.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
