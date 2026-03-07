export const DEFAULT_API_ACCESS_COOKIE_NAME = "ohmc_access";
export const DEFAULT_API_REFRESH_COOKIE_NAME = "ohmc_refresh";

export function getApiAccessCookieName() {
  return process.env.API_ACCESS_COOKIE_NAME?.trim() || DEFAULT_API_ACCESS_COOKIE_NAME;
}

export function getApiRefreshCookieName() {
  return process.env.API_REFRESH_COOKIE_NAME?.trim() || DEFAULT_API_REFRESH_COOKIE_NAME;
}
