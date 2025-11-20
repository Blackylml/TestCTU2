/**
 * Football API Service
 * Servicio para integración con RapidAPI Football
 */

const axios = require('axios');
const cacheService = require('./cacheService');

// Configuración de RapidAPI Football
const FOOTBALL_API_CONFIG = {
  host: process.env.FOOTBALL_API_HOST || 'api-football-v1.p.rapidapi.com',
  key: process.env.FOOTBALL_API_KEY || '1dec45416emsh269d1d4adce38e2p136b9bjsn951df1a6d6c5',
  baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
};

// IDs de ligas configuradas
const LIGAS = {
  'liga_mx': { id: 262, name: 'Liga MX', country: 'Mexico' },
  'mls': { id: 253, name: 'MLS', country: 'USA' },
  'leagues_cup': { id: 772, name: 'Leagues Cup', country: 'USA' },
  'concacaf_champions': { id: 16, name: 'CONCACAF Champions League', country: 'World' },
  'champions_league': { id: 2, name: 'UEFA Champions League', country: 'World' },
  'premier_league': { id: 39, name: 'Premier League', country: 'England' },
  'la_liga': { id: 140, name: 'La Liga', country: 'Spain' },
  'serie_a': { id: 135, name: 'Serie A', country: 'Italy' },
  'bundesliga': { id: 78, name: 'Bundesliga', country: 'Germany' },
  'ligue_1': { id: 61, name: 'Ligue 1', country: 'France' },
  'eredivisie': { id: 88, name: 'Eredivisie', country: 'Netherlands' },
  'primeira_liga': { id: 94, name: 'Primeira Liga', country: 'Portugal' },
  'liga_argentina': { id: 128, name: 'Liga Profesional', country: 'Argentina' },
  'brasileirao': { id: 71, name: 'Brasileirão Série A', country: 'Brazil' },
  'liga_colombia': { id: 239, name: 'Liga BetPlay', country: 'Colombia' },
};

/**
 * Cliente HTTP para RapidAPI Football
 */
const footballAPIClient = axios.create({
  baseURL: FOOTBALL_API_CONFIG.baseURL,
  headers: {
    'x-rapidapi-host': FOOTBALL_API_CONFIG.host,
    'x-rapidapi-key': FOOTBALL_API_CONFIG.key,
  },
  timeout: 10000,
});

/**
 * Obtener ligas disponibles
 */
const getAvailableLeagues = () => {
  return Object.entries(LIGAS).map(([key, value]) => ({
    key,
    ...value,
  }));
};

/**
 * Buscar liga por ID o nombre
 */
const findLeague = (searchTerm) => {
  const term = searchTerm.toLowerCase();

  // Buscar por key
  if (LIGAS[term]) {
    return { key: term, ...LIGAS[term] };
  }

  // Buscar por nombre
  for (const [key, liga] of Object.entries(LIGAS)) {
    if (liga.name.toLowerCase().includes(term)) {
      return { key, ...liga };
    }
  }

  return null;
};

/**
 * Obtener fixtures de una liga
 * @param {number} leagueId - ID de la liga
 * @param {string} season - Temporada (ej: "2024")
 * @param {string} from - Fecha desde (YYYY-MM-DD)
 * @param {string} to - Fecha hasta (YYYY-MM-DD)
 * @param {boolean} useCache - Usar caché (default: true)
 */
const getFixtures = async (leagueId, season = null, from = null, to = null, useCache = true) => {
  const params = {
    league: leagueId,
  };

  // Si no se especifica temporada, usar año actual
  if (season) {
    params.season = season;
  } else {
    params.season = new Date().getFullYear();
  }

  // Filtros de fecha
  if (from) params.from = from;
  if (to) params.to = to;

  // Si no hay filtros de fecha, obtener próximos 30 días
  if (!from && !to) {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);

    params.from = today.toISOString().split('T')[0];
    params.to = nextMonth.toISOString().split('T')[0];
  }

  // Clave única de caché
  const cacheKey = `fixtures:${leagueId}:${params.season}:${params.from}:${params.to}`;

  // Función que consulta la API
  const fetchFromAPI = async () => {
    try {
      console.log('📡 Consultando RapidAPI Football:', params);

      const response = await footballAPIClient.get('/fixtures', { params });

      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        throw new Error(`API Error: ${JSON.stringify(response.data.errors)}`);
      }

      return {
        success: true,
        fixtures: response.data.response || [],
        count: response.data.results || 0,
      };
    } catch (error) {
      console.error('❌ Error obteniendo fixtures:', error.message);
      throw new Error(`Error al consultar API de fútbol: ${error.message}`);
    }
  };

  // Usar caché o consultar API
  if (useCache) {
    // Caché de 1 hora (3600 segundos)
    return cacheService.getOrSet(cacheKey, fetchFromAPI, 3600);
  } else {
    return fetchFromAPI();
  }
};

/**
 * Obtener fixtures de una liga por key
 */
const getFixturesByLeagueKey = async (leagueKey, options = {}) => {
  const liga = LIGAS[leagueKey];

  if (!liga) {
    throw new Error(`Liga no encontrada: ${leagueKey}`);
  }

  return getFixtures(liga.id, options.season, options.from, options.to);
};

/**
 * Formatear fixture de la API a formato de nuestro modelo Partido
 */
const formatFixtureToPartido = (fixture) => {
  return {
    equipo_local: fixture.teams.home.name,
    equipo_visitante: fixture.teams.away.name,
    fecha_partido: new Date(fixture.fixture.date),
    liga: fixture.league.name,
    jornada: fixture.league.round,
    estadio: fixture.fixture.venue?.name || null,
    ciudad: fixture.fixture.venue?.city || null,
    external_id: fixture.fixture.id.toString(),
    metadata: {
      api_source: 'rapidapi-football',
      league_id: fixture.league.id,
      season: fixture.league.season,
      referee: fixture.fixture.referee,
      logo_local: fixture.teams.home.logo,
      logo_visitante: fixture.teams.away.logo,
    },
  };
};

/**
 * Obtener fixtures formateados para importar
 */
const getFixturesForImport = async (leagueKey, options = {}) => {
  const result = await getFixturesByLeagueKey(leagueKey, options);

  return {
    success: true,
    liga: LIGAS[leagueKey],
    fixtures: result.fixtures.map(formatFixtureToPartido),
    count: result.count,
  };
};

/**
 * Buscar fixture por ID externo
 */
const getFixtureById = async (fixtureId) => {
  try {
    const response = await footballAPIClient.get('/fixtures', {
      params: { id: fixtureId },
    });

    if (response.data.response && response.data.response.length > 0) {
      return formatFixtureToPartido(response.data.response[0]);
    }

    return null;
  } catch (error) {
    console.error('❌ Error obteniendo fixture:', error.message);
    throw error;
  }
};

/**
 * Obtener resultado actualizado de un fixture
 * Útil para actualizar resultados automáticamente
 */
const getFixtureResult = async (fixtureId) => {
  try {
    const response = await footballAPIClient.get('/fixtures', {
      params: { id: fixtureId },
    });

    if (response.data.response && response.data.response.length > 0) {
      const fixture = response.data.response[0];

      if (fixture.fixture.status.short === 'FT') { // Full Time
        return {
          completed: true,
          marcador_local: fixture.goals.home,
          marcador_visitante: fixture.goals.away,
        };
      }

      return {
        completed: false,
        status: fixture.fixture.status.long,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error obteniendo resultado:', error.message);
    throw error;
  }
};

/**
 * Obtener fixtures en vivo
 */
const getLiveFixtures = async () => {
  try {
    const response = await footballAPIClient.get('/fixtures', {
      params: { live: 'all' },
    });

    return {
      success: true,
      fixtures: (response.data.response || []).map(formatFixtureToPartido),
      count: response.data.results || 0,
    };
  } catch (error) {
    console.error('❌ Error obteniendo fixtures en vivo:', error.message);
    throw error;
  }
};

/**
 * Actualizar resultados de partidos automáticamente
 * Busca partidos con external_id y actualiza sus resultados
 */
const syncFixtureResults = async (externalIds) => {
  const results = [];

  for (const externalId of externalIds) {
    try {
      const result = await getFixtureResult(externalId);
      if (result) {
        results.push({
          external_id: externalId,
          ...result,
        });
      }
    } catch (error) {
      console.error(`❌ Error sincronizando fixture ${externalId}:`, error.message);
    }
  }

  return results;
};

module.exports = {
  LIGAS,
  getAvailableLeagues,
  findLeague,
  getFixtures,
  getFixturesByLeagueKey,
  getFixturesForImport,
  getFixtureById,
  getFixtureResult,
  getLiveFixtures,
  syncFixtureResults,
  formatFixtureToPartido,
};
