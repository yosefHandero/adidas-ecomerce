/**
 * Client-side API utilities
 * Handles both old and new response formats for backward compatibility
 */

import type { ApiResponse } from "./errors";

/**
 * Type guard to check if response is the new format
 */
function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    response !== null &&
    typeof response === "object" &&
    "success" in response &&
    typeof (response as { success: unknown }).success === "boolean"
  );
}

/**
 * Parse API response (handles both old and new formats)
 */
export function parseApiResponse<T>(response: unknown): T {
  if (isApiResponse<T>(response)) {
    if (response.success && "data" in response) {
      return response.data;
    }
    throw new Error(
      response.success === false
        ? response.error.message
        : "Invalid API response format"
    );
  }

  // Old format: T directly
  return response as T;
}

/**
 * Parse API error response (handles both old and new formats)
 */
export function parseApiError(response: unknown): {
  error: string;
  code?: string;
} {
  // New format: { success: false, error: { code, message } }
  if (isApiResponse<never>(response) && !response.success) {
    return {
      error: response.error.message,
      code: response.error.code,
    };
  }

  // Old format: { error: string, code?: string }
  if (
    response &&
    typeof response === "object" &&
    "error" in response &&
    typeof (response as { error: unknown }).error === "string"
  ) {
    const oldFormat = response as { error: string; code?: string };
    return {
      error: oldFormat.error,
      code: oldFormat.code,
    };
  }

  // Fallback
  return {
    error: "An unexpected error occurred",
  };
}

/**
 * Get user-friendly error message from API error response
 * Handles error codes, status codes, and Retry-After headers
 */
export function getUserFriendlyErrorMessage(
  errorData: { error: string; code?: string },
  response?: Response
): string {
  const { error, code } = errorData;
  const retryAfter = response?.headers.get("Retry-After");
  const status = response?.status;

  // Helper to format retry message
  const formatRetryMessage = (baseMessage: string): string => {
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return `${baseMessage} Please try again in ${seconds} second${
        seconds !== 1 ? "s" : ""
      }.`;
    }
    return baseMessage;
  };

  // Handle specific error codes
  switch (code) {
    case "VALIDATION_ERROR":
      return `Invalid input: ${error}`;
    case "CONFIG_ERROR":
      return error || "AI service is not properly configured. Please check your API keys.";
    case "QUOTA_EXCEEDED":
      return formatRetryMessage(
        error || "AI service quota exceeded. Please try again later."
      );
    case "RATE_LIMITED":
    case "RATE_LIMIT_EXCEEDED":
      return formatRetryMessage(
        error || "Too many requests. Please wait before trying again."
      );
    case "UPSTREAM_UNAVAILABLE":
      return formatRetryMessage(
        error || "Service temporarily unavailable. Please try again later."
      );
    case "INVALID_RESPONSE":
      return error || "AI service returned an invalid response. Please try again.";
    case "NETWORK_ERROR":
      return error || "Network error. Please check your connection and try again.";
    case "NO_PROVIDERS":
      return error || "No AI providers are available. Please check your API key configuration.";
  }

  // Fallback to status code-based messages if no error code
  if (status) {
    if (status === 400) {
      return "Invalid request. Please check your input.";
    }
    if (status === 429 || status === 503) {
      return formatRetryMessage(
        status === 429
          ? "Too many requests. Please wait before trying again."
          : "Service temporarily unavailable. Please try again later."
      );
    }
    if (status >= 500) {
      return "Server error. Please try again later.";
    }
    if (status === 401) {
      return "Authentication failed. Please check your API keys.";
    }
    if (status === 403) {
      return "Access forbidden. Please check your permissions.";
    }
    if (status === 404) {
      return "Service not found. Please try again later.";
    }
  }

  // Use the error message from API if available, otherwise generic message
  return error || "An unexpected error occurred";
}
