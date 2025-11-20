/**
 * API Client - QuinielaPro Frontend
 * Cliente para comunicarse con la API REST
 */

class APIClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.apiVersion = 'v1';
    this.token = this.getToken();
    this.refreshToken = this.getRefreshToken();
  }

  /**
   * Configurar base URL (útil para producción)
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Obtener token de localStorage
   */
  getToken() {
    return localStorage.getItem('quinielaPro_token');
  }

  /**
   * Obtener refresh token de localStorage
   */
  getRefreshToken() {
    return localStorage.getItem('quinielaPro_refreshToken');
  }

  /**
   * Guardar token en localStorage
   */
  setToken(token, refreshToken = null) {
    this.token = token;
    localStorage.setItem('quinielaPro_token', token);

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('quinielaPro_refreshToken', refreshToken);
    }
  }

  /**
   * Limpiar tokens
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('quinielaPro_token');
    localStorage.removeItem('quinielaPro_refreshToken');
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Construir URL completa
   */
  buildUrl(endpoint) {
    // Eliminar slash inicial si existe
    endpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

    // Si el endpoint ya incluye /api/v1, usarlo directamente
    if (endpoint.startsWith('api/')) {
      return `${this.baseUrl}/${endpoint}`;
    }

    // Sino, agregar /api/v1
    return `${this.baseUrl}/api/${this.apiVersion}/${endpoint}`;
  }

  /**
   * Obtener headers por defecto
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Manejar respuestas
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    // Parsear respuesta
    const data = isJson ? await response.json() : await response.text();

    // Si la respuesta no es OK
    if (!response.ok) {
      // Token expirado, intentar refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Reintentar la petición original no es trivial aquí
          // El usuario debería reintentar la acción
          throw new Error('TOKEN_REFRESHED');
        }
      }

      // Error del servidor
      const error = new Error(data.message || data.error || 'Error en la petición');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Refrescar token de acceso
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(this.buildUrl('auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.data.token, data.data.refreshToken);
        return true;
      }

      // Refresh falló, limpiar tokens
      this.clearTokens();
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Realizar petición GET
   */
  async get(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options.auth !== false),
      ...options,
    });

    return this.handleResponse(response);
  }

  /**
   * Realizar petición POST
   */
  async post(endpoint, data = {}, options = {}) {
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options.auth !== false),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse(response);
  }

  /**
   * Realizar petición PUT
   */
  async put(endpoint, data = {}, options = {}) {
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(options.auth !== false),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse(response);
  }

  /**
   * Realizar petición DELETE
   */
  async delete(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options.auth !== false),
      ...options,
    });

    return this.handleResponse(response);
  }

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    const response = await this.post('auth/register', userData, { auth: false });

    if (response.success && response.data.token) {
      this.setToken(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    const response = await this.post('auth/login', { email, password }, { auth: false });

    if (response.success && response.data.token) {
      this.setToken(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  /**
   * Login con Google
   */
  async loginWithGoogle(googleToken) {
    const response = await this.post('auth/google', { token: googleToken }, { auth: false });

    if (response.success && response.data.token) {
      this.setToken(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  /**
   * Cerrar sesión
   */
  logout() {
    this.clearTokens();
    // Opcional: Llamar endpoint de logout en el backend
    // await this.post('auth/logout');
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile() {
    return this.get('auth/profile');
  }

  // ==========================================
  // MÉTODOS DE QUINIELAS
  // ==========================================

  /**
   * Obtener todas las quinielas
   */
  async getQuinielas(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `quinielas?${params}` : 'quinielas';
    return this.get(endpoint);
  }

  /**
   * Obtener quinielas disponibles (no finalizadas)
   */
  async getQuinielasDisponibles() {
    return this.get('quinielas/disponibles');
  }

  /**
   * Obtener quiniela por ID
   */
  async getQuiniela(id) {
    return this.get(`quinielas/${id}`);
  }

  /**
   * Crear nueva quiniela (Admin)
   */
  async createQuiniela(quinielaData) {
    return this.post('quinielas', quinielaData);
  }

  /**
   * Actualizar quiniela (Admin)
   */
  async updateQuiniela(id, quinielaData) {
    return this.put(`quinielas/${id}`, quinielaData);
  }

  /**
   * Eliminar quiniela (Admin)
   */
  async deleteQuiniela(id) {
    return this.delete(`quinielas/${id}`);
  }

  /**
   * Comprar/participar en quiniela
   */
  async participarEnQuiniela(quinielaId, picks) {
    return this.post(`quinielas/${quinielaId}/participar`, { picks });
  }

  /**
   * Obtener mis participaciones
   */
  async getMisParticipaciones() {
    return this.get('quinielas/mis-participaciones');
  }

  /**
   * Obtener tabla de posiciones
   */
  async getTablaPosiciones(quinielaId) {
    return this.get(`quinielas/${quinielaId}/tabla-posiciones`);
  }

  /**
   * Calcular ganadores (Admin)
   */
  async calcularGanadores(quinielaId) {
    return this.post(`quinielas/${quinielaId}/calcular-ganadores`);
  }

  // ==========================================
  // MÉTODOS DE PARTIDOS
  // ==========================================

  /**
   * Obtener partidos
   */
  async getPartidos(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `partidos?${params}` : 'partidos';
    return this.get(endpoint);
  }

  /**
   * Obtener partido por ID
   */
  async getPartido(id) {
    return this.get(`partidos/${id}`);
  }

  /**
   * Crear partido (Admin)
   */
  async createPartido(partidoData) {
    return this.post('partidos', partidoData);
  }

  /**
   * Actualizar partido (Admin)
   */
  async updatePartido(id, partidoData) {
    return this.put(`partidos/${id}`, partidoData);
  }

  /**
   * Actualizar marcador (Admin)
   */
  async updateMarcador(id, marcadorLocal, marcadorVisitante) {
    return this.put(`partidos/${id}/marcador`, {
      marcador_local: marcadorLocal,
      marcador_visitante: marcadorVisitante,
    });
  }

  /**
   * Eliminar partido (Admin)
   */
  async deletePartido(id) {
    return this.delete(`partidos/${id}`);
  }

  // ==========================================
  // MÉTODOS DE FOOTBALL API (RapidAPI)
  // ==========================================

  /**
   * Buscar fixtures de RapidAPI
   */
  async getFixtures(leagueAlias, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `football/fixtures/${leagueAlias}?${queryParams}`
      : `football/fixtures/${leagueAlias}`;
    return this.get(endpoint);
  }

  /**
   * Obtener ligas disponibles
   */
  async getLeagues() {
    return this.get('football/leagues');
  }

  /**
   * Importar partidos desde RapidAPI a una quiniela
   */
  async importarPartidos(quinielaId, fixtureIds) {
    return this.post(`football/import/${quinielaId}`, { fixtureIds });
  }

  /**
   * Sincronizar resultados desde RapidAPI
   */
  async syncResultados(partidoIds = []) {
    return this.post('football/sync-results', { partidoIds });
  }

  // ==========================================
  // MÉTODOS DE CACHÉ (Admin)
  // ==========================================

  /**
   * Obtener estadísticas de caché
   */
  async getCacheStats() {
    return this.get('cache/stats');
  }

  /**
   * Limpiar caché
   */
  async clearCache() {
    return this.post('cache/clear');
  }

  /**
   * Eliminar entrada de caché
   */
  async deleteCacheKey(key) {
    return this.delete(`cache/${key}`);
  }
}

// Crear instancia global
const api = new APIClient();

// Exportar para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient, api };
}
