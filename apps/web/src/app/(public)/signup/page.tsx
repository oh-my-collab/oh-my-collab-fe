"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { useSessionQuery, useSignupMutation } from "@/features/auth/queries";
import { signupSchema } from "@/features/shared/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorDescription } from "@/lib/api/error";

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const sessionQuery = useSessionQuery();
  const signupMutation = useSignupMutation();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (sessionQuery.data?.user) {
      router.replace("/orgs");
    }
  }, [router, sessionQuery.data?.user]);

  const onSignup = form.handleSubmit(async (values) => {
    try {
      await signupMutation.mutateAsync(values);
      toast.success("회원가입이 완료되었습니다.");
      router.push("/orgs");
      router.refresh();
    } catch (error) {
      toast.error(getApiErrorDescription(error, "회원가입에 실패했습니다."));
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>이름, 이메일, 비밀번호를 입력해 새 계정을 만드세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSignup}>
            <div className="space-y-1">
              <Label htmlFor="signup-name">이름</Label>
              <Input id="signup-name" autoComplete="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="signup-email">이메일</Label>
              <Input id="signup-email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="signup-password">비밀번호</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button className="w-full" type="submit" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? "가입 중..." : "회원가입"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
