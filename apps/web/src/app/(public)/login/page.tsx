"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { useLoginMutation, useSessionQuery } from "@/features/auth/queries";
import { loginSchema } from "@/features/shared/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getApiErrorDescription } from "@/lib/api/error";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const sessionQuery = useSessionQuery();
  const loginMutation = useLoginMutation();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (sessionQuery.data?.user) {
      router.replace("/orgs");
    }
  }, [router, sessionQuery.data?.user]);

  const onLogin = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
      toast.success("로그인되었습니다.");
      router.push("/orgs");
      router.refresh();
    } catch (error) {
      toast.error(getApiErrorDescription(error, "로그인에 실패했습니다."));
    }
  });

  const sessionErrorDescription = sessionQuery.isError
    ? getApiErrorDescription(sessionQuery.error, "세션 상태를 불러오지 못했습니다.")
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>이메일과 비밀번호로 세션을 시작하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionErrorDescription ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {sessionErrorDescription}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onLogin}>
            <div className="space-y-1">
              <Label htmlFor="login-email">이메일</Label>
              <Input id="login-email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">비밀번호</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            계정이 없나요?{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
