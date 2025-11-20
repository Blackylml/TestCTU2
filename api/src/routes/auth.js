/**
 * Auth Routes
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const { verifyToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Rutas públicas - Auth tradicional
router.post('/register', registerLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/request-password-reset', authLimiter, authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Rutas públicas - Google OAuth
router.get('/google', googleAuthController.getGoogleAuthUrl);
router.post('/google/login', authLimiter, googleAuthController.loginWithGoogle);
router.get('/google/callback', googleAuthController.googleCallback);

// Rutas protegidas
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

// Rutas protegidas - Google OAuth
router.post('/google/link', verifyToken, googleAuthController.linkGoogleAccount);
router.post('/google/unlink', verifyToken, googleAuthController.unlinkGoogleAccount);

module.exports = router;
