/**
 * API Error Handling Utilities
 * Standardized error handling and user-friendly messages
 */

import { AxiosError } from "axios";
import { ApiError } from "@/types";

export class ApiErrorHandler {
  /**
   * Extract error message from API response
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError | undefined;
      return apiError?.message || error.message || "An error occurred";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unknown error occurred";
  }

  /**
   * Check if error is a specific HTTP status
   */
  static isStatusError(error: unknown, status: number): boolean {
    return error instanceof AxiosError && error.response?.status === status;
  }

  /**
   * Check if request was cancelled
   */
  static isCancelledError(error: unknown): boolean {
    return error instanceof AxiosError && error.code === "ECONNABORTED";
  }

  /**
   * Check if error is network related
   */
  static isNetworkError(error: unknown): boolean {
    return error instanceof AxiosError && !error.response;
  }

  /**
   * Get user-friendly error message based on status code
   */
  static getUserFriendlyMessage(status: number): string {
    const messages: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Your session has expired. Please login again.",
      403: "You don't have permission to access this resource.",
      404: "The requested resource was not found.",
      409: "This action conflicts with existing data.",
      429: "Too many requests. Please try again later.",
      500: "Server error. Please try again later.",
      503: "Service temporarily unavailable. Please try again later.",
    };

    return messages[status] || "An error occurred. Please try again.";
  }

  /**
   * Log error for debugging (can be extended with actual logging service)
   */
  static logError(
    context: string,
    error: unknown,
    details?: Record<string, unknown>,
  ): void {
    const timestamp = new Date().toISOString();
    const message = this.getErrorMessage(error);

    console.error(`[${timestamp}] ${context}:`, {
      message,
      error: error instanceof Error ? error.stack : error,
      ...details,
    });

    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    // logService.captureException(error, { context, ...details });
  }
}

/**
 * Type guard for API error response
 */
export const isApiError = (data: unknown): data is ApiError => {
  return (
    typeof data === "object" &&
    data !== null &&
    ("error" in data || "message" in data) &&
    ("success" in data || "code" in data)
  );
};

/**
 * Validation error helper
 */
export interface ValidationError {
  field: string;
  message: string;
}

export const getValidationErrors = (error: unknown): ValidationError[] => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;

    // Handle array format — backend may send 'errors' or 'details'
    const list = data?.errors ?? data?.details;

    if (Array.isArray(list)) {
      return list as ValidationError[];
    }

    if (list && typeof list === "object") {
      return Object.entries(list).map(([field, message]) => ({
        field,
        message: String(message),
      }));
    }
  }

  return [];
};
