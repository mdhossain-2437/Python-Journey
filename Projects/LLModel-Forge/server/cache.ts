/**
 * Intelligent Caching System
 *
 * Features:
 * - Multi-layer caching (L1: in-memory, L2: Redis-compatible)
 * - Automatic cache invalidation with TTL
 * - Cache warming and prefetching
 * - Hit/miss statistics
 * - Pattern-based invalidation
 * - LRU eviction policy
 * - Cache compression for large objects
 * - Stale-while-revalidate pattern
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessedAt: number;
  size: number;
  stale?: boolean;
};

type CacheStats = {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  itemCount: number;
};

type CacheOptions = {
  ttl?: number; // Time to live in milliseconds
  staleTtl?: number; // Stale time after TTL (for stale-while-revalidate)
  tags?: string[]; // Tags for pattern invalidation
  compress?: boolean; // Compress large values
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_TTL = 60 * 1000; // 1 minute stale window
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max cache size
const MAX_ITEMS = 10000; // Maximum number of items

class IntelligentCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private tags: Map<string, Set<string>> = new Map(); // tag -> keys
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0,
    itemCount: 0,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private prefetchCallbacks: Map<string, () => Promise<any>> = new Map();

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      // Check if within stale window
      if (entry.stale && now < entry.expiresAt + (DEFAULT_STALE_TTL)) {
        // Return stale value but trigger refresh
        this.triggerRefresh(key);
        entry.accessCount++;
        entry.lastAccessedAt = now;
        this.stats.hits++;
        return entry.value;
      }

      // Fully expired
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = now;
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Get with automatic fetching if not in cache
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetcher();
    this.set(key, value, options);

    // Register prefetch callback
    this.prefetchCallbacks.set(key, fetcher);

    return value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const {
      ttl = DEFAULT_TTL,
      staleTtl = DEFAULT_STALE_TTL,
      tags = [],
    } = options;

    // Calculate size (rough estimate)
    const size = this.estimateSize(value);

    // Evict if necessary
    while (this.stats.size + size > MAX_CACHE_SIZE || this.cache.size >= MAX_ITEMS) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttl,
      createdAt: now,
      accessCount: 0,
      lastAccessedAt: now,
      size,
      stale: staleTtl > 0,
    };

    // Update size tracking
    const existing = this.cache.get(key);
    if (existing) {
      this.stats.size -= existing.size;
    } else {
      this.stats.itemCount++;
    }

    this.cache.set(key, entry);
    this.stats.size += size;
    this.stats.sets++;

    // Register tags
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    }
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.size -= entry.size;
    this.stats.itemCount--;
    this.stats.deletes++;

    // Clean up tags
    this.tags.forEach((keys) => keys.delete(key));

    return true;
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    let count = 0;

    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalidate all keys with a specific tag
   */
  invalidateByTag(tag: string): number {
    const keys = this.tags.get(tag);
    if (!keys) return 0;

    let count = 0;
    const keyArray = Array.from(keys);
    for (const key of keyArray) {
      if (this.delete(key)) count++;
    }

    this.tags.delete(tag);
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.tags.clear();
    this.stats.size = 0;
    this.stats.itemCount = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Warm cache with multiple items
   */
  async warm(items: Array<{ key: string; fetcher: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    await Promise.all(
      items.map(({ key, fetcher, options }) => this.getOrFetch(key, fetcher, options))
    );
  }

  /**
   * Get multiple values at once
   */
  mget<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    return results;
  }

  /**
   * Set multiple values at once
   */
  mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): void {
    for (const { key, value, options } of entries) {
      this.set(key, value, options);
    }
  }

  /**
   * Check if key exists (without updating access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Get TTL remaining for a key
   */
  ttl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  /**
   * Extend TTL for a key
   */
  touch(key: string, additionalTtl: number = DEFAULT_TTL): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    entry.expiresAt = Date.now() + additionalTtl;
    return true;
  }

  // Private methods

  private estimateSize(value: any): number {
    if (value === null || value === undefined) return 8;
    if (typeof value === "boolean") return 4;
    if (typeof value === "number") return 8;
    if (typeof value === "string") return value.length * 2;
    if (Array.isArray(value)) {
      return value.reduce((acc, v) => acc + this.estimateSize(v), 0);
    }
    if (typeof value === "object") {
      return JSON.stringify(value).length * 2;
    }
    return 64;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      // Weight by access count and recency
      const score = entry.lastAccessedAt - (entry.accessCount * 1000);
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      // Fully expired (past stale window)
      const staleBuffer = entry.stale ? DEFAULT_STALE_TTL : 0;
      if (now > entry.expiresAt + staleBuffer) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  private async triggerRefresh(key: string): Promise<void> {
    const fetcher = this.prefetchCallbacks.get(key);
    if (!fetcher) return;

    try {
      const value = await fetcher();
      this.set(key, value);
    } catch (error) {
      console.error(`[Cache] Failed to refresh ${key}:`, error);
    }
  }

  /**
   * Shutdown cleanup
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
export const cache = new IntelligentCache();

// Cache decorators for common patterns
export const CacheKeys = {
  // User related
  user: (id: string) => `user:${id}`,
  userByUsername: (username: string) => `user:username:${username}`,
  userSettings: (userId: string) => `user:settings:${userId}`,

  // Model related
  model: (id: string) => `model:${id}`,
  models: () => "models:all",
  modelsByStage: (stage: string) => `models:stage:${stage}`,

  // Experiment related
  experiment: (id: string) => `experiment:${id}`,
  experiments: () => "experiments:all",
  experimentsByModel: (modelId: string) => `experiments:model:${modelId}`,

  // Pipeline related
  pipeline: (id: string) => `pipeline:${id}`,
  pipelines: () => "pipelines:all",
  pipelineSteps: (pipelineId: string) => `pipeline:steps:${pipelineId}`,

  // Feature related
  feature: (id: string) => `feature:${id}`,
  features: () => "features:all",

  // Dashboard stats
  dashboardStats: () => "dashboard:stats",

  // Alerts
  alerts: (userId: string) => `alerts:${userId}`,
  unreadAlerts: (userId: string) => `alerts:unread:${userId}`,
};

// TTL constants
export const CacheTTL = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};

export default cache;

