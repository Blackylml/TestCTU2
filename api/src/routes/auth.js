/**
 * Auth Routes
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Rutas públicas
router.post('/register', registerLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/request-password-reset', authLimiter, authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
