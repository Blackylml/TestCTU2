/**
 * Quinielas Controller
 * Controlador de quinielas
 */

const quinielaService = require('../services/quinielaService');
const calculatorService = require('../services/calculatorService');
const { Participacion, Pick, Partido } = require('../models');
const { asyncHandler, AppError, validateResourceExists } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_MESSAGES, PARTICIPACION_STATUS } = require('../config/constants');

/**
 * @route   POST /api/v1/quinielas
 * @desc    Crear nueva quiniela
 * @access  Private/Admin
 */
const createQuiniela = asyncHandler(async (req, res) => {
  const quiniela = await quinielaService.createQuiniela(req.body, req.userId);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Quiniela creada exitosamente',
    data: quiniela,
  });
});

/**
 * @route   GET /api/v1/quinielas
 * @desc    Listar quinielas con filtros
 * @access  Public
 */
const listQuinielas = asyncHandler(async (req, res) => {
  const result = await quinielaService.listQuinielas(req.query);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.quinielas,
    pagination: result.pagination,
  });
});

/**
 * @route   GET /api/v1/quinielas/disponibles
 * @desc    Obtener quinielas disponibles para compra
 * @access  Public
 */
const getDisponibles = asyncHandler(async (req, res) => {
  const result = await quinielaService.getQuinielasDisponibles(req.query);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.quinielas,
    pagination: result.pagination,
  });
});

/**
 * @route   GET /api/v1/quinielas/:id
 * @desc    Obtener quiniela por ID
 * @access  Public
 */
const getQuiniela = asyncHandler(async (req, res) => {
  const quiniela = await quinielaService.getQuinielaById(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: quiniela,
  });
});

/**
 * @route   PUT /api/v1/quinielas/:id
 * @desc    Actualizar quiniela
 * @access  Private/Admin
 */
const updateQuiniela = asyncHandler(async (req, res) => {
  const quiniela = await quinielaService.updateQuiniela(req.params.id, req.body, req.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Quiniela actualizada exitosamente',
    data: quiniela,
  });
});

/**
 * @route   POST /api/v1/quinielas/:id/activar
 * @desc    Activar quiniela (de borrador a activa)
 * @access  Private/Admin
 */
const activarQuiniela = asyncHandler(async (req, res) => {
  const quiniela = await quinielaService.activarQuiniela(req.params.id, req.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Quiniela activada exitosamente',
    data: quiniela,
  });
});

/**
 * @route   DELETE /api/v1/quinielas/:id
 * @desc    Eliminar quiniela
 * @access  Private/Admin
 */
const deleteQuiniela = asyncHandler(async (req, res) => {
  const result = await quinielaService.deleteQuiniela(req.params.id, req.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/v1/quinielas/:id/comprar
 * @desc    Comprar participación en quiniela
 * @access  Private
 */
const comprarQuiniela = asyncHandler(async (req, res) => {
  const participacion = await quinielaService.comprarQuiniela(req.params.id, req.userId);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Quiniela comprada exitosamente',
    data: participacion,
  });
});

/**
 * @route   POST /api/v1/quinielas/:id/picks
 * @desc    Guardar picks de una quiniela
 * @access  Private
 */
const savePicks = asyncHandler(async (req, res) => {
  const { picks } = req.body;

  // Verificar que el usuario tenga una participación
  const participacion = await Participacion.findOne({
    where: {
      user_id: req.userId,
      quiniela_id: req.params.id,
    },
  });

  validateResourceExists(participacion, ERROR_MESSAGES.PARTICIPACION_NOT_FOUND);

  // Verificar que la quiniela no haya cerrado
  const quiniela = await quinielaService.getQuinielaById(req.params.id);
  if (quiniela.isCerrada()) {
    throw new AppError(ERROR_MESSAGES.QUINIELA_CLOSED, HTTP_STATUS.BAD_REQUEST);
  }

  // Guardar picks
  const picksCreados = [];
  for (const pickData of picks) {
    const [pick, created] = await Pick.findOrCreate({
      where: {
        participacion_id: participacion.id,
        partido_id: pickData.partido_id,
      },
      defaults: {
        prediccion: pickData.prediccion,
      },
    });

    if (!created) {
      // Actualizar si ya existe
      await pick.update({ prediccion: pickData.prediccion });
    }

    picksCreados.push(pick);
  }

  // Actualizar contador de picks completados
  const totalPicks = await Pick.count({ where: { participacion_id: participacion.id } });
  await participacion.update({ picks_completados: totalPicks });

  // Si completó todos los picks, marcar como llenada
  if (totalPicks === participacion.total_picks) {
    await participacion.marcarPicksCompletos();
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Picks guardados exitosamente',
    data: {
      picks: picksCreados,
      progreso: `${totalPicks}/${participacion.total_picks}`,
    },
  });
});

/**
 * @route   GET /api/v1/quinielas/:id/tabla-posiciones
 * @desc    Obtener tabla de posiciones
 * @access  Public
 */
const getTablaPosiciones = asyncHandler(async (req, res) => {
  const tabla = await calculatorService.getTablaPosiciones(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: tabla,
  });
});

/**
 * @route   GET /api/v1/quinielas/:id/stats
 * @desc    Obtener estadísticas de la quiniela
 * @access  Public
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await quinielaService.getQuinielaStats(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
});

/**
 * @route   POST /api/v1/quinielas/:id/calcular-ganadores
 * @desc    Calcular ganadores y distribuir premios
 * @access  Private/Admin
 */
const calcularGanadores = asyncHandler(async (req, res) => {
  const ganadores = await calculatorService.calcularGanadores(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Ganadores calculados y premios distribuidos',
    data: ganadores,
  });
});

module.exports = {
  createQuiniela,
  listQuinielas,
  getDisponibles,
  getQuiniela,
  updateQuiniela,
  activarQuiniela,
  deleteQuiniela,
  comprarQuiniela,
  savePicks,
  getTablaPosiciones,
  getStats,
  calcularGanadores,
};
