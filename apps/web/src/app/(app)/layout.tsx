import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { AUTH_SESSION_COOKIE_NAME } from "@/features/auth/constants";
import { ProtectedSessionBoundary } from "@/features/auth/protected-session-boundary";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    redirect("/login");
  }

  return (
    <AppShell>
      <ProtectedSessionBoundary>{children}</ProtectedSessionBoundary>
    </AppShell>
  );
}
