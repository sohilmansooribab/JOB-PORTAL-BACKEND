const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

// In-memory fallback cache if Redis server is unavailable
const memoryCache = new Map();

const initRedis = () => {
  if (process.env.REDIS_ENABLED === 'false') {
    console.log('[Redis] Disabled via environment configuration. Using in-memory fallback cache.');
    return null;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      connectTimeout: 4000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Connection attempts exceeded. Switching to in-memory fallback cache.');
          return null; // Stop reconnecting
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log(`[Redis] Connected successfully to ${redisUrl}`);
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn(`[Redis] Notice: Redis not reachable (${err.message}). Using in-memory fallback.`);
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });
  } catch (error) {
    console.warn(`[Redis] Initialization warning: ${error.message}`);
    redisClient = null;
    isRedisConnected = false;
  }

  return redisClient;
};

const getRedisClient = () => redisClient;
const isConnected = () => isRedisConnected;
const getMemoryCache = () => memoryCache;

module.exports = {
  initRedis,
  getRedisClient,
  isConnected,
  getMemoryCache,
};
