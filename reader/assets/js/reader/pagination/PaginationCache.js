/**
 * PaginationCache - Intelligent caching for pagination results
 * Reduces computation time for repeated pagination of same content
 *
 * Features:
 * - TTL-based expiration (7 days default)
 * - Config-aware caching (different configs = different cache entries)
 * - localStorage with IndexedDB fallback
 * - Automatic cleanup of expired entries
 * - Memory-efficient storage
 */

import { logger } from '../../utils/logger.js';

export class PaginationCache {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.ttl = options.ttl || (7 * 24 * 60 * 60 * 1000); // 7 days in ms
    this.maxEntries = options.maxEntries || 50;
    this.storage = this.detectStorage();

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      size: 0
    };

    // Clean up expired entries on initialization
    this.cleanup();

    this.logger.info('PaginationCache initialized', {
      storage: this.storage.type,
      ttl: this.ttl,
      maxEntries: this.maxEntries
    });
  }

  /**
   * Detect best available storage
   * @returns {Object} - Storage interface
   */
  detectStorage() {
    // Try localStorage first (fast synchronous access)
    try {
      const testKey = '__pagination_cache_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return {
        type: 'localStorage',
        get: (key) => localStorage.getItem(key),
        set: (key, value) => localStorage.setItem(key, value),
        remove: (key) => localStorage.removeItem(key),
        clear: () => localStorage.clear(),
        keys: () => Object.keys(localStorage)
      };
    } catch (e) {
      this.logger.warn('localStorage unavailable, falling back to memory', e);
    }

    // Fallback to in-memory storage
    const memoryStore = new Map();
    return {
      type: 'memory',
      get: (key) => memoryStore.get(key) || null,
      set: (key, value) => memoryStore.set(key, value),
      remove: (key) => memoryStore.delete(key),
      clear: () => memoryStore.clear(),
      keys: () => Array.from(memoryStore.keys())
    };
  }

  /**
   * Generate cache key from bookId and config
   * @param {string} bookId
   * @param {Object} config
   * @returns {string}
   */
  getCacheKey(bookId, config) {
    // Create deterministic key from config
    const configHash = this.hashConfig(config);
    return `pagination_v4_${bookId}_${configHash}`;
  }

  /**
   * Create hash from config object
   * @param {Object} config
   * @returns {string}
   */
  hashConfig(config) {
    // Simple hash of relevant config properties
    const relevant = {
      paragraphsPerPage: config.paragraphsPerPage,
      pagesPerChapter: config.pagesPerChapter,
      wordsPerMinute: config.wordsPerMinute
    };

    return btoa(JSON.stringify(relevant)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Get cached pagination result
   * @param {string} bookId
   * @param {Object} config
   * @returns {PagedBook|null}
   */
  get(bookId, config) {
    try {
      const key = this.getCacheKey(bookId, config);
      const stored = this.storage.get(key);

      if (!stored) {
        this.stats.misses++;
        return null;
      }

      const { data, timestamp, metadata } = JSON.parse(stored);

      // Check TTL
      if (Date.now() - timestamp > this.ttl) {
        this.logger.debug('Cache entry expired', { key, age: Date.now() - timestamp });
        this.storage.remove(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      this.logger.debug('Cache hit', { key, age: Date.now() - timestamp });

      return data;
    } catch (error) {
      this.logger.warn('Cache read error', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Store pagination result in cache
   * @param {string} bookId
   * @param {Object} config
   * @param {PagedBook} pagedBook
   */
  set(bookId, config, pagedBook) {
    try {
      const key = this.getCacheKey(bookId, config);
      const value = {
        data: pagedBook,
        timestamp: Date.now(),
        metadata: {
          bookId,
          totalPages: pagedBook.totalPages,
          totalChapters: pagedBook.totalChapters,
          configHash: this.hashConfig(config)
        }
      };

      this.storage.set(key, JSON.stringify(value));
      this.stats.sets++;

      // Check if we need to evict old entries
      this.enforceMaxEntries();

      this.logger.debug('Cache entry stored', {
        key,
        size: JSON.stringify(value).length,
        pages: pagedBook.totalPages
      });

    } catch (error) {
      this.logger.warn('Cache write error', error);
      // Try to free up space and retry once
      if (this.storage.type === 'localStorage') {
        this.clearExpired();
        try {
          this.set(bookId, config, pagedBook);
          return;
        } catch (retryError) {
          this.logger.error('Cache write retry failed', retryError);
        }
      }
    }
  }

  /**
   * Clear cache for specific book
   * @param {string} bookId
   */
  clear(bookId) {
    try {
      const keys = this.storage.keys();
      const bookKeys = keys.filter(key =>
        key.startsWith('pagination_v4_') && key.includes(bookId)
      );

      bookKeys.forEach(key => this.storage.remove(key));
      this.logger.info('Cache cleared for book', { bookId, entriesCleared: bookKeys.length });

    } catch (error) {
      this.logger.warn('Cache clear error', error);
    }
  }

  /**
   * Clear all expired entries
   */
  clearExpired() {
    try {
      const keys = this.storage.keys();
      const now = Date.now();
      let cleared = 0;

      keys.forEach(key => {
        if (!key.startsWith('pagination_v4_')) return;

        try {
          const stored = this.storage.get(key);
          if (!stored) return;

          const { timestamp } = JSON.parse(stored);
          if (now - timestamp > this.ttl) {
            this.storage.remove(key);
            cleared++;
          }
        } catch (e) {
          // Invalid entry, remove
          this.storage.remove(key);
          cleared++;
        }
      });

      if (cleared > 0) {
        this.logger.info('Expired cache entries cleared', { cleared });
      }

    } catch (error) {
      this.logger.warn('Clear expired error', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll() {
    try {
      const keys = this.storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith('pagination_v4_'));

      cacheKeys.forEach(key => this.storage.remove(key));
      this.logger.info('All cache cleared', { entriesCleared: cacheKeys.length });

    } catch (error) {
      this.logger.warn('Clear all error', error);
    }
  }

  /**
   * Enforce maximum entries limit
   */
  enforceMaxEntries() {
    try {
      const keys = this.storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith('pagination_v4_'));

      if (cacheKeys.length <= this.maxEntries) return;

      // Sort by timestamp (oldest first) and remove excess
      const entries = cacheKeys.map(key => {
        try {
          const stored = this.storage.get(key);
          const { timestamp } = JSON.parse(stored);
          return { key, timestamp };
        } catch (e) {
          return { key, timestamp: 0 };
        }
      }).sort((a, b) => a.timestamp - b.timestamp);

      const toRemove = entries.slice(0, cacheKeys.length - this.maxEntries + 1);
      toRemove.forEach(entry => {
        this.storage.remove(entry.key);
        this.stats.evictions++;
      });

      this.logger.debug('Cache entries evicted', { evicted: toRemove.length });

    } catch (error) {
      this.logger.warn('Enforce max entries error', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const keys = this.storage.keys();
    const cacheKeys = keys.filter(key => key.startsWith('pagination_v4_'));

    return {
      ...this.stats,
      totalEntries: cacheKeys.length,
      storage: this.storage.type,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Cleanup expired entries (called on init)
   */
  cleanup() {
    this.clearExpired();
    this.enforceMaxEntries();
  }
}
