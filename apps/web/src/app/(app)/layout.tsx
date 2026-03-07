import { Suspense } from "react";

import { AppShell, SessionGateFallback } from "@/components/app-shell/app-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SessionGateFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}