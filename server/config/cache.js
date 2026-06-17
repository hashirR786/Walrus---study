import { createClient } from 'redis';

// Connect to RedVER on standard Redis port 6379
const cache = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

cache.on('error', (err) => {
  // Suppress repeated logs if connection fails
  if (process.env.NODE_ENV !== 'production') {
    console.warn('RedVER Cache Error:', err.message);
  }
});

let isCacheConnected = false;

const connectCache = async () => {
  try {
    await cache.connect();
    isCacheConnected = true;
    console.log('⚡ Connected to RedVER Cache Server (Redis Compatible)');
  } catch (err) {
    console.warn('⚠️ Failed to connect to RedVER Cache on 127.0.0.1:6379. Running without cache.');
    isCacheConnected = false;
  }
};

// Helper utility to safely execute cache operations without crashing if RedVER is down
const safeCache = {
  get: async (key) => {
    if (!isCacheConnected) return null;
    try {
      return await cache.get(key);
    } catch (err) {
      console.warn('Cache get error:', err.message);
      return null;
    }
  },
  set: async (key, value, options = {}) => {
    if (!isCacheConnected) return null;
    try {
      return await cache.set(key, value, options);
    } catch (err) {
      console.warn('Cache set error:', err.message);
      return null;
    }
  },
  del: async (key) => {
    if (!isCacheConnected) return null;
    try {
      return await cache.del(key);
    } catch (err) {
      console.warn('Cache del error:', err.message);
      return null;
    }
  },
  incr: async (key) => {
    if (!isCacheConnected) return null;
    try {
      return await cache.incr(key);
    } catch (err) {
      console.warn('Cache incr error:', err.message);
      return null;
    }
  },
  expire: async (key, seconds) => {
    if (!isCacheConnected) return null;
    try {
      return await cache.expire(key, seconds);
    } catch (err) {
      console.warn('Cache expire error:', err.message);
      return null;
    }
  },
  isConnected: () => isCacheConnected
};

export { cache, connectCache, safeCache };
