const { getRedisClient, isConnected, getMemoryCache } = require('../config/redis');

const PREFIX = 'job_portal:';

/**
 * Set cache value with TTL in seconds (default 300s = 5m)
 */
const setCache = async (key, data, ttlSeconds = 300) => {
  const fullKey = `${PREFIX}${key}`;
  const serialized = JSON.stringify(data);

  try {
    const redis = getRedisClient();
    if (redis && isConnected()) {
      await redis.setex(fullKey, ttlSeconds, serialized);
      return;
    }
  } catch (err) {
    console.warn(`[Cache] Redis set error for key ${fullKey}:`, err.message);
  }

  // Memory fallback
  const memoryCache = getMemoryCache();
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryCache.set(fullKey, { data: serialized, expiresAt });
};

/**
 * Get cache value
 */
const getCache = async (key) => {
  const fullKey = `${PREFIX}${key}`;

  try {
    const redis = getRedisClient();
    if (redis && isConnected()) {
      const data = await redis.get(fullKey);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    }
  } catch (err) {
    console.warn(`[Cache] Redis get error for key ${fullKey}:`, err.message);
  }

  // Memory fallback
  const memoryCache = getMemoryCache();
  const record = memoryCache.get(fullKey);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    memoryCache.delete(fullKey);
    return null;
  }

  try {
    return JSON.parse(record.data);
  } catch {
    return null;
  }
};

/**
 * Delete a specific key from cache
 */
const deleteCache = async (key) => {
  const fullKey = `${PREFIX}${key}`;

  try {
    const redis = getRedisClient();
    if (redis && isConnected()) {
      await redis.del(fullKey);
    }
  } catch (err) {
    console.warn(`[Cache] Redis del error for key ${fullKey}:`, err.message);
  }

  const memoryCache = getMemoryCache();
  memoryCache.delete(fullKey);
};

/**
 * Clear all cache keys matching a pattern (e.g. 'jobs:*')
 */
const clearCachePattern = async (pattern) => {
  const fullPattern = `${PREFIX}${pattern}`;

  try {
    const redis = getRedisClient();
    if (redis && isConnected()) {
      const keys = await redis.keys(fullPattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (err) {
    console.warn(`[Cache] Redis clear pattern error for pattern ${fullPattern}:`, err.message);
  }

  const memoryCache = getMemoryCache();
  const regex = new RegExp(`^${fullPattern.replace('*', '.*')}`);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};

module.exports = {
  setCache,
  getCache,
  deleteCache,
  clearCachePattern,
};
