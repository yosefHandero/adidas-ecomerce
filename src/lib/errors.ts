/**
 * Standard error codes for API responses
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  QUERY_TOO_LONG = "QUERY_TOO_LONG",
  INVALID_INPUT = "INVALID_INPUT",

  // Rate limiting (429)
  RATE_LIMITED = "RATE_LIMITED",

  // AI Service errors
  CONFIG_ERROR = "CONFIG_ERROR",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  NO_PROVIDERS = "NO_PROVIDERS",

  // Generic server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Standard API error response shape
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown; // Only included in development
  };
  meta?: {
    retryAfter?: number;
    requestId?: string;
  };
}

/**
 * Standard API success response shape
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    cached?: boolean;
    duration?: number;
    requestId?: string;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  options?: {
    details?: unknown;
    retryAfter?: number;
    requestId?: string;
  }
): ApiErrorResponse {
  const error: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  // Include details only in development
  if (process.env.NODE_ENV === "development" && options?.details) {
    error.error.details = options.details;
  }

  if (options?.retryAfter) {
    error.meta = { retryAfter: options.retryAfter };
  }

  if (options?.requestId) {
    error.meta = { ...error.meta, requestId: options.requestId };
  }

  return error;
}

/**
 * Map HTTP status codes to error codes
 */
export function getHttpStatusForErrorCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.QUERY_TOO_LONG:
    case ErrorCode.INVALID_INPUT:
      return 400;
    case ErrorCode.RATE_LIMITED:
      return 429;
    case ErrorCode.CONFIG_ERROR:
    case ErrorCode.INTERNAL_ERROR:
      return 500;
    case ErrorCode.QUOTA_EXCEEDED:
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.TIMEOUT:
      return 503;
    default:
      return 500;
  }
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    cached?: boolean;
    duration?: number;
    requestId?: string;
  }
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (options?.cached || options?.duration || options?.requestId) {
    response.meta = {
      cached: options.cached,
      duration: options.duration,
      requestId: options.requestId,
    };
  }

  return response;
}
