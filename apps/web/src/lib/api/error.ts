import { type ApiError, CONFIG_MISSING_API_BASE_URL } from "@/lib/api/backend-client";

const apiConfigErrorMessage =
  "백엔드 API 주소가 설정되지 않았습니다. NEXT_PUBLIC_API_BASE_URL 환경 변수를 확인해 주세요.";
const sessionExpiredMessage = "세션이 만료되었습니다. 다시 로그인해 주세요.";
const versionConflictMessage = "최신 데이터를 새로고침한 뒤 다시 시도해 주세요.";

function asApiError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const candidate = error as Partial<ApiError>;
  if (
    typeof candidate.status === "number" ||
    typeof candidate.code === "string" ||
    typeof candidate.requestId === "string" ||
    "issues" in candidate
  ) {
    return candidate as ApiError;
  }

  return null;
}

function isMeaningfulMessage(message: string | undefined) {
  return Boolean(message && !/^HTTP_\d+$/.test(message) && message !== CONFIG_MISSING_API_BASE_URL);
}

function withRequestId(message: string, requestId?: string) {
  return requestId ? `${message} (요청 ID: ${requestId})` : message;
}

export function isUnauthorizedApiError(error: unknown) {
  const apiError = asApiError(error);
  if (!apiError) {
    return false;
  }

  return apiError.status === 401 || apiError.code === "UNAUTHORIZED" || apiError.message === "UNAUTHORIZED";
}

export function getApiErrorDescription(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === CONFIG_MISSING_API_BASE_URL) {
    return apiConfigErrorMessage;
  }

  const apiError = asApiError(error);
  if (!apiError) {
    return fallback;
  }

  if (isUnauthorizedApiError(apiError)) {
    return withRequestId(sessionExpiredMessage, apiError.requestId);
  }

  if (apiError.code === "VERSION_CONFLICT") {
    return withRequestId(versionConflictMessage, apiError.requestId);
  }

  if (isMeaningfulMessage(apiError.message)) {
    return withRequestId(apiError.message, apiError.requestId);
  }

  return withRequestId(fallback, apiError.requestId);
}
