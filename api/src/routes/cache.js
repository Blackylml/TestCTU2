/**
 * Cache Routes
 * Rutas para gestión de caché
 */

const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren admin
router.get('/stats', verifyToken, requireAdmin, cacheController.getStats);
router.post('/clear', verifyToken, requireAdmin, cacheController.clearCache);
router.delete('/:key', verifyToken, requireAdmin, cacheController.deleteKey);

module.exports = router;
