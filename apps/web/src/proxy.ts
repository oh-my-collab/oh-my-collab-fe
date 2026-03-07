import type { NextRequest } from "next/server";

import { middleware } from "../middleware";

export function proxy(request: NextRequest) {
  return middleware(request);
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
