import type { NextRequest } from "next/server";

import { handleProtectedRoute } from "./features/auth/protected-route";

export function proxy(request: NextRequest) {
  return handleProtectedRoute(request);
}

export const config = {
  matcher: [
    "/orgs/:path*",
    "/board/:path*",
    "/issues/:path*",
    "/requests/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
