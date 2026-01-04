import { useState, useEffect, useCallback } from 'react';
import cache, { CacheTTL } from '@/utils/cache';

/**
 * Custom hook for cached API calls
 * Similar to React Query / SWR but simpler
 * 
 * @param {string} cacheKey - Unique cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {object} options - Configuration options
 * @returns {object} - { data, loading, error, refetch, invalidate }
 */
export const useCache = (cacheKey, fetchFn, options = {}) => {
  const {
    ttl = CacheTTL.MEDIUM,
    enabled = true,
    onSuccess,
    onError,
    staleWhileRevalidate = true // Show cached data while fetching fresh data
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const fetchData = useCallback(async (useCache = true) => {
    try {
      // Check cache first
      if (useCache && cacheKey) {
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          
          // If staleWhileRevalidate, fetch fresh data in background
          if (staleWhileRevalidate) {
            setIsRevalidating(true);
            try {
              const freshData = await fetchFn();
              cache.set(cacheKey, freshData, ttl);
              setData(freshData);
              if (onSuccess) onSuccess(freshData);
            } catch (err) {
              // Keep showing cached data on background fetch error
              console.error('Background revalidation failed:', err);
            } finally {
              setIsRevalidating(false);
            }
          }
          
          return;
        }
      }

      // No cache or cache disabled, fetch fresh data
      setLoading(true);
      setError(null);
      
      const freshData = await fetchFn();
      
      // Store in cache
      if (cacheKey) {
        cache.set(cacheKey, freshData, ttl);
      }
      
      setData(freshData);
      if (onSuccess) onSuccess(freshData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ttl, onSuccess, onError, staleWhileRevalidate]);

  // Refetch function (bypasses cache)
  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Invalidate cache and refetch
  const invalidate = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    return fetchData(false);
  }, [cacheKey, fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(true);
    }
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isRevalidating
  };
};

/**
 * Hook for managing multiple cache keys
 */
export const useCacheInvalidation = () => {
  const invalidateCache = useCallback((key) => {
    cache.delete(key);
  }, []);

  const invalidatePattern = useCallback((pattern) => {
    cache.invalidatePattern(pattern);
  }, []);

  const clearAllCache = useCallback(() => {
    cache.clear();
  }, []);

  return {
    invalidateCache,
    invalidatePattern,
    clearAllCache
  };
};

export default useCache;
