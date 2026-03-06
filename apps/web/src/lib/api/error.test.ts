import { describe, expect, it } from "vitest";

import { type ApiError, CONFIG_MISSING_API_BASE_URL } from "./backend-client";
import { getApiErrorDescription, isUnauthorizedApiError } from "./error";

function createApiError({
  message = "Unexpected failure",
  code,
  status = 500,
  requestId,
}: Partial<ApiError> = {}) {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.status = status;
  error.requestId = requestId;
  return error;
}

describe("getApiErrorDescription", () => {
  it("returns a config guidance message when API base URL is missing", () => {
    expect(getApiErrorDescription(new Error(CONFIG_MISSING_API_BASE_URL), "fallback")).toContain(
      "NEXT_PUBLIC_API_BASE_URL"
    );
  });

  it("returns a session-expired message for unauthorized errors", () => {
    const error = createApiError({
      message: "Session expired.",
      code: "UNAUTHORIZED",
      status: 401,
      requestId: "req-401",
    });

    expect(getApiErrorDescription(error, "fallback")).toBe(
      "세션이 만료되었습니다. 다시 로그인해 주세요. (요청 ID: req-401)"
    );
  });

  it("returns a refresh guidance message for version conflicts", () => {
    const error = createApiError({
      message: "Latest version conflict.",
      code: "VERSION_CONFLICT",
      status: 409,
    });

    expect(getApiErrorDescription(error, "fallback")).toBe(
      "최신 데이터를 새로고침한 뒤 다시 시도해 주세요."
    );
  });

  it("prefers a meaningful backend message and appends requestId", () => {
    const error = createApiError({
      message: "Repository sync is delayed.",
      status: 503,
      requestId: "req-503",
    });

    expect(getApiErrorDescription(error, "fallback")).toBe(
      "Repository sync is delayed. (요청 ID: req-503)"
    );
  });

  it("falls back to the provided fallback when message is not meaningful", () => {
    const error = createApiError({
      message: "HTTP_500",
      status: 500,
      requestId: "req-500",
    });

    expect(getApiErrorDescription(error, "잠시 후 다시 시도해 주세요.")).toBe(
      "잠시 후 다시 시도해 주세요. (요청 ID: req-500)"
    );
  });
});

describe("isUnauthorizedApiError", () => {
  it("detects unauthorized errors by status and code", () => {
    expect(
      isUnauthorizedApiError(
        createApiError({
          message: "Unauthorized",
          code: "UNAUTHORIZED",
          status: 401,
        })
      )
    ).toBe(true);
  });

  it("returns false for non-auth errors", () => {
    expect(
      isUnauthorizedApiError(
        createApiError({
          message: "Repository sync is delayed.",
          status: 503,
        })
      )
    ).toBe(false);
  });
});
