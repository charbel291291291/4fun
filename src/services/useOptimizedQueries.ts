/**
 * React Hooks for Optimized Queries
 * Provides easy-to-use hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Model,
  Notification,
  WhatsAppMessage,
  Supervisor,
} from '../types';
import {
  getModelsPaginated,
  getModelById,
  getNotificationsPaginated,
  getMessagesForModel,
  getDashboardStats,
  getSupervisorStats,
  searchModels,
  invalidateModelCache,
  invalidateNotificationCache,
  invalidateMessageCache,
  type PaginationOptions,
  type FilterOptions,
  type SortOptions,
  type PaginatedResult,
  type DashboardStats,
  type SupervisorStats,
} from './optimizedQueries';

// Generic hook state
interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface PaginatedQueryState<T> extends QueryState<T[]> {
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
}

// ==================== USE MODELS PAGINATED ====================

export function useModelsPaginated(
  options: PaginationOptions & FilterOptions & { sort?: SortOptions }
) {
  const [state, setState] = useState<PaginatedQueryState<Model>>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
    nextCursor: null,
    total: 0,
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await getModelsPaginated(optionsRef.current);

        if (!cancelled) {
          setState({
            data: result.data,
            loading: false,
            error: null,
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
            total: result.total,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    options.page,
    options.limit,
    options.cursor,
    options.supervisorId,
    options.searchQuery,
    JSON.stringify(options.status),
    JSON.stringify(options.level),
    JSON.stringify(options.sort),
  ]);

  const refresh = useCallback(() => {
    invalidateModelCache();
    // Trigger re-fetch by updating a dependency
    setState(prev => ({ ...prev, loading: true }));
  }, []);

  const loadMore = useCallback(() => {
    if (state.hasMore && state.nextCursor && !state.loading) {
      // This would be handled by the parent component updating the cursor option
    }
  }, [state.hasMore, state.nextCursor, state.loading]);

  return { ...state, refresh, loadMore };
}

// ==================== USE MODEL ====================

export function useModel(id: string | null) {
  const [state, setState] = useState<QueryState<Model>>({
    data: null,
    loading: !!id,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await getModelById(id);

        if (!cancelled) {
          setState({
            data: result,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refresh = useCallback(() => {
    if (id) {
      invalidateModelCache(id);
      setState(prev => ({ ...prev, loading: true }));
    }
  }, [id]);

  return { ...state, refresh };
}

// ==================== USE NOTIFICATIONS ====================

export function useNotifications(
  options: PaginationOptions & { priority?: ('gold' | 'red' | 'purple')[]; type?: string[] }
) {
  const [state, setState] = useState<PaginatedQueryState<Notification>>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
    nextCursor: null,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await getNotificationsPaginated(options);

        if (!cancelled) {
          setState({
            data: result.data,
            loading: false,
            error: null,
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
            total: result.total,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [options.page, options.limit, JSON.stringify(options.priority), JSON.stringify(options.type)]);

  const refresh = useCallback(() => {
    invalidateNotificationCache();
    setState(prev => ({ ...prev, loading: true }));
  }, []);

  return { ...state, refresh };
}

// ==================== USE MESSAGES ====================

export function useMessages(modelId: string | null, options: PaginationOptions) {
  const [state, setState] = useState<PaginatedQueryState<WhatsAppMessage>>({
    data: [],
    loading: false,
    error: null,
    hasMore: false,
    nextCursor: null,
    total: 0,
  });

  useEffect(() => {
    if (!modelId) {
      setState({ data: [], loading: false, error: null, hasMore: false, nextCursor: null, total: 0 });
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await getMessagesForModel(modelId, options);

        if (!cancelled) {
          setState({
            data: result.data,
            loading: false,
            error: null,
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
            total: result.total,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [modelId, options.page, options.limit]);

  const refresh = useCallback(() => {
    if (modelId) {
      invalidateMessageCache(modelId);
      setState(prev => ({ ...prev, loading: true }));
    }
  }, [modelId]);

  return { ...state, refresh };
}

// ==================== USE DASHBOARD STATS ====================

export function useDashboardStats() {
  const [state, setState] = useState<QueryState<DashboardStats>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await getDashboardStats();

        if (!cancelled) {
          setState({
            data: result,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          });
        }
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const refresh = useCallback(() => {
    invalidateModelCache();
    setState(prev => ({ ...prev, loading: true }));
  }, []);

  return { ...state, refresh };
}

// ==================== USE SUPERVISOR STATS ====================

export function useSupervisorStats(supervisorId: string | null) {
  const [state, setState] = useState<QueryState<SupervisorStats>>({
    data: null,
    loading: !!supervisorId,
    error: null,
  });

  useEffect(() => {
    if (!supervisorId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await getSupervisorStats(supervisorId);

        if (!cancelled) {
          setState({
            data: result,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [supervisorId]);

  const refresh = useCallback(() => {
    if (supervisorId) {
      invalidateModelCache();
      setState(prev => ({ ...prev, loading: true }));
    }
  }, [supervisorId]);

  return { ...state, refresh };
}

// ==================== USE SEARCH ====================

export function useModelSearch() {
  const [results, setResults] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timeoutRef.current = setTimeout(async () => {
      const models = await searchModels(query);
      setResults(models);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { results, loading, search };
}

// ==================== USE INFINITE SCROLL ====================

export function useInfiniteModels(
  baseOptions: Omit<PaginationOptions & FilterOptions & { sort?: SortOptions }, 'cursor'>
) {
  const [allData, setAllData] = useState<Model[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getModelsPaginated({
        ...baseOptions,
        cursor,
        limit: baseOptions.limit || 20,
      });

      setAllData(prev => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [baseOptions, cursor, hasMore, loading]);

  const refresh = useCallback(() => {
    invalidateModelCache();
    setAllData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (allData.length === 0 && hasMore) {
      loadMore();
    }
  }, []);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
