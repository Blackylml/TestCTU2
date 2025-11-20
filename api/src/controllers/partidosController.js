/**
 * Partidos Controller
 * Controlador de partidos
 */

const { Partido } = require('../models');
const calculatorService = require('../services/calculatorService');
const { asyncHandler, validateResourceExists } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

/**
 * @route   POST /api/v1/partidos
 * @desc    Crear nuevo partido
 * @access  Private/Admin
 */
const createPartido = asyncHandler(async (req, res) => {
  const partido = await Partido.create(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Partido creado exitosamente',
    data: partido,
  });
});

/**
 * @route   GET /api/v1/partidos/:id
 * @desc    Obtener partido por ID
 * @access  Public
 */
const getPartido = asyncHandler(async (req, res) => {
  const partido = await Partido.findByPk(req.params.id);
  validateResourceExists(partido, ERROR_MESSAGES.PARTIDO_NOT_FOUND);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: partido,
  });
});

/**
 * @route   PUT /api/v1/partidos/:id
 * @desc    Actualizar partido
 * @access  Private/Admin
 */
const updatePartido = asyncHandler(async (req, res) => {
  const partido = await Partido.findByPk(req.params.id);
  validateResourceExists(partido, ERROR_MESSAGES.PARTIDO_NOT_FOUND);

  await partido.update(req.body);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Partido actualizado exitosamente',
    data: partido,
  });
});

/**
 * @route   PUT /api/v1/partidos/:id/resultado
 * @desc    Actualizar resultado de partido
 * @access  Private/Admin
 */
const updateResultado = asyncHandler(async (req, res) => {
  const { marcador_local, marcador_visitante } = req.body;

  const partido = await calculatorService.actualizarResultadoPartido(
    req.params.id,
    marcador_local,
    marcador_visitante
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Resultado actualizado exitosamente',
    data: partido,
  });
});

/**
 * @route   DELETE /api/v1/partidos/:id
 * @desc    Eliminar partido
 * @access  Private/Admin
 */
const deletePartido = asyncHandler(async (req, res) => {
  const partido = await Partido.findByPk(req.params.id);
  validateResourceExists(partido, ERROR_MESSAGES.PARTIDO_NOT_FOUND);

  await partido.destroy();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Partido eliminado exitosamente',
  });
});

module.exports = {
  createPartido,
  getPartido,
  updatePartido,
  updateResultado,
  deletePartido,
};
