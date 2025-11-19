/**
 * Application Constants
 * Constantes centralizadas de la aplicación
 */

module.exports = {
  // Roles de usuario
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator', // Para futuro
  },

  // Estados de usuario
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending', // Para verificación de email
  },

  // Estados de quiniela
  QUINIELA_STATUS: {
    DRAFT: 'borrador',
    ACTIVE: 'activa',
    IN_PROGRESS: 'en_progreso',
    COMPLETED: 'completada',
    CANCELLED: 'cancelada',
  },

  // Estados de partido
  PARTIDO_STATUS: {
    PENDING: 'pendiente',
    IN_PROGRESS: 'en_progreso',
    COMPLETED: 'completado',
    POSTPONED: 'pospuesto',
    CANCELLED: 'cancelado',
  },

  // Resultados de partido
  PARTIDO_RESULTS: {
    LOCAL: 'local',
    VISITANTE: 'visitante',
    EMPATE: 'empate',
  },

  // Deportes soportados
  SPORTS: {
    FUTBOL: 'futbol',
    AMERICANO: 'futbol_americano',
    BASKETBALL: 'basketball',
    BASEBALL: 'baseball',
    HOCKEY: 'hockey',
    SOCCER: 'soccer',
  },

  // Estados de participación
  PARTICIPACION_STATUS: {
    PENDING: 'pendiente', // Comprada pero no llenada
    FILLED: 'llenada', // Picks completados
    IN_PROGRESS: 'en_progreso', // Partidos empezaron
    COMPLETED: 'completada', // Todos los partidos terminaron
    WINNER: 'ganadora', // Ganó premio
    LOSER: 'perdedora', // No ganó
  },

  // Tipos de transacción (para futuro)
  TRANSACTION_TYPES: {
    PURCHASE: 'compra',
    PRIZE: 'premio',
    REFUND: 'reembolso',
    WITHDRAWAL: 'retiro',
  },

  // Métodos de pago (para futuro)
  PAYMENT_METHODS: {
    CREDIT_CARD: 'tarjeta_credito',
    DEBIT_CARD: 'tarjeta_debito',
    PAYPAL: 'paypal',
    TRANSFER: 'transferencia',
    CASH: 'efectivo',
  },

  // Tipos de notificación (para futuro)
  NOTIFICATION_TYPES: {
    QUINIELA_CREATED: 'quiniela_creada',
    QUINIELA_STARTING: 'quiniela_iniciando',
    RESULTS_AVAILABLE: 'resultados_disponibles',
    PRIZE_WON: 'premio_ganado',
    SYSTEM: 'sistema',
  },

  // Paginación
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
    MAX_LIMIT: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  },

  // Límites
  LIMITS: {
    MIN_PARTIDOS: 3,
    MAX_PARTIDOS: 50,
    MIN_PRECIO: 10,
    MAX_PRECIO: 10000,
    MIN_PARTICIPANTES: 2,
    MAX_PARTICIPANTES: 10000,
    MIN_NOMBRE_LENGTH: 3,
    MAX_NOMBRE_LENGTH: 100,
    MAX_DESCRIPCION_LENGTH: 500,
  },

  // Códigos de error personalizados
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  },

  // Mensajes de error comunes
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
    EMAIL_EXISTS: 'El email ya está registrado',
    USER_NOT_FOUND: 'Usuario no encontrado',
    QUINIELA_NOT_FOUND: 'Quiniela no encontrada',
    PARTIDO_NOT_FOUND: 'Partido no encontrado',
    PARTICIPACION_NOT_FOUND: 'Participación no encontrada',
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    INVALID_TOKEN: 'Token inválido o expirado',
    QUINIELA_CLOSED: 'La quiniela ya está cerrada',
    QUINIELA_STARTED: 'La quiniela ya ha iniciado',
    INSUFFICIENT_PICKS: 'Faltan picks por completar',
    DUPLICATE_PARTICIPACION: 'Ya estás participando en esta quiniela',
    MAX_PARTICIPANTS_REACHED: 'Se alcanzó el máximo de participantes',
  },

  // Regex patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    PHONE: /^\d{10}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
};
