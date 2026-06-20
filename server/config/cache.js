import { createClient } from 'redis';

let isCacheConnected = false;

// Connect to RedVER on standard Redis port 6379
const cache = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Limit reconnect attempts to 5 to avoid infinite loops and log spam in cloud production (Render)
      if (retries > 5) {
        return false; // stops reconnecting
      }
      return 5000; // retry every 5 seconds
    }
  }
});

cache.on('connect', () => {
  isCacheConnected = true;
  console.log('⚡ Connected to RedVER Cache Server (Redis Compatible)');
});

cache.on('ready', () => {
  isCacheConnected = true;
});

cache.on('end', () => {
  isCacheConnected = false;
  console.log('🔌 RedVER Cache connection closed.');
});

cache.on('error', (err) => {
  isCacheConnected = false;
  console.warn('RedVER Cache Error:', err.message);
});

const connectCache = async () => {
  try {
    // Initiate connection. If it fails, the catch block captures it, 
    // and the reconnectStrategy limits further attempts.
    await cache.connect();
  } catch (err) {
    console.warn('⚠️ Failed to connect to RedVER Cache on startup:', err.message);
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
  setEx: async (key, seconds, value) => {
    if (!isCacheConnected) return null;
    try {
      return await cache.setEx(key, seconds, value);
    } catch (err) {
      console.warn('Cache setEx error:', err.message);
      return null;
    }
  },
  keys: async (pattern) => {
    if (!isCacheConnected) return [];
    try {
      return await cache.keys(pattern);
    } catch (err) {
      console.warn('Cache keys error:', err.message);
      return [];
    }
  },
  isConnected: () => isCacheConnected
};

export { cache, connectCache, safeCache };
