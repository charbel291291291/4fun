/**
 * Optimized Query Service
 * Provides pagination, caching, and performance optimizations for data fetching
 * Compatible with both mock data and Supabase integration
 */

import type { Model, Supervisor, Notification, WhatsAppMessage } from '../types';

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface FilterOptions {
  status?: ('online' | 'offline' | 'inactive')[];
  level?: string[];
  supervisorId?: string;
  searchQuery?: string;
  minEarnings?: number;
  maxEarnings?: number;
  riskIndicator?: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

// Generate cache key from options
function generateCacheKey(prefix: string, options: Record<string, any>): string {
  const sorted = Object.entries(options)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join('|');
  return `${prefix}:${sorted}`;
}

// Mock data store (will be replaced with Supabase calls)
let mockModels: Model[] = [];
let mockNotifications: Notification[] = [];
let mockMessages: WhatsAppMessage[] = [];

export function initializeMockData(
  models: Model[],
  notifications: Notification[],
  messages: WhatsAppMessage[]
) {
  mockModels = models;
  mockNotifications = notifications;
  mockMessages = messages;
}

// ==================== MODEL QUERIES ====================

export async function getModelsPaginated(
  options: PaginationOptions & FilterOptions & { sort?: SortOptions }
): Promise<PaginatedResult<Model>> {
  const cacheKey = generateCacheKey('models', options);
  const cached = queryCache.get<PaginatedResult<Model>>(cacheKey);
  if (cached) return cached;

  const { page = 1, limit = 20, cursor, sort } = options;

  // Apply filters
  let filtered = [...mockModels];

  if (options.status?.length) {
    filtered = filtered.filter(m => options.status?.includes(m.status));
  }

  if (options.level?.length) {
    filtered = filtered.filter(m => options.level?.includes(m.level));
  }

  if (options.supervisorId) {
    filtered = filtered.filter(m => m.supervisor_id === options.supervisorId);
  }

  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query)
    );
  }

  if (options.minEarnings !== undefined) {
    filtered = filtered.filter(m => m.earnings >= options.minEarnings!);
  }

  if (options.maxEarnings !== undefined) {
    filtered = filtered.filter(m => m.earnings <= options.maxEarnings!);
  }

  if (options.riskIndicator !== undefined) {
    filtered = filtered.filter(m => m.risk_indicator === options.riskIndicator);
  }

  // Apply sorting
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = (a as any)[sort.field];
      const bVal = (b as any)[sort.field];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  // Apply pagination (cursor-based for performance)
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = filtered.findIndex(m => m.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  } else {
    startIndex = (page - 1) * limit;
  }

  const paginated = filtered.slice(startIndex, startIndex + limit + 1);
  const hasMore = paginated.length > limit;
  const data = paginated.slice(0, limit);
  const nextCursor = hasMore ? data[data.length - 1]?.id || null : null;

  const result: PaginatedResult<Model> = {
    data,
    nextCursor,
    hasMore,
    total: filtered.length,
  };

  queryCache.set(cacheKey, result);
  return result;
}

export async function getModelById(id: string): Promise<Model | null> {
  const cacheKey = `model:${id}`;
  const cached = queryCache.get<Model>(cacheKey);
  if (cached) return cached;

  const model = mockModels.find(m => m.id === id) || null;
  if (model) {
    queryCache.set(cacheKey, model);
  }
  return model;
}

export async function getModelsByIds(ids: string[]): Promise<Model[]> {
  if (ids.length === 0) return [];

  // Batch fetch - check cache first
  const results: Model[] = [];
  const missingIds: string[] = [];

  for (const id of ids) {
    const cached = queryCache.get<Model>(`model:${id}`);
    if (cached) {
      results.push(cached);
    } else {
      missingIds.push(id);
    }
  }

  // Fetch missing from mock data
  if (missingIds.length > 0) {
    const fetched = mockModels.filter(m => missingIds.includes(m.id));
    for (const model of fetched) {
      queryCache.set(`model:${model.id}`, model);
    }
    results.push(...fetched);
  }

  return results;
}

// ==================== NOTIFICATION QUERIES ====================

export async function getNotificationsPaginated(
  options: PaginationOptions & { priority?: ('gold' | 'red' | 'purple')[]; type?: string[] }
): Promise<PaginatedResult<Notification>> {
  const cacheKey = generateCacheKey('notifications', options);
  const cached = queryCache.get<PaginatedResult<Notification>>(cacheKey);
  if (cached) return cached;

  const { page = 1, limit = 10 } = options;

  let filtered = [...mockNotifications];

  if (options.priority?.length) {
    filtered = filtered.filter(n => options.priority?.includes(n.priority));
  }

  if (options.type?.length) {
    filtered = filtered.filter(n => options.type?.includes(n.type));
  }

  // Sort by timestamp desc
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const startIndex = (page - 1) * limit;
  const data = filtered.slice(startIndex, startIndex + limit);
  const hasMore = filtered.length > startIndex + limit;

  const result: PaginatedResult<Notification> = {
    data,
    nextCursor: hasMore ? String(page + 1) : null,
    hasMore,
    total: filtered.length,
  };

  queryCache.set(cacheKey, result);
  return result;
}

// ==================== MESSAGE QUERIES ====================

export async function getMessagesForModel(
  modelId: string,
  options: PaginationOptions
): Promise<PaginatedResult<WhatsAppMessage>> {
  const cacheKey = generateCacheKey(`messages:${modelId}`, options);
  const cached = queryCache.get<PaginatedResult<WhatsAppMessage>>(cacheKey);
  if (cached) return cached;

  const { page = 1, limit = 20 } = options;

  const filtered = mockMessages
    .filter(m => m.model_id === modelId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const startIndex = (page - 1) * limit;
  const data = filtered.slice(startIndex, startIndex + limit);
  const hasMore = filtered.length > startIndex + limit;

  const result: PaginatedResult<WhatsAppMessage> = {
    data,
    nextCursor: hasMore ? String(page + 1) : null,
    hasMore,
    total: filtered.length,
  };

  queryCache.set(cacheKey, result);
  return result;
}

// ==================== STATS QUERIES ====================

export interface DashboardStats {
  totalModels: number;
  onlineModels: number;
  totalEarnings: number;
  monthlyEarnings: number;
  atRiskCount: number;
  targetAchievement: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const cacheKey = 'dashboard:stats';
  const cached = queryCache.get<DashboardStats>(cacheKey);
  if (cached) return cached;

  const stats: DashboardStats = {
    totalModels: mockModels.length,
    onlineModels: mockModels.filter(m => m.status === 'online').length,
    totalEarnings: mockModels.reduce((sum, m) => sum + m.earnings, 0),
    monthlyEarnings: mockModels.reduce((sum, m) => sum + m.earnings_month, 0),
    atRiskCount: mockModels.filter(m => m.risk_indicator).length,
    targetAchievement: mockModels.filter(m => m.performance_status === 'achieved').length,
  };

  queryCache.set(cacheKey, stats);
  return stats;
}

export interface SupervisorStats {
  supervisorId: string;
  teamSize: number;
  teamEarnings: number;
  avgPerformance: number;
  activeModels: number;
}

export async function getSupervisorStats(supervisorId: string): Promise<SupervisorStats> {
  const cacheKey = `supervisor:stats:${supervisorId}`;
  const cached = queryCache.get<SupervisorStats>(cacheKey);
  if (cached) return cached;

  const teamModels = mockModels.filter(m => m.supervisor_id === supervisorId);

  const stats: SupervisorStats = {
    supervisorId,
    teamSize: teamModels.length,
    teamEarnings: teamModels.reduce((sum, m) => sum + m.earnings, 0),
    avgPerformance: teamModels.length > 0
      ? teamModels.reduce((sum, m) => sum + m.performance_score, 0) / teamModels.length
      : 0,
    activeModels: teamModels.filter(m => m.status === 'online').length,
  };

  queryCache.set(cacheKey, stats);
  return stats;
}

// ==================== CACHE MANAGEMENT ====================

export function invalidateModelCache(modelId?: string): void {
  if (modelId) {
    queryCache.invalidate(`model:${modelId}`);
  } else {
    queryCache.invalidate('models');
    queryCache.invalidate('dashboard:stats');
  }
}

export function invalidateNotificationCache(): void {
  queryCache.invalidate('notifications');
}

export function invalidateMessageCache(modelId?: string): void {
  if (modelId) {
    queryCache.invalidate(`messages:${modelId}`);
  } else {
    queryCache.invalidate('messages');
  }
}

// ==================== REAL-TIME SUBSCRIPTION HELPERS ====================

// These will be used when Supabase real-time is integrated
export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeChange<T> {
  event: ChangeEvent;
  data: T;
  oldData?: T;
}

export function handleRealtimeModelChange(change: RealtimeChange<Model>): void {
  switch (change.event) {
    case 'INSERT':
      mockModels.push(change.data);
      break;
    case 'UPDATE':
      const index = mockModels.findIndex(m => m.id === change.data.id);
      if (index !== -1) {
        mockModels[index] = change.data;
      }
      break;
    case 'DELETE':
      mockModels = mockModels.filter(m => m.id !== change.data.id);
      break;
  }
  invalidateModelCache(change.data.id);
}

// ==================== DEBOUNCED SEARCH ====================

export function createDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay: number = 300
): (query: string) => Promise<T[]> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastQuery = '';
  let lastResult: T[] = [];

  return (query: string): Promise<T[]> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Return cached result for same query
      if (query === lastQuery) {
        resolve(lastResult);
        return;
      }

      timeoutId = setTimeout(async () => {
        const result = await searchFn(query);
        lastQuery = query;
        lastResult = result;
        resolve(result);
      }, delay);
    });
  };
}

// Search models with debouncing
export const searchModels = createDebouncedSearch(async (query: string): Promise<Model[]> => {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return mockModels.filter(m =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.id.toLowerCase().includes(lowerQuery) ||
    m.level.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}, 300);
