/**
 * Axios Configuration & HTTP Client Setup
 * Hybrid Token Refresh Strategy with HttpOnly Cookies
 *
 * Strategy:
 * 1. accessToken is stored in HttpOnly cookie (set by server, auto-sent by browser)
 * 2. refreshToken is stored in HttpOnly cookie (7 days expiry)
 * 3. Request Interceptor: Check if accessToken is about to expire and refresh if needed
 * 4. Response Interceptor: If 401, refresh token automatically and retry
 * 5. No manual token management needed - cookies handle it all
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { ApiErrorHandler } from "@/services/utils/apiErrors";
import { ApiResponse } from "@/types";
import { showToast } from "@/lib/toast";
import i18n from "@/i18n/config";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "/api/v1";

const REQUEST_TIMEOUT = 30000; // 30 seconds

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((accessToken: string) => void)[] = [];
// Promise used to deduplicate concurrent proactive refreshes
let refreshPromise: Promise<void> | null = null;

const translate = (
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>,
) => i18n.t(key, { defaultValue, ...options });

/**
 * Notify all pending requests when token is refreshed
 */
const onRefreshed = (accessToken: string) => {
  refreshSubscribers.forEach((callback) => callback(accessToken));
  refreshSubscribers = [];
};

/**
 * Subscribe to token refresh event
 */
const addRefreshSubscriber = (callback: (accessToken: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Creates and configures the Axios instance
 * Sets up interceptors for authentication and error handling
 * withCredentials: true allows cookies to be sent with requests
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // IMPORTANT: Enable cookies to be sent with requests
  });

  /**
   * Request Interceptor - Hybrid Strategy Part 1
   * Pre-emptively refresh token if it's about to expire (< 1 minute left)
   */
  client.interceptors.request.use(
    async (config) => {
      try {
        // Handle FormData - prevent transformation and let browser set Content-Type
        if (config.data instanceof FormData) {
          // Delete Content-Type to let browser set it with proper boundary
          if (config.headers) {
            delete config.headers["Content-Type"];
          }
        }

        // Add Authorization header with token from store
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add Accept-Language header based on current language
        const currentLanguage =
          i18n.resolvedLanguage || localStorage.getItem("i18nextLng") || "ar";
        if (config.headers) {
          config.headers["Accept-Language"] = currentLanguage;
        }

        // Check if token expiry info is in localStorage (optional, for optimization)
        const expiresIn = localStorage.getItem("tokenExpiresIn");
        const loginTime = localStorage.getItem("loginTime");

        if (expiresIn && loginTime) {
          const loginTimeNum = parseInt(loginTime, 10);
          const expiresInNum = parseInt(expiresIn, 10);
          const now = Date.now();
          const timeElapsed = (now - loginTimeNum) / 1000; // in seconds
          const timeLeft = expiresInNum - timeElapsed;

          // If token expires in less than 60 seconds, refresh now
          // Guard with isRefreshing to avoid race with response interceptor
          if (timeLeft < 60 && timeLeft > 0 && !isRefreshing) {
            if (!refreshPromise) {
              refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
              });
            }
            await refreshPromise;
          }
        }
      } catch (error) {
        // If optimization fails, no problem - response interceptor will handle it
        ApiErrorHandler.logError("Request interceptor check failed", error);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  /**
   * Response Interceptor - Hybrid Strategy Part 2
   * Handle 401 errors by refreshing token and retrying
   */
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean;
      };

      const requestUrl = originalRequest.url || "";
      const isLoginEndpoint = requestUrl.includes("/auth/login");
      const isRefreshEndpoint = requestUrl.includes("/auth/refresh");

      // Handle 401 Unauthorized - Token expired or invalid
      // Skip refresh logic for login and refresh endpoints
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isLoginEndpoint &&
        !isRefreshEndpoint
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._retry = true;

          try {
            // Get refresh token from store
            const refreshToken = useAuthStore.getState().refreshToken;

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            // Call refresh endpoint with refresh token in body
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken }, // Send refresh token in body
              {
                timeout: REQUEST_TIMEOUT,
                withCredentials: true, // Send cookies
              },
            );

            // Extract new tokens from response
            const tokensData = response.data?.data || response.data;
            const newAccessToken = tokensData?.accessToken;
            const newRefreshToken = tokensData?.refreshToken;
            const newExpiresIn = tokensData?.expiresIn || 900;

            // Update store with new tokens
            if (newAccessToken) {
              useAuthStore.getState().setToken(newAccessToken);
            }
            if (newRefreshToken) {
              useAuthStore.getState().setRefreshToken(newRefreshToken);
            }

            // Store new expiry info for optimization
            localStorage.setItem("tokenExpiresIn", newExpiresIn.toString());
            localStorage.setItem("loginTime", Date.now().toString());

            isRefreshing = false;
            onRefreshed(newAccessToken || "");

            // Retry original request with new token
            if (originalRequest.headers && newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return client(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            refreshSubscribers = [];

            // Refresh failed - logout user
            try {
              const { logout } = useAuthStore.getState();
              logout();
            } catch {
              // Silent catch - logout might fail
            }

            // Clear stored token info
            localStorage.removeItem("tokenExpiresIn");
            localStorage.removeItem("loginTime");
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");

            ApiErrorHandler.logError("Token refresh failed", refreshError);

            // Redirect to login
            window.location.href = "/signin";
          }
        } else {
          // Token refresh is in progress - wait for it
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken: string) => {
              originalRequest.headers = originalRequest.headers || {};
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return resolve(client(originalRequest));
            });
          });
        }
      }

      // Log error for debugging
      ApiErrorHandler.logError(`API Error [${error.response?.status}]`, error, {
        url: error.config?.url,
        method: error.config?.method,
      });

      // Show user-friendly error message as toast
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      const status = error.response?.status;
      const url = error.config?.url || "";
      const method = error.config?.method || "";

      // Don't show toast for 401 errors (handled by redirect to login)
      // Don't show toast for login endpoint (handled by useLogin mutation)
      // Don't show toast for mutation endpoints that have their own error handling
      const isMutation = method !== "get";

      // Network/timeout errors have no HTTP status; show explicit message.
      if (!status) {
        if (error.code === "ECONNABORTED") {
          showToast.error(
            translate(
              "auth.apiErrors.requestTimeout",
              "Request timed out. Please try again.",
            ),
          );
        } else if (ApiErrorHandler.isNetworkError(error)) {
          showToast.error(
            translate(
              "auth.apiErrors.networkUnavailable",
              "Unable to connect to the server. Check your network and try again.",
            ),
          );
        } else {
          showToast.error(errorMessage);
        }
        return Promise.reject(error);
      }
      if (status && status !== 401 && !isLoginEndpoint) {
        // For specific status codes, show custom messages
        if (status === 409) {
          // Mutations handle their own 409 errors with translated messages
          if (!isMutation) {
            const message = errorMessage.toLowerCase();
            let displayMessage = errorMessage;

            if (message.includes("national id")) {
              displayMessage = translate(
                "auth.apiErrors.conflictNationalId",
                "National ID is already registered in the system",
              );
            } else if (message.includes("employee number")) {
              displayMessage = translate(
                "auth.apiErrors.conflictEmployeeNumber",
                "Employee number already exists",
              );
            } else if (message.includes("email")) {
              displayMessage = translate(
                "auth.apiErrors.conflictEmail",
                "Email is already registered for another employee",
              );
            } else if (message.includes("phone")) {
              displayMessage = translate(
                "auth.apiErrors.conflictPhone",
                "Phone number is already registered for another employee",
              );
            }

            showToast.error(displayMessage);
          }
        } else if (status === 403) {
          if (!isMutation) {
            // For GET requests: check if user is already authenticated and on a page.
            // If authenticated -> this is a background data-fetch 403 (e.g., a tab within
            // an authorized page). Show a toast so the page stays intact.
            // If NOT authenticated -> redirect to /403 (shouldn't normally happen since
            // 401 would catch auth issues, but kept as a safety fallback).
            const isAuthenticated = !!useAuthStore.getState().user;
            if (isAuthenticated) {
              showToast.error(
                translate(
                  "auth.apiErrors.forbiddenRead",
                  "You do not have permission to access this data",
                ),
              );
            } else {
              const rawMessage =
                (error.response?.data as { message?: string } | undefined)?.message ??
                translate(
                  "auth.apiErrors.forbiddenResource",
                  "You do not have permission to access this resource",
                );
              sessionStorage.setItem("forbidden_message", rawMessage);
              window.location.replace("/403");
            }
            return Promise.reject(error);
          } else {
            // Mutations (POST/PATCH/DELETE): stay on page, show toast
            showToast.error(
              translate(
                "auth.apiErrors.forbiddenAction",
                "You do not have permission to perform this action",
              ),
            );
          }
        } else if (status === 404) {
          if (!isMutation) {
            showToast.error(
              translate(
                "auth.apiErrors.resourceNotFound",
                "The requested resource was not found",
              ),
            );
          }
        } else if (status === 500) {
          showToast.error(
            translate(
              "auth.apiErrors.serverError",
              "Server error. Please try again later.",
            ),
          );
        } else if (status === 400) {
          // Mutations handle their own 400 errors with proper translated messages
          if (!isMutation) {
            const responseData = error.response?.data as
              | {
                  details?: { field: string; message: string }[];
                  message?: string;
                }
              | undefined;
            const firstDetail = responseData?.details?.[0];
            if (firstDetail) {
              showToast.error(`${firstDetail.field}: ${firstDetail.message}`);
            } else {
              showToast.error(errorMessage);
            }
          }
        } else {
          showToast.error(errorMessage);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};

/**
 * Manual token refresh function
 * Calls POST /auth/refresh endpoint
 */
const refreshAccessToken = async (): Promise<void> => {
  try {
    // Get refresh token from store
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken }, // Send refresh token in body
      {
        timeout: REQUEST_TIMEOUT,
        withCredentials: true,
      },
    );

    // Extract new tokens from response
    const tokensData = response.data?.data || response.data;
    const newAccessToken = tokensData?.accessToken;
    const newRefreshToken = tokensData?.refreshToken;
    const newExpiresIn = tokensData?.expiresIn || 900;

    // Update store with new tokens
    if (newAccessToken) {
      useAuthStore.getState().setToken(newAccessToken);
    }
    if (newRefreshToken) {
      useAuthStore.getState().setRefreshToken(newRefreshToken);
    }

    localStorage.setItem("tokenExpiresIn", newExpiresIn.toString());
    localStorage.setItem("loginTime", Date.now().toString());
  } catch (error) {
    ApiErrorHandler.logError("Manual token refresh failed", error);
    throw error;
  }
};

export const apiClient = createApiClient();

/**
 * HTTP Request Helper Methods
 * Provides a clean API for making requests with proper typing
 */
export const apiRequest = {
  /**
   * GET request
   */
  get: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  /**
   * POST request
   */
  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /**
   * PUT request (full update)
   */
  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /**
   * PATCH request (partial update)
   */
  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  /**
   * DELETE request
   */
  delete: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  },
};

// Export as default for backward compatibility
export default apiRequest;
