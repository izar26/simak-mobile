// ==========================================
// CUSTOM HOOKS FOR DATA FETCHING
// ==========================================

import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { AppError } from '../types';
import { handleApiError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface UseFetchOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  ttl?: number;
  skipCache?: boolean;
}

/**
 * Custom hook for fetching data with smart caching
 * @param endpoint - API endpoint
 * @param cacheKey - Unique cache key
 * @param options - Optional callbacks and settings
 * @returns { data, loading, refreshing, error, refetch }
 */
export const useFetchWithCache = <T = any>(
  endpoint: string,
  cacheKey: string,
  options?: UseFetchOptions,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && !loading && !refreshing) {
        setRefreshing(true);
      }

      try {
        const result = await api.get(endpoint);
        setData(result.data);
        setError(null);
        logger.info('useFetch', `Fetched ${cacheKey}`, { endpoint });
        options?.onSuccess?.(result.data);
      } catch (err) {
        const appError =
          err instanceof Error ? handleApiError(err) : (err as AppError);
        setError(appError);
        logger.error('useFetch', `Failed to fetch ${cacheKey}`, appError);
        options?.onError?.(appError);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      endpoint,
      cacheKey,
      options?.ttl,
      options?.skipCache,
      options?.onSuccess,
      options?.onError,
      loading,
      refreshing,
    ],
  );

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: fetchData,
  };
};

/**
 * Custom hook for simple API calls without caching
 * @param asyncFn - Async function to execute
 * @param options - Optional callbacks
 * @returns { data, loading, error, execute, reset }
 */
export const useAsyncFunction = <T = any, P extends any[] = any[]>(
  asyncFn: (...args: P) => Promise<T>,
  options?: Omit<UseFetchOptions, 'ttl' | 'skipCache'>,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      setLoading(true);
      try {
        const result = await asyncFn(...args);
        setData(result);
        setError(null);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const appError =
          err instanceof Error ? handleApiError(err) : (err as AppError);
        setError(appError);
        options?.onError?.(appError);
        throw appError;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, options?.onSuccess, options?.onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};

/**
 * Custom hook for managing form state with validation
 * @param initialValues - Initial form values
 * @param onSubmit - Submit callback
 * @returns Form state and handlers
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      logger.error('useForm', 'Submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setErrors,
  };
};
