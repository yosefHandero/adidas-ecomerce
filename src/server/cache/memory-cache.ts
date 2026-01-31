import { logger } from '../logger/logger';

/**
 * Cache entry with timestamp
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache with TTL
 * ⚠️ WARNING: This is not production-ready for multi-instance deployments.
 * For production, use Redis or a distributed cache.
 */
class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number;
  private maxSize: number;

  constructor(ttlMs: number = 60 * 60 * 1000, maxSize: number = 100) {
    this.ttl = ttlMs;
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Clean up if cache is too large
    if (this.store.size >= this.maxSize) {
      this.cleanup();
    }

    this.store.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries and enforce max size
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());

    // Remove expired entries
    let expiredCount = 0;
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(key);
        expiredCount++;
      }
    }

    // If still too large, remove oldest entries (LRU-style)
    if (this.store.size >= this.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.store.has(key)) // Only keep non-expired
        .sort((a, b) => a[1].timestamp - b[1].timestamp); // Oldest first

      // Calculate how many entries to remove to make room for the new entry
      // We need: store.size - removed + 1 <= maxSize
      // So: removed >= store.size - maxSize + 1
      // Ensure we remove at least 1 entry
      const entriesToRemove = Math.max(1, this.store.size - this.maxSize + 1);
      const toRemove = sortedEntries.slice(0, entriesToRemove);

      for (const [key] of toRemove) {
        this.store.delete(key);
      }

      logger.debug('Cache cleanup', {
        expiredCount,
        removedCount: toRemove.length,
        remainingSize: this.store.size,
      });
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.store.size;
  }
}

// Export singleton instances for different use cases
export const suggestionImageCache = new MemoryCache<{
  manImage: unknown;
  womanImage: unknown;
}>(60 * 60 * 1000, 100); // 1 hour TTL, max 100 entries
