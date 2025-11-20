/**
 * Error Handler Middleware
 * Manejo centralizado de errores
 */

const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Clase de error personalizado
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Errores de validación de Sequelize
  if (err instanceof ValidationError) {
    const messages = err.errors.map(e => e.message);
    error = new AppError(
      messages.join(', '),
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Errores de constraint único (duplicados)
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'campo';
    error = new AppError(
      `El ${field} ya existe`,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT
    );
  }

  // Errores de foreign key
  if (err instanceof ForeignKeyConstraintError) {
    error = new AppError(
      'Referencia inválida en la base de datos',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.DATABASE_ERROR
    );
  }

  // Error de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError(
      'JSON inválido',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Errores de Cast (IDs inválidos, etc.)
  if (err.name === 'CastError') {
    error = new AppError(
      'Formato de ID inválido',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Respuesta del error
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const errorCode = error.errorCode || ERROR_CODES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: error.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error,
      }),
    },
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Ruta no encontrada: ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NOT_FOUND
  );
  next(error);
};

/**
 * Wrapper para async handlers
 * Evita tener que usar try/catch en cada controlador
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validar que el recurso existe
 */
const validateResourceExists = (resource, message = 'Recurso no encontrado') => {
  if (!resource) {
    throw new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return resource;
};

/**
 * Validar permisos de acceso
 */
const validatePermission = (condition, message = 'No tienes permisos para esta acción') => {
  if (!condition) {
    throw new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
};

/**
 * Validar condición general
 */
const validateCondition = (condition, message, statusCode = HTTP_STATUS.BAD_REQUEST) => {
  if (!condition) {
    throw new AppError(message, statusCode, ERROR_CODES.VALIDATION_ERROR);
  }
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  validateResourceExists,
  validatePermission,
  validateCondition,
};
