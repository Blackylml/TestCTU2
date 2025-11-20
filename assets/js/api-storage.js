/**
 * API Storage - QuinielaPro Frontend
 * Módulo híbrido que usa API como fuente primaria y localStorage como caché
 * Mantiene compatibilidad con funciones offline
 */

const APIStorage = {
  // Referencia al API client
  api: null,

  // Prefijo para localStorage
  prefix: 'quinielaPro_',

  // TTL por defecto: 5 minutos
  defaultTTL: 5 * 60 * 1000,

  /**
   * Inicializar con instancia de API
   */
  init(apiClient) {
    this.api = apiClient;
  },

  /**
   * Verificar si hay conexión a internet
   */
  isOnline() {
    return navigator.onLine;
  },

  // ==================== FUNCIONES LOCALES BÁSICAS ====================

  /**
   * Guarda un valor en localStorage
   */
  setLocal(key, value, ttl = null) {
    try {
      const fullKey = this.prefix + key;
      const data = {
        value: value,
        timestamp: Date.now(),
        ttl: ttl,
      };
      localStorage.setItem(fullKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      return false;
    }
  },

  /**
   * Obtiene un valor de localStorage
   */
  getLocal(key, ignoreExpiration = false) {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);

      if (item === null) {
        return null;
      }

      const data = JSON.parse(item);

      // Verificar expiración
      if (!ignoreExpiration && data.ttl) {
        const now = Date.now();
        const expiration = data.timestamp + data.ttl;

        if (now > expiration) {
          this.removeLocal(key);
          return null;
        }
      }

      return data.value;
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  },

  /**
   * Elimina un valor de localStorage
   */
  removeLocal(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
      return false;
    }
  },

  // ==================== QUINIELAS (CON API) ====================

  /**
   * Obtener todas las quinielas (API + Cache)
   */
  async getQuinielas(forceRefresh = false) {
    const cacheKey = 'quinielas_list';

    // Si no hay conexión o no hay API, usar caché
    if (!this.isOnline() || !this.api) {
      console.log('📦 Usando caché offline para quinielas');
      return this.getLocal(cacheKey) || [];
    }

    // Si hay caché válido y no se fuerza refresh, usar caché
    if (!forceRefresh) {
      const cached = this.getLocal(cacheKey);
      if (cached) {
        console.log('✅ Usando caché de quinielas');

        // Refrescar en background
        this.refreshQuinielasInBackground();

        return cached;
      }
    }

    // Obtener de API
    try {
      console.log('🌐 Obteniendo quinielas de API...');
      const response = await this.api.getQuinielas();

      if (response.success) {
        const quinielas = response.data;

        // Guardar en caché
        this.setLocal(cacheKey, quinielas, this.defaultTTL);

        return quinielas;
      }

      // Si falla API, intentar caché expirado
      return this.getLocal(cacheKey, true) || [];
    } catch (error) {
      console.error('Error obteniendo quinielas:', error);

      // Si falla, usar caché aunque esté expirado
      return this.getLocal(cacheKey, true) || [];
    }
  },

  /**
   * Refrescar quinielas en background (no bloquea UI)
   */
  async refreshQuinielasInBackground() {
    try {
      const response = await this.api.getQuinielas();
      if (response.success) {
        this.setLocal('quinielas_list', response.data, this.defaultTTL);
        console.log('🔄 Caché de quinielas actualizado en background');
      }
    } catch (error) {
      // Silencioso, no afecta UI
    }
  },

  /**
   * Obtener quiniela por ID (API + Cache)
   */
  async getQuiniela(id, forceRefresh = false) {
    const cacheKey = `quiniela_${id}`;

    if (!this.isOnline() || !this.api) {
      return this.getLocal(cacheKey);
    }

    if (!forceRefresh) {
      const cached = this.getLocal(cacheKey);
      if (cached) {
        // Refrescar en background
        this.refreshQuinielaInBackground(id);
        return cached;
      }
    }

    try {
      const response = await this.api.getQuiniela(id);

      if (response.success) {
        const quiniela = response.data;
        this.setLocal(cacheKey, quiniela, this.defaultTTL);
        return quiniela;
      }

      return this.getLocal(cacheKey, true);
    } catch (error) {
      console.error(`Error obteniendo quiniela ${id}:`, error);
      return this.getLocal(cacheKey, true);
    }
  },

  /**
   * Refrescar quiniela específica en background
   */
  async refreshQuinielaInBackground(id) {
    try {
      const response = await this.api.getQuiniela(id);
      if (response.success) {
        this.setLocal(`quiniela_${id}`, response.data, this.defaultTTL);
      }
    } catch (error) {
      // Silencioso
    }
  },

  /**
   * Obtener quinielas disponibles (API + Cache)
   */
  async getQuinielasDisponibles(forceRefresh = false) {
    const cacheKey = 'quinielas_disponibles';

    if (!this.isOnline() || !this.api) {
      return this.getLocal(cacheKey) || [];
    }

    if (!forceRefresh) {
      const cached = this.getLocal(cacheKey);
      if (cached) {
        // Refrescar en background
        this.refreshDisponiblesInBackground();
        return cached;
      }
    }

    try {
      const response = await this.api.getQuinielasDisponibles();

      if (response.success) {
        const quinielas = response.data;
        this.setLocal(cacheKey, quinielas, this.defaultTTL);
        return quinielas;
      }

      return this.getLocal(cacheKey, true) || [];
    } catch (error) {
      console.error('Error obteniendo quinielas disponibles:', error);
      return this.getLocal(cacheKey, true) || [];
    }
  },

  /**
   * Refrescar disponibles en background
   */
  async refreshDisponiblesInBackground() {
    try {
      const response = await this.api.getQuinielasDisponibles();
      if (response.success) {
        this.setLocal('quinielas_disponibles', response.data, this.defaultTTL);
      }
    } catch (error) {
      // Silencioso
    }
  },

  /**
   * Obtener mis participaciones (API + Cache)
   */
  async getMisParticipaciones(forceRefresh = false) {
    const cacheKey = 'mis_participaciones';

    if (!this.isOnline() || !this.api) {
      return this.getLocal(cacheKey) || [];
    }

    if (!forceRefresh) {
      const cached = this.getLocal(cacheKey);
      if (cached) {
        this.refreshParticipacionesInBackground();
        return cached;
      }
    }

    try {
      const response = await this.api.getMisParticipaciones();

      if (response.success) {
        const participaciones = response.data;
        this.setLocal(cacheKey, participaciones, this.defaultTTL);
        return participaciones;
      }

      return this.getLocal(cacheKey, true) || [];
    } catch (error) {
      console.error('Error obteniendo participaciones:', error);
      return this.getLocal(cacheKey, true) || [];
    }
  },

  /**
   * Refrescar participaciones en background
   */
  async refreshParticipacionesInBackground() {
    try {
      const response = await this.api.getMisParticipaciones();
      if (response.success) {
        this.setLocal('mis_participaciones', response.data, this.defaultTTL);
      }
    } catch (error) {
      // Silencioso
    }
  },

  /**
   * Obtener tabla de posiciones (API + Cache)
   */
  async getTablaPosiciones(quinielaId, forceRefresh = false) {
    const cacheKey = `tabla_${quinielaId}`;

    if (!this.isOnline() || !this.api) {
      return this.getLocal(cacheKey) || [];
    }

    if (!forceRefresh) {
      const cached = this.getLocal(cacheKey);
      if (cached) {
        this.refreshTablaInBackground(quinielaId);
        return cached;
      }
    }

    try {
      const response = await this.api.getTablaPosiciones(quinielaId);

      if (response.success) {
        const tabla = response.data;
        // Tabla de posiciones: TTL más corto (2 minutos)
        this.setLocal(cacheKey, tabla, 2 * 60 * 1000);
        return tabla;
      }

      return this.getLocal(cacheKey, true) || [];
    } catch (error) {
      console.error(`Error obteniendo tabla de ${quinielaId}:`, error);
      return this.getLocal(cacheKey, true) || [];
    }
  },

  /**
   * Refrescar tabla en background
   */
  async refreshTablaInBackground(quinielaId) {
    try {
      const response = await this.api.getTablaPosiciones(quinielaId);
      if (response.success) {
        this.setLocal(`tabla_${quinielaId}`, response.data, 2 * 60 * 1000);
      }
    } catch (error) {
      // Silencioso
    }
  },

  /**
   * Invalidar caché de quinielas
   */
  invalidateQuinielasCache() {
    this.removeLocal('quinielas_list');
    this.removeLocal('quinielas_disponibles');
    console.log('🗑️ Caché de quinielas invalidado');
  },

  /**
   * Invalidar caché de una quiniela específica
   */
  invalidateQuinielaCache(id) {
    this.removeLocal(`quiniela_${id}`);
    this.removeLocal(`tabla_${id}`);
    console.log(`🗑️ Caché de quiniela ${id} invalidado`);
  },

  // ==================== FUNCIONES LOCALES (SIN API) ====================
  // Estas funcionan exactamente como el Storage original

  /**
   * Guardar borrador de quiniela (solo local)
   */
  guardarBorradorQuiniela(borrador) {
    const borradores = this.getLocal('borradores_quinielas') || [];
    const id = borrador.id || `borrador_${Date.now()}`;

    const borradorConMetadata = {
      ...borrador,
      id: id,
      fechaCreacion: borrador.fechaCreacion || new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    const index = borradores.findIndex(b => b.id === id);
    if (index !== -1) {
      borradores[index] = borradorConMetadata;
    } else {
      borradores.push(borradorConMetadata);
    }

    this.setLocal('borradores_quinielas', borradores);
    return id;
  },

  /**
   * Obtener borradores de quinielas
   */
  obtenerBorradoresQuinielas() {
    return this.getLocal('borradores_quinielas') || [];
  },

  /**
   * Obtener borrador específico
   */
  obtenerBorradorQuiniela(id) {
    const borradores = this.obtenerBorradoresQuinielas();
    return borradores.find(b => b.id === id) || null;
  },

  /**
   * Eliminar borrador
   */
  eliminarBorradorQuiniela(id) {
    const borradores = this.obtenerBorradoresQuinielas();
    const filtrados = borradores.filter(b => b.id !== id);
    return this.setLocal('borradores_quinielas', filtrados);
  },

  /**
   * Guardar preferencias de filtros
   */
  guardarPreferenciasFiltros(filtros) {
    return this.setLocal('preferencias_filtros', filtros);
  },

  /**
   * Obtener preferencias de filtros
   */
  obtenerPreferenciasFiltros() {
    return this.getLocal('preferencias_filtros') || {};
  },

  /**
   * Agregar favorito
   */
  agregarFavorito(quinielaId) {
    const favoritos = this.getLocal('favoritos') || [];
    if (!favoritos.includes(quinielaId)) {
      favoritos.push(quinielaId);
      return this.setLocal('favoritos', favoritos);
    }
    return true;
  },

  /**
   * Eliminar favorito
   */
  eliminarFavorito(quinielaId) {
    const favoritos = this.getLocal('favoritos') || [];
    const filtrados = favoritos.filter(id => id !== quinielaId);
    return this.setLocal('favoritos', filtrados);
  },

  /**
   * Verificar si es favorito
   */
  esFavorito(quinielaId) {
    const favoritos = this.getLocal('favoritos') || [];
    return favoritos.includes(quinielaId);
  },

  /**
   * Obtener favoritos
   */
  obtenerFavoritos() {
    return this.getLocal('favoritos') || [];
  },

  /**
   * Guardar configuración del usuario
   */
  guardarConfiguracion(config) {
    const configActual = this.getLocal('configuracion') || {};
    const nuevaConfig = { ...configActual, ...config };
    return this.setLocal('configuracion', nuevaConfig);
  },

  /**
   * Obtener configuración
   */
  obtenerConfiguracion() {
    return this.getLocal('configuracion') || {
      notificaciones: true,
      autoGuardado: true,
      recordarFiltros: true,
    };
  },

  /**
   * Limpiar todo el caché (mantiene configuración y favoritos)
   */
  clearCache() {
    const keysToKeep = ['configuracion', 'favoritos', 'borradores_quinielas'];
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        if (!keysToKeep.includes(cleanKey)) {
          localStorage.removeItem(key);
        }
      }
    });

    console.log('🧹 Caché limpiado (configuración y favoritos preservados)');
  },

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas() {
    const keys = Object.keys(localStorage);
    const quinielaKeys = keys.filter(k => k.startsWith(this.prefix));
    let totalSize = 0;

    quinielaKeys.forEach(key => {
      const value = localStorage.getItem(key);
      totalSize += value ? value.length : 0;
    });

    return {
      totalKeys: quinielaKeys.length,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      online: this.isOnline(),
      apiConnected: !!this.api,
    };
  },
};

// Inicializar con API client global si existe
if (typeof api !== 'undefined') {
  APIStorage.init(api);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIStorage;
}
