/**
 * Authentication Middleware
 * Middleware para autenticación y autorización
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');
const { USER_ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

/**
 * Verificar token JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, jwtConfig.secret, jwtConfig.verifyOptions);

    // Buscar usuario
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Verificar estado del usuario
    if (user.status !== 'active') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Usuario inactivo o suspendido',
      });
    }

    // Agregar usuario a la request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.rol;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al verificar token',
    });
  }
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, solo agrega el usuario si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, jwtConfig.secret, jwtConfig.verifyOptions);
    const user = await User.findByPk(decoded.userId);

    if (user && user.status === 'active') {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.rol;
    }

    next();
  } catch (error) {
    // Si hay error con el token, simplemente continuar sin usuario
    next();
  }
};

/**
 * Verificar rol de administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
    });
  }

  if (req.user.rol !== USER_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN,
    });
  }

  next();
};

/**
 * Verificar roles (acepta array de roles)
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    next();
  };
};

/**
 * Verificar que el usuario sea el dueño del recurso
 */
const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    // Admin puede acceder a cualquier recurso
    if (req.user.rol === USER_ROLES.ADMIN) {
      return next();
    }

    // Verificar que sea el dueño
    if (req.user.id !== resourceUserId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    next();
  };
};

/**
 * Generar token JWT
 */
const generateToken = (userId, expiresIn = jwtConfig.expiresIn) => {
  return jwt.sign(
    { userId },
    jwtConfig.secret,
    {
      expiresIn,
      ...jwtConfig.signOptions,
    }
  );
};

/**
 * Generar refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
      ...jwtConfig.signOptions,
    }
  );
};

/**
 * Verificar refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret, jwtConfig.verifyOptions);
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }
    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireRoles,
  requireOwnership,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};
