export const DEFAULT_POST_AUTH_REDIRECT_PATH = "/orgs";

type SearchParamsLike = {
  get(name: string): string | null;
} | null | undefined;

function isSafeInternalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

export function readRedirectedFrom(searchParams: SearchParamsLike) {
  const redirectedFrom = searchParams?.get("redirectedFrom")?.trim();
  if (!redirectedFrom) return null;
  return isSafeInternalPath(redirectedFrom) ? redirectedFrom : null;
}

export function getPostAuthRedirectPath(searchParams: SearchParamsLike) {
  return readRedirectedFrom(searchParams) ?? DEFAULT_POST_AUTH_REDIRECT_PATH;
}

export function withRedirectedFrom(path: string, redirectedFrom: string | null) {
  if (!redirectedFrom) return path;
  const params = new URLSearchParams({ redirectedFrom });
  return `${path}?${params.toString()}`;
}