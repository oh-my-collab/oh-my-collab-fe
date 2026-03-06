"use client";

type SearchParamsLike = {
  get: (name: string) => string | null;
  toString: () => string;
};

type NullableId = string | null | undefined;

export type ResolveContextInput = {
  pathname: string;
  currentSearchParams?: SearchParamsLike | null;
  routeOrgId?: NullableId;
  routeRepoId?: NullableId;
  storeOrgId?: NullableId;
  storeRepoId?: NullableId;
  defaultOrgId?: NullableId;
  includeRepoIdInQuery?: boolean;
  allowStoreFallback?: boolean;
  allowDefaultOrgFallback?: boolean;
};

export type ResolvedContext = {
  orgId: string | null;
  repoId: string | null;
  canonicalUrl: string | null;
  usesRouteContext: boolean;
  urlOrgId: string | null;
  urlRepoId: string | null;
};

export type BuildContextHrefInput = {
  searchParams?: SearchParamsLike | null;
  orgId?: NullableId;
  repoId?: NullableId;
  includeRepoId?: boolean;
};

export type BuildCurrentPageHrefInput = {
  pathname: string;
  searchParams?: SearchParamsLike | null;
  orgId?: NullableId;
  repoId?: NullableId;
};

function normalizeId(value: NullableId) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cloneSearchParams(searchParams?: SearchParamsLike | null) {
  return new URLSearchParams(searchParams?.toString() ?? "");
}

function buildHref(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function extractRouteContext(pathname: string) {
  const match = pathname.match(/^\/orgs\/([^/]+)(?:\/repos\/([^/]+))?$/);
  return {
    orgId: normalizeId(match?.[1]),
    repoId: normalizeId(match?.[2]),
  };
}

export function shouldIncludeRepoIdForPathname(pathname: string) {
  return pathname === "/board" || pathname === "/issues";
}

export function buildContextHref(pathname: string, input: BuildContextHrefInput) {
  const searchParams = cloneSearchParams(input.searchParams);
  const orgId = normalizeId(input.orgId);
  const repoId = normalizeId(input.repoId);

  if (orgId) {
    searchParams.set("orgId", orgId);
  } else {
    searchParams.delete("orgId");
  }

  if (input.includeRepoId && repoId) {
    searchParams.set("repoId", repoId);
  } else {
    searchParams.delete("repoId");
  }

  return buildHref(pathname, searchParams);
}

export function buildCurrentPageHref(input: BuildCurrentPageHrefInput) {
  const orgId = normalizeId(input.orgId);
  const repoId = normalizeId(input.repoId);
  const routeContext = extractRouteContext(input.pathname);

  if (routeContext.orgId && orgId) {
    return repoId ? `/orgs/${orgId}/repos/${repoId}` : `/orgs/${orgId}`;
  }

  return buildContextHref(input.pathname, {
    searchParams: input.searchParams,
    orgId,
    repoId,
    includeRepoId: shouldIncludeRepoIdForPathname(input.pathname),
  });
}

export function selectRepoIdForOrganization(repoIds: string[], currentRepoId?: NullableId) {
  const normalizedCurrentRepoId = normalizeId(currentRepoId);
  if (normalizedCurrentRepoId && repoIds.includes(normalizedCurrentRepoId)) {
    return normalizedCurrentRepoId;
  }

  return repoIds[0] ?? null;
}

export function resolveContext(input: ResolveContextInput): ResolvedContext {
  const pathname = input.pathname;
  const currentSearchParams = cloneSearchParams(input.currentSearchParams);
  const routeContext = extractRouteContext(pathname);
  const routeOrgId = normalizeId(input.routeOrgId) ?? routeContext.orgId;
  const routeRepoId = normalizeId(input.routeRepoId) ?? routeContext.repoId;

  if (routeOrgId) {
    return {
      orgId: routeOrgId,
      repoId: routeRepoId,
      canonicalUrl: null,
      usesRouteContext: true,
      urlOrgId: routeOrgId,
      urlRepoId: routeRepoId,
    };
  }

  const urlOrgId = normalizeId(currentSearchParams.get("orgId"));
  const urlRepoId = normalizeId(currentSearchParams.get("repoId"));
  const storeOrgId = normalizeId(input.storeOrgId);
  const storeRepoId = normalizeId(input.storeRepoId);
  const defaultOrgId = normalizeId(input.defaultOrgId);
  const allowStoreFallback = input.allowStoreFallback !== false;
  const allowDefaultOrgFallback = input.allowDefaultOrgFallback !== false;
  const includeRepoIdInQuery = input.includeRepoIdInQuery === true;

  const orgId =
    urlOrgId ??
    (allowStoreFallback ? storeOrgId : null) ??
    (allowDefaultOrgFallback ? defaultOrgId : null);

  const canUseStoreRepo =
    allowStoreFallback && Boolean(orgId) && Boolean(storeRepoId) && storeOrgId === orgId;
  const repoId = includeRepoIdInQuery ? urlRepoId ?? (canUseStoreRepo ? storeRepoId : null) : null;

  const nextUrl = orgId
    ? buildContextHref(pathname, {
        searchParams: currentSearchParams,
        orgId,
        repoId,
        includeRepoId: includeRepoIdInQuery,
      })
    : null;
  const currentUrl = buildHref(pathname, currentSearchParams);

  return {
    orgId,
    repoId,
    canonicalUrl: nextUrl && nextUrl !== currentUrl ? nextUrl : null,
    usesRouteContext: false,
    urlOrgId,
    urlRepoId,
  };
}
