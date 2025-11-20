/**
 * Rate Limiter Middleware
 * Limitador de peticiones para prevenir abuso
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter general para toda la API
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones, por favor intenta más tarde',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Rate limiter estricto para autenticación
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    success: false,
    message: 'Demasiados intentos de login, por favor intenta más tarde',
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  skipFailedRequests: false,
});

/**
 * Rate limiter para registro de usuarios
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora por IP
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP, intenta más tarde',
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter para creación de recursos
 */
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    success: false,
    message: 'Demasiadas creaciones, por favor espera un momento',
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter para búsquedas
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por minuto
  message: {
    success: false,
    message: 'Demasiadas búsquedas, por favor espera un momento',
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter muy permisivo para desarrollo
 */
const devLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Muy alto para desarrollo
  message: {
    success: false,
    message: 'Rate limit alcanzado',
  },
});

/**
 * Exportar el limiter apropiado según el ambiente
 */
const getLimiter = (type = 'api') => {
  // En desarrollo, usar limiter permisivo
  if (process.env.NODE_ENV === 'development') {
    return devLimiter;
  }

  // En producción, usar limiters estrictos
  switch (type) {
    case 'auth':
      return authLimiter;
    case 'register':
      return registerLimiter;
    case 'create':
      return createLimiter;
    case 'search':
      return searchLimiter;
    case 'api':
    default:
      return apiLimiter;
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
  createLimiter,
  searchLimiter,
  getLimiter,
};
