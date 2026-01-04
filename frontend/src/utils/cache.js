/**
 * Cache utility for storing API responses
 * Similar to Facebook's caching strategy
 * Reduces skeleton loaders and improves navigation speed
 */

class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Set cache with optional TTL (Time To Live)
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, {
      createdAt: Date.now(),
      ttl: ttl
    });
  }

  /**
   * Get cached data if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp.createdAt > timestamp.ttl) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Check if cache exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Pattern to match (e.g., 'posts', 'blogs')
   */
  invalidatePattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const cache = new DataCache();

// Cache key generators
export const CacheKeys = {
  POSTS: (filter = 'all') => `posts_${filter}`,
  TRENDING_POSTS: 'trending_posts',
  TRENDING_BLOGS: 'trending_blogs',
  BLOGS: 'blogs',
  USER_PROFILE: (username) => `profile_${username}`,
  POST_DETAIL: (id) => `post_${id}`,
  BLOG_DETAIL: (id) => `blog_${id}`,
  COMMENTS: (type, id) => `comments_${type}_${id}`,
  NOTIFICATIONS: 'notifications',
  FEED: 'user_feed'
};

// Cache TTL configurations (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - default
  LONG: 15 * 60 * 1000,      // 15 minutes - for stable data
  VERY_LONG: 60 * 60 * 1000  // 1 hour - for rarely changing data
};

export default cache;
