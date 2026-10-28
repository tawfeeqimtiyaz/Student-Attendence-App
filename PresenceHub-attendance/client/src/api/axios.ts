// ============================================
// Axios Instance with Token Interceptors
// ============================================

import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse } from '@college-erp/shared';
import { useAuthStore } from '../stores/auth.store';

export const SESSION_EXPIRED_KEY = 'session-expired';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies (refresh token)
});

/** Extract the `data` payload from the standard `{ success, data, message }` envelope. */
export const unwrap = <T>(res: AxiosResponse<ApiResponse<T>>): T => res.data.data;

/**
 * Exchange the refresh-token cookie for a new access token.
 * Concurrent callers share one request so parallel 401s don't race.
 */
let refreshInFlight: Promise<string> | null = null;
export function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post<ApiResponse<{ accessToken: string }>>('/api/v1/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const { accessToken } = res.data.data;
        useAuthStore.getState().setAccessToken(accessToken);
        return accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// ---- Request Interceptor: Attach access token ----
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor: Handle 401 & token refresh ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh for auth endpoints or if already retried
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') ||
                           originalRequest?.url?.includes('/auth/login');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → the session is over. Tell the login page why.
        try {
          sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
        } catch {
          // Storage unavailable — the redirect still happens.
        }
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
