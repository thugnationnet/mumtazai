/**
 * RATE LIMITING & CACHING UTILITIES
 * Advanced rate limiting and caching configuration
 */

import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

// ============================================
// RATE LIMITING CONFIGURATIONS
// ============================================

export const rateLimiters = {
  // Global rate limiter
  global: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs (increased for better UX)
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/version';
    },
  }),

  // API rate limiter
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limit each IP to 2000 API requests per windowMs (increased for heavy usage)
    message: {
      success: false,
      message: 'API rate limit exceeded, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication rate limiter (stricter)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth attempts per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful auth attempts
  }),

  // File upload rate limiter
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // limit each IP to 100 uploads per hour (increased for power users)
    message: {
      success: false,
      message: 'Upload rate limit exceeded, please try again later.',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Search rate limiter
  search: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 searches per minute (increased for better UX)
    message: {
      success: false,
      message: 'Search rate limit exceeded, please try again later.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // AI agent interaction rate limiter
  agent: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 agent interactions per minute (increased for advanced AI usage)
    message: {
      success: false,
      message: 'Agent interaction rate limit exceeded, please try again later.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Community posting rate limiter
  community: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each IP to 50 posts per hour (increased for active users)
    message: {
      success: false,
      message: 'Posting rate limit exceeded, please try again later.',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// ============================================
// REDIS CACHE CONFIGURATION
// ============================================

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.initialized = false;
    // Initialize Redis connection on startup
    this.init();
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    // Already initialized in constructor
  }

  async init() {
    this.initialized = true;
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      // Try Redis first
      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: false, // Connect immediately
        connectTimeout: 10000,
        reconnectOnError: (err) => {
          console.warn('⚠️ Redis reconnect error:', err.message);
          return true; // Allow reconnection
        },
      });

      this.client.on('connect', () => {
        console.log('✅ Redis cache connected to:', redisUrl.replace(/:[^:@]+@/, ':***@'));
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis cache ready');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.warn('⚠️ Redis connection closed');
        this.isConnected = false;
      });

      // Test connection with ping
      await this.client.ping();
      console.log('✅ Redis PING successful');
      this.isConnected = true;
      
    } catch (error) {
      console.warn('⚠️ Redis not available, using in-memory cache:', error.message);
      this.client = null;
      this.isConnected = false;
    }
  }

  async get(key) {
    await this.ensureInitialized();

    try {
      if (this.client && this.isConnected) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else if (this.memoryCache) {
        const value = this.memoryCache.get(key);
        if (value && value.expires > Date.now()) {
          return value.data;
        } else if (value) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    await this.ensureInitialized();

    try {
      const data = JSON.stringify(value);
      if (this.client && this.isConnected) {
        await this.client.setex(key, ttlSeconds, data);
      } else if (this.memoryCache) {
        this.memoryCache.set(key, {
          data: value,
          expires: Date.now() + ttlSeconds * 1000,
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    await this.ensureInitialized();

    try {
      if (this.client && this.isConnected) {
        await this.client.del(key);
      } else if (this.memoryCache) {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(pattern = '*') {
    await this.ensureInitialized();

    try {
      if (this.client && this.isConnected) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else if (this.memoryCache) {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Cache middleware for Express
  middleware(ttlSeconds = 300, keyGenerator = null) {
    return async (req, res, next) => {
      const key = keyGenerator
        ? keyGenerator(req)
        : `${req.method}:${req.originalUrl}`;

      try {
        const cached = await this.get(key);
        if (cached) {
          return res.json(cached);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
          this.get(key).then((cached) => {
            if (!cached) {
              this.set(key, data, ttlSeconds);
            }
          });
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (_error) {
        next();
      }
    };
  }
}

// Export singleton cache instance
export const cache = new CacheManager();

// ============================================
// CACHE KEY GENERATORS
// ============================================

export const cacheKeys = {
  user: (userId) => `user:${userId}`,
  agent: (agentId) => `agent:${agentId}`,
  analytics: (type, userId, date) => `analytics:${type}:${userId}:${date}`,
  community: (postId) => `community:${postId}`,
  search: (query, filters) => `search:${query}:${JSON.stringify(filters)}`,
  api: (method, path) => `api:${method}:${path}`,
};

// ============================================
// RESPONSE CACHING UTILITIES
// ============================================

export const responseCache = {
  // Cache successful responses
  success: (res, data, ttl = 300) => {
    const key = cacheKeys.api(res.req.method, res.req.originalUrl);
    cache.set(key, data, ttl);
    return res.json(data);
  },

  // Cache with conditional TTL based on data freshness
  conditional: (res, data, lastModified, maxAge = 3600) => {
    const age = Date.now() - new Date(lastModified).getTime();
    const ttl = Math.max(60, maxAge - Math.floor(age / 1000)); // Minimum 1 minute
    return responseCache.success(res, data, ttl);
  },
};

// ============================================
// DATABASE QUERY CACHING
// ============================================

export const queryCache = {
  // Cache database query results
  query: async (queryKey, queryFn, ttl = 300) => {
    const cached = await cache.get(queryKey);
    if (cached) {
      return cached;
    }

    const result = await queryFn();
    if (result) {
      await cache.set(queryKey, result, ttl);
    }
    return result;
  },

  // Invalidate cache patterns
  invalidate: async (pattern) => {
    await cache.clear(pattern);
  },

  // Cache user-specific data
  userData: async (userId, dataType, queryFn, ttl = 600) => {
    const key = `user:${userId}:${dataType}`;
    return queryCache.query(key, queryFn, ttl);
  },

  // Cache analytics data
  analytics: async (type, params, queryFn, ttl = 1800) => {
    const key = `analytics:${type}:${JSON.stringify(params)}`;
    return queryCache.query(key, queryFn, ttl);
  },
};
