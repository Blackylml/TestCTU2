/**
 * Google Auth Controller
 * Controlador para autenticación con Google OAuth
 */

const googleAuthService = require('../services/googleAuthService');
const { asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * @route   GET /api/v1/auth/google
 * @desc    Obtener URL de autorización de Google
 * @access  Public
 */
const getGoogleAuthUrl = asyncHandler(async (req, res) => {
  const authUrl = googleAuthService.getAuthUrl();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      authUrl,
    },
  });
});

/**
 * @route   POST /api/v1/auth/google/login
 * @desc    Login con ID Token de Google (desde frontend)
 * @access  Public
 */
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'ID Token de Google requerido',
    });
  }

  const result = await googleAuthService.loginWithGoogleToken(idToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: result.isNewUser ? 'Cuenta creada exitosamente' : 'Login exitoso',
    data: result,
  });
});

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Callback de Google OAuth (flujo completo desde backend)
 * @access  Public
 */
const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Código de autorización requerido',
    });
  }

  const result = await googleAuthService.handleGoogleCallback(code);

  // Redirigir al frontend con el token
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
  const redirectUrl = `${frontendUrl}/auth/google-success?token=${result.token}&refreshToken=${result.refreshToken}`;

  res.redirect(redirectUrl);
});

/**
 * @route   POST /api/v1/auth/google/link
 * @desc    Vincular cuenta de Google a usuario existente
 * @access  Private
 */
const linkGoogleAccount = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'ID Token de Google requerido',
    });
  }

  const result = await googleAuthService.linkGoogleAccount(req.userId, idToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/v1/auth/google/unlink
 * @desc    Desvincular cuenta de Google
 * @access  Private
 */
const unlinkGoogleAccount = asyncHandler(async (req, res) => {
  const result = await googleAuthService.unlinkGoogleAccount(req.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

module.exports = {
  getGoogleAuthUrl,
  loginWithGoogle,
  googleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
};
