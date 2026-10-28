// ============================================
// API error helpers — user-safe messages only
// ============================================

import { isAxiosError } from 'axios';

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

/** A message that is safe to show to users (never stack traces). */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Unable to reach the server. Check your connection and try again.';
    const { status, data } = error.response;
    if (status >= 500 && status !== 503) return fallback;
    const fieldErrors = data?.errors ? Object.values(data.errors).flat() : [];
    if (data?.message === 'Validation failed' && fieldErrors.length) {
      return `Validation failed: ${fieldErrors.slice(0, 2).join(' ')}`;
    }
    return data?.message || fallback;
  }
  return fallback;
}

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
