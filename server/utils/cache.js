// Simple in-memory cache implementation
class Cache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live
  }

  set(key, value, ttlSeconds = 3600) {
    this.cache.set(key, value);
    
    if (ttlSeconds > 0) {
      const expirationTime = Date.now() + (ttlSeconds * 1000);
      this.ttl.set(key, expirationTime);
      
      // Set timeout to auto-delete
      setTimeout(() => {
        this.delete(key);
      }, ttlSeconds * 1000);
    }
  }

  get(key) {
    // Check if key has expired
    if (this.ttl.has(key)) {
      const expirationTime = this.ttl.get(key);
      if (Date.now() > expirationTime) {
        this.delete(key);
        return null;
      }
    }

    return this.cache.get(key) || null;
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }
}

export default new Cache();