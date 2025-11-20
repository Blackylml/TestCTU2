/**
 * Validator Middleware
 * Middleware de validación usando express-validator
 */

const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Middleware para verificar resultados de validación
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

/**
 * Validaciones para autenticación
 */
const validateRegister = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono')
    .optional()
    .matches(/^\d{10}$/).withMessage('Teléfono inválido (10 dígitos)'),
  validate,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  validate,
];

/**
 * Validaciones para quinielas
 */
const validateCreateQuiniela = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('deporte')
    .trim()
    .notEmpty().withMessage('El deporte es requerido'),
  body('precio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0')
    .toFloat(),
  body('premio_total')
    .isFloat({ min: 0 }).withMessage('El premio debe ser mayor a 0')
    .toFloat(),
  body('fecha_inicio')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('Fecha de inicio inválida')
    .toDate(),
  body('fecha_cierre')
    .notEmpty().withMessage('La fecha de cierre es requerida')
    .isISO8601().withMessage('Fecha de cierre inválida')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.fecha_inicio)) {
        throw new Error('La fecha de cierre debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
  body('max_participantes')
    .optional()
    .isInt({ min: 2 }).withMessage('Mínimo 2 participantes')
    .toInt(),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  validate,
];

const validateUpdateQuiniela = [
  param('id')
    .isUUID().withMessage('ID de quiniela inválido'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('precio')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0')
    .toFloat(),
  body('premio_total')
    .optional()
    .isFloat({ min: 0 }).withMessage('El premio debe ser mayor a 0')
    .toFloat(),
  validate,
];

/**
 * Validaciones para partidos
 */
const validateCreatePartido = [
  body('quiniela_id')
    .notEmpty().withMessage('El ID de quiniela es requerido')
    .isUUID().withMessage('ID de quiniela inválido'),
  body('equipo_local')
    .trim()
    .notEmpty().withMessage('El equipo local es requerido'),
  body('equipo_visitante')
    .trim()
    .notEmpty().withMessage('El equipo visitante es requerido'),
  body('fecha_partido')
    .notEmpty().withMessage('La fecha del partido es requerida')
    .isISO8601().withMessage('Fecha de partido inválida')
    .toDate(),
  body('orden')
    .optional()
    .isInt({ min: 0 }).withMessage('Orden inválido')
    .toInt(),
  validate,
];

const validateUpdateResultado = [
  param('id')
    .isUUID().withMessage('ID de partido inválido'),
  body('marcador_local')
    .notEmpty().withMessage('El marcador local es requerido')
    .isInt({ min: 0 }).withMessage('Marcador inválido')
    .toInt(),
  body('marcador_visitante')
    .notEmpty().withMessage('El marcador visitante es requerido')
    .isInt({ min: 0 }).withMessage('Marcador inválido')
    .toInt(),
  validate,
];

/**
 * Validaciones para picks
 */
const validateCreatePicks = [
  body('picks')
    .isArray({ min: 1 }).withMessage('Debe proporcionar al menos un pick'),
  body('picks.*.partido_id')
    .notEmpty().withMessage('El ID del partido es requerido')
    .isUUID().withMessage('ID de partido inválido'),
  body('picks.*.prediccion')
    .notEmpty().withMessage('La predicción es requerida')
    .isIn(['local', 'visitante', 'empate']).withMessage('Predicción inválida'),
  validate,
];

/**
 * Validaciones para paginación
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página inválida')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Límite inválido (1-100)')
    .toInt(),
  validate,
];

/**
 * Validaciones para UUID en params
 */
const validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID().withMessage(`${paramName} inválido`),
  validate,
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateCreateQuiniela,
  validateUpdateQuiniela,
  validateCreatePartido,
  validateUpdateResultado,
  validateCreatePicks,
  validatePagination,
  validateUUID,
};
