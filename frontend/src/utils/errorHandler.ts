// ==========================================
// ERROR HANDLING UTILITIES
// ==========================================

import axios, { AxiosError } from 'axios';
import { AppError, ErrorCode } from '../types';

/**
 * Maps HTTP status codes to error codes
 */
const getErrorCodeFromStatus = (status: number): ErrorCode => {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 404) return 'NOT_FOUND';
  if (status === 400 || status === 422) return 'VALIDATION';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
};

/**
 * Converts any error to AppError type
 * @param error - Unknown error
 * @returns Typed AppError
 */
export const handleApiError = (error: unknown): AppError => {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as any;

    // No response means network error
    if (!error.response) {
      return {
        code: 'NETWORK',
        message: 'Tidak ada koneksi internet. Periksa jaringan Anda.',
        isRetryable: true,
        originalError: error,
      };
    }

    // Handle specific status codes
    if (status === 401) {
      return {
        code: 'AUTH',
        message: 'Sesi Anda telah habis. Silakan login kembali.',
        statusCode: status,
        isRetryable: false,
        originalError: error,
      };
    }

    if (status === 422) {
      return {
        code: 'VALIDATION',
        message:
          data?.message || 'Data tidak valid. Periksa kembali input Anda.',
        statusCode: status,
        isRetryable: false,
        originalError: error,
      };
    }

    if (status >= 500) {
      return {
        code: 'SERVER',
        message: 'Server sedang mengalami masalah. Coba lagi nanti.',
        statusCode: status,
        isRetryable: true,
        originalError: error,
      };
    }

    // Generic API error
    return {
      code: getErrorCodeFromStatus(status),
      message: data?.message || 'Terjadi kesalahan. Silakan coba lagi.',
      statusCode: status,
      isRetryable: true,
      originalError: error,
    };
  }

  // Handle regular errors
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message || 'Terjadi kesalahan yang tidak diketahui.',
      isRetryable: false,
      originalError: error,
    };
  }

  // Fallback
  return {
    code: 'UNKNOWN',
    message: 'Terjadi kesalahan yang tidak diketahui.',
    isRetryable: false,
    originalError: error,
  };
};

/**
 * Logs error safely - only in development
 * @param context - Where the error occurred
 * @param error - The error object
 */
export const logError = (
  context: string,
  error: AppError | Error | unknown,
): void => {
  if (!__DEV__) return;

  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    console.error(`[${timestamp}] [${context}] ${error.message}`, error.stack);
  } else if (typeof error === 'object' && error !== null) {
    console.error(`[${timestamp}] [${context}]`, error);
  } else {
    console.error(`[${timestamp}] [${context}] Unknown error:`, error);
  }
};

/**
 * Logs API request - only in development
 * @param method - HTTP method
 * @param url - Request URL
 * @param data - Request data (sanitized)
 */
export const logApiRequest = (
  method: string,
  url: string,
  data?: any,
): void => {
  if (!__DEV__) return;

  const timestamp = new Date().toISOString();
  const sanitized = data ? JSON.stringify(data).slice(0, 200) : 'No data';
  console.log(`[${timestamp}] [API] ${method} ${url}`, sanitized);
};

/**
 * Logs API response - only in development
 * @param method - HTTP method
 * @param url - Request URL
 * @param status - Response status
 */
export const logApiResponse = (
  method: string,
  url: string,
  status: number,
): void => {
  if (!__DEV__) return;

  const timestamp = new Date().toISOString();
  const statusColor = status >= 400 ? '🔴' : '✅';
  console.log(
    `[${timestamp}] [API] ${statusColor} ${method} ${url} (${status})`,
  );
};

/**
 * Creates a user-friendly error message
 * @param error - AppError
 * @returns User-friendly message
 */
export const getErrorMessage = (error: AppError | unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as any).message;
  }

  return 'Terjadi kesalahan yang tidak diketahui.';
};

/**
 * Determines if error is retryable
 * @param error - AppError
 * @returns True if should retry
 */
export const isRetryableError = (error: AppError | unknown): boolean => {
  if (typeof error === 'object' && error !== null && 'isRetryable' in error) {
    return (error as AppError).isRetryable;
  }
  return false;
};

/**
 * Creates exponential backoff delay
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in ms (default 1000)
 * @param maxDelay - Max delay in ms (default 30000)
 * @returns Delay in milliseconds
 */
export const getExponentialBackoffDelay = (
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
): number => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add random jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() - 0.5);
  return Math.floor(delay + jitter);
};

/**
 * Retry logic with exponential backoff
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum retry attempts
 * @param baseDelay - Base delay in ms
 * @returns Result or throws after max attempts
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let lastError: AppError | Error | unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const appError = error instanceof Error ? error : handleApiError(error);
      const isRetryable =
        'isRetryable' in appError ? appError.isRetryable : true;

      if (!isRetryable || attempt === maxAttempts - 1) {
        throw error;
      }

      const delay = getExponentialBackoffDelay(attempt, baseDelay);
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
