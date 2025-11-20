/**
 * Cache Controller
 * Controlador para gestión de caché
 */

const cacheService = require('../services/cacheService');
const { asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * @route   GET /api/v1/cache/stats
 * @desc    Obtener estadísticas de caché
 * @access  Private/Admin
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = cacheService.getStats();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
});

/**
 * @route   POST /api/v1/cache/clear
 * @desc    Limpiar toda la caché
 * @access  Private/Admin
 */
const clearCache = asyncHandler(async (req, res) => {
  cacheService.clear();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Caché limpiada exitosamente',
  });
});

/**
 * @route   DELETE /api/v1/cache/:key
 * @desc    Eliminar entrada específica de caché
 * @access  Private/Admin
 */
const deleteKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  cacheService.delete(key);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Clave ${key} eliminada de caché`,
  });
});

module.exports = {
  getStats,
  clearCache,
  deleteKey,
};
