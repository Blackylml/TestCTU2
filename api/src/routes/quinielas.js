/**
 * Quinielas Routes
 * Rutas de quinielas
 */

const express = require('express');
const router = express.Router();
const quinielasController = require('../controllers/quinielasController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  validateCreateQuiniela,
  validateUpdateQuiniela,
  validateCreatePicks,
  validatePagination,
  validateUUID,
} = require('../middleware/validator');
const { createLimiter, searchLimiter } = require('../middleware/rateLimiter');

// Rutas públicas
router.get('/', validatePagination, quinielasController.listQuinielas);
router.get('/disponibles', validatePagination, quinielasController.getDisponibles);
router.get('/:id', validateUUID('id'), quinielasController.getQuiniela);
router.get('/:id/tabla-posiciones', validateUUID('id'), quinielasController.getTablaPosiciones);
router.get('/:id/stats', validateUUID('id'), quinielasController.getStats);

// Rutas protegidas (usuarios)
router.post('/:id/comprar', verifyToken, validateUUID('id'), quinielasController.comprarQuiniela);
router.post('/:id/picks', verifyToken, validateUUID('id'), validateCreatePicks, quinielasController.savePicks);

// Rutas protegidas (admin)
router.post('/', verifyToken, requireAdmin, createLimiter, validateCreateQuiniela, quinielasController.createQuiniela);
router.put('/:id', verifyToken, requireAdmin, validateUpdateQuiniela, quinielasController.updateQuiniela);
router.post('/:id/activar', verifyToken, requireAdmin, validateUUID('id'), quinielasController.activarQuiniela);
router.delete('/:id', verifyToken, requireAdmin, validateUUID('id'), quinielasController.deleteQuiniela);
router.post('/:id/calcular-ganadores', verifyToken, requireAdmin, validateUUID('id'), quinielasController.calcularGanadores);

module.exports = router;
