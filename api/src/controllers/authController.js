/**
 * Auth Controller
 * Controlador de autenticación
 */

const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: result,
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login exitoso',
    data: result,
  });
});

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: profile,
  });
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar perfil
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await authService.updateProfile(req.userId, req.body);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: profile,
  });
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.userId, currentPassword, newPassword);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/v1/auth/request-password-reset
 * @desc    Solicitar reset de contraseña
 * @access  Public
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.requestPasswordReset(email);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset de contraseña con token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
