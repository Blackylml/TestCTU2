/**
 * Football API Controller
 * Controlador para integración con RapidAPI Football
 */

const footballAPIService = require('../services/footballAPIService');
const quinielaService = require('../services/quinielaService');
const { Partido } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * @route   GET /api/v1/football/leagues
 * @desc    Obtener ligas disponibles
 * @access  Public
 */
const getLeagues = asyncHandler(async (req, res) => {
  const leagues = footballAPIService.getAvailableLeagues();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: leagues,
    count: leagues.length,
  });
});

/**
 * @route   GET /api/v1/football/fixtures/:leagueKey
 * @desc    Obtener fixtures de una liga
 * @access  Public
 */
const getFixtures = asyncHandler(async (req, res) => {
  const { leagueKey } = req.params;
  const { season, from, to } = req.query;

  const result = await footballAPIService.getFixturesForImport(leagueKey, {
    season,
    from,
    to,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

/**
 * @route   GET /api/v1/football/fixtures/live
 * @desc    Obtener fixtures en vivo
 * @access  Public
 */
const getLiveFixtures = asyncHandler(async (req, res) => {
  const result = await footballAPIService.getLiveFixtures();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/v1/football/import/:quinielaId
 * @desc    Importar fixtures a una quiniela
 * @access  Private/Admin
 */
const importFixtures = asyncHandler(async (req, res) => {
  const { quinielaId } = req.params;
  const { fixtures } = req.body; // Array de fixtures a importar

  if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
    throw new AppError('Debes proporcionar fixtures para importar', HTTP_STATUS.BAD_REQUEST);
  }

  // Verificar que la quiniela existe y el usuario es el creador
  const quiniela = await quinielaService.getQuinielaById(quinielaId, false);

  if (quiniela.creador_id !== req.userId) {
    throw new AppError('No tienes permisos para editar esta quiniela', HTTP_STATUS.FORBIDDEN);
  }

  // Importar fixtures como partidos
  const partidosCreados = [];

  for (let i = 0; i < fixtures.length; i++) {
    const fixtureData = fixtures[i];

    const partido = await Partido.create({
      quiniela_id: quinielaId,
      equipo_local: fixtureData.equipo_local,
      equipo_visitante: fixtureData.equipo_visitante,
      fecha_partido: new Date(fixtureData.fecha_partido),
      liga: fixtureData.liga,
      jornada: fixtureData.jornada,
      estadio: fixtureData.estadio,
      ciudad: fixtureData.ciudad,
      external_id: fixtureData.external_id,
      orden: i,
      metadata: fixtureData.metadata || {},
    });

    partidosCreados.push(partido);
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `${partidosCreados.length} partidos importados exitosamente`,
    data: partidosCreados,
  });
});

/**
 * @route   POST /api/v1/football/sync-results
 * @desc    Sincronizar resultados de partidos con external_id
 * @access  Private/Admin
 */
const syncResults = asyncHandler(async (req, res) => {
  const { partidoIds } = req.body; // Array de IDs de partidos

  if (!partidoIds || !Array.isArray(partidoIds)) {
    throw new AppError('Debes proporcionar IDs de partidos', HTTP_STATUS.BAD_REQUEST);
  }

  // Obtener partidos con external_id
  const partidos = await Partido.findAll({
    where: {
      id: partidoIds,
      external_id: {
        [require('sequelize').Op.ne]: null,
      },
    },
  });

  if (partidos.length === 0) {
    throw new AppError('No se encontraron partidos con ID externo', HTTP_STATUS.NOT_FOUND);
  }

  // Sincronizar resultados
  const externalIds = partidos.map(p => p.external_id);
  const results = await footballAPIService.syncFixtureResults(externalIds);

  // Actualizar partidos con resultados
  const updated = [];
  for (const result of results) {
    if (result.completed) {
      const partido = partidos.find(p => p.external_id === result.external_id);
      if (partido) {
        await partido.marcarCompletado(result.marcador_local, result.marcador_visitante);
        updated.push(partido);
      }
    }
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${updated.length} partidos actualizados`,
    data: {
      total: partidos.length,
      updated: updated.length,
      results,
    },
  });
});

/**
 * @route   GET /api/v1/football/search
 * @desc    Buscar liga por nombre
 * @access  Public
 */
const searchLeague = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new AppError('Debes proporcionar un término de búsqueda', HTTP_STATUS.BAD_REQUEST);
  }

  const league = footballAPIService.findLeague(q);

  if (!league) {
    throw new AppError('Liga no encontrada', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: league,
  });
});

module.exports = {
  getLeagues,
  getFixtures,
  getLiveFixtures,
  importFixtures,
  syncResults,
  searchLeague,
};
