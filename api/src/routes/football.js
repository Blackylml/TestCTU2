/**
 * Football API Routes
 * Rutas para integración con RapidAPI Football
 */

const express = require('express');
const router = express.Router();
const footballAPIController = require('../controllers/footballAPIController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validator');
const { searchLimiter } = require('../middleware/rateLimiter');

// Rutas públicas
router.get('/leagues', footballAPIController.getLeagues);
router.get('/search', searchLimiter, footballAPIController.searchLeague);
router.get('/fixtures/:leagueKey', footballAPIController.getFixtures);
router.get('/fixtures/live', footballAPIController.getLiveFixtures);

// Rutas protegidas (admin)
router.post('/import/:quinielaId', verifyToken, requireAdmin, validateUUID('quinielaId'), footballAPIController.importFixtures);
router.post('/sync-results', verifyToken, requireAdmin, footballAPIController.syncResults);

module.exports = router;
