/**
 * Auth Service
 * Servicio de autenticación y autorización
 */

const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_MESSAGES, USER_STATUS } = require('../config/constants');

/**
 * Registrar nuevo usuario
 */
const register = async (userData) => {
  const { nombre, email, password, telefono, rol = 'user' } = userData;

  // Verificar si el email ya existe
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError(ERROR_MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
  }

  // Crear usuario
  const user = await User.create({
    nombre,
    email,
    password,
    telefono,
    rol,
    status: USER_STATUS.ACTIVE,
  });

  // Generar tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: user.toPublicJSON(),
    token,
    refreshToken,
  };
};

/**
 * Login de usuario
 */
const login = async (email, password) => {
  // Buscar usuario
  const user = await User.findByEmail(email);
  if (!user) {
    throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Verificar si está bloqueado
  if (user.isLocked()) {
    const lockTime = Math.ceil((user.lock_until - Date.now()) / 60000);
    throw new AppError(
      `Cuenta bloqueada. Intenta de nuevo en ${lockTime} minutos`,
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Verificar password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Verificar estado del usuario
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError('Usuario inactivo o suspendido', HTTP_STATUS.FORBIDDEN);
  }

  // Reset intentos de login
  await user.resetLoginAttempts();

  // Generar tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: user.toPublicJSON(),
    token,
    refreshToken,
  };
};

/**
 * Obtener perfil de usuario
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user.toPublicJSON();
};

/**
 * Actualizar perfil
 */
const updateProfile = async (userId, updates) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Campos permitidos para actualizar
  const allowedFields = ['nombre', 'telefono', 'avatar_url', 'fecha_nacimiento'];
  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  await user.update(filteredUpdates);

  return user.toPublicJSON();
};

/**
 * Cambiar contraseña
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Verificar contraseña actual
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Contraseña actual incorrecta', HTTP_STATUS.UNAUTHORIZED);
  }

  // Actualizar contraseña
  user.password = newPassword;
  await user.save();

  return { message: 'Contraseña actualizada exitosamente' };
};

/**
 * Verificar email (para futuro)
 */
const verifyEmail = async (token) => {
  const user = await User.findOne({
    where: { verification_token: token },
  });

  if (!user) {
    throw new AppError('Token de verificación inválido', HTTP_STATUS.BAD_REQUEST);
  }

  await user.update({
    email_verified: true,
    verification_token: null,
  });

  return { message: 'Email verificado exitosamente' };
};

/**
 * Solicitar reset de contraseña (para futuro)
 */
const requestPasswordReset = async (email) => {
  const user = await User.findByEmail(email);
  if (!user) {
    // No revelar si el email existe o no
    return { message: 'Si el email existe, recibirás instrucciones' };
  }

  // Generar token de reset (simplificado, en producción usar crypto)
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hora

  await user.update({
    reset_password_token: resetToken,
    reset_password_expires: resetExpires,
  });

  // TODO: Enviar email con el token

  return { message: 'Si el email existe, recibirás instrucciones' };
};

/**
 * Reset de contraseña (para futuro)
 */
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    where: {
      reset_password_token: token,
      reset_password_expires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError('Token inválido o expirado', HTTP_STATUS.BAD_REQUEST);
  }

  user.password = newPassword;
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();

  return { message: 'Contraseña restablecida exitosamente' };
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};
