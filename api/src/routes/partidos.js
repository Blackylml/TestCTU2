/**
 * Partidos Routes
 * Rutas de partidos
 */

const express = require('express');
const router = express.Router();
const partidosController = require('../controllers/partidosController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  validateCreatePartido,
  validateUpdateResultado,
  validateUUID,
} = require('../middleware/validator');

// Rutas públicas
router.get('/:id', validateUUID('id'), partidosController.getPartido);

// Rutas protegidas (admin)
router.post('/', verifyToken, requireAdmin, validateCreatePartido, partidosController.createPartido);
router.put('/:id', verifyToken, requireAdmin, validateUUID('id'), partidosController.updatePartido);
router.put('/:id/resultado', verifyToken, requireAdmin, validateUpdateResultado, partidosController.updateResultado);
router.delete('/:id', verifyToken, requireAdmin, validateUUID('id'), partidosController.deletePartido);

module.exports = router;
