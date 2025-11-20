/**
 * Cache Service
 * Servicio de caché en memoria para reducir llamadas a APIs externas
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live
  }

  /**
   * Guardar en caché
   * @param {string} key - Clave única
   * @param {any} value - Valor a guardar
   * @param {number} ttlSeconds - Tiempo de vida en segundos (default: 3600 = 1 hora)
   */
  set(key, value, ttlSeconds = 3600) {
    this.cache.set(key, value);

    // Calcular tiempo de expiración
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.ttl.set(key, expiresAt);

    // Log para debugging
    console.log(`📦 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Obtener de caché
   * @param {string} key - Clave única
   * @returns {any|null} Valor o null si expiró/no existe
   */
  get(key) {
    // Verificar si existe
    if (!this.cache.has(key)) {
      return null;
    }

    // Verificar si expiró
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      console.log(`🗑️  Cache EXPIRED: ${key}`);
      this.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT: ${key}`);
    return this.cache.get(key);
  }

  /**
   * Verificar si existe y es válido
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Eliminar de caché
   */
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  /**
   * Limpiar toda la caché
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Obtener o ejecutar función si no existe en caché
   * @param {string} key - Clave única
   * @param {Function} fn - Función async a ejecutar si no hay caché
   * @param {number} ttlSeconds - Tiempo de vida
   */
  async getOrSet(key, fn, ttlSeconds = 3600) {
    // Intentar obtener de caché
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // No está en caché, ejecutar función
    console.log(`❌ Cache MISS: ${key} - Fetching...`);
    const value = await fn();

    // Guardar en caché
    this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Limpiar caché expirada
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, expiresAt] of this.ttl.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Obtener estadísticas de caché
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instancia singleton
const cacheService = new CacheService();

// Limpiar caché expirada cada 5 minutos
setInterval(() => {
  cacheService.cleanExpired();
}, 5 * 60 * 1000);

module.exports = cacheService;
