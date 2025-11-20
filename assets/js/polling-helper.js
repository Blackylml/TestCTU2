/**
 * Polling Helper - Cliente
 * Helper para implementar polling inteligente en el frontend
 *
 * COPIAR ESTE ARCHIVO A TU FRONTEND (assets/js/)
 */

class PollingService {
  constructor(url, options = {}) {
    this.url = url;
    this.interval = options.interval || 10000; // Default 10 segundos
    this.adaptiveInterval = options.adaptive || false;
    this.onlyWhenVisible = options.onlyWhenVisible !== false; // Default true
    this.maxInterval = options.maxInterval || 60000; // Max 1 minuto
    this.minInterval = options.minInterval || 5000; // Min 5 segundos

    this.timerId = null;
    this.callbacks = [];
    this.errorCallbacks = [];
    this.isRunning = false;
    this.lastData = null;
    this.etag = null;
  }

  /**
   * Iniciar polling
   */
  start(callback, errorCallback) {
    if (this.isRunning) {
      console.warn('Polling ya está corriendo');
      return this;
    }

    this.callbacks.push(callback);
    if (errorCallback) {
      this.errorCallbacks.push(errorCallback);
    }

    this.isRunning = true;

    // Primera llamada inmediata
    this.fetch();

    // Iniciar polling periódico
    this.scheduleNext();

    // Si está configurado para solo cuando visible
    if (this.onlyWhenVisible) {
      this.setupVisibilityListener();
    }

    return this;
  }

  /**
   * Detener polling
   */
  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Hacer fetch de datos
   */
  async fetch() {
    if (!this.isRunning) return;

    // No hacer fetch si la pestaña está oculta
    if (this.onlyWhenVisible && document.hidden) {
      return;
    }

    try {
      const headers = {};

      // Usar ETag para detectar cambios
      if (this.etag) {
        headers['If-None-Match'] = this.etag;
      }

      const response = await fetch(this.url, { headers });

      // 304 Not Modified - sin cambios
      if (response.status === 304) {
        console.log('📦 Sin cambios (304 Not Modified)');
        this.adjustInterval(false);
        return;
      }

      // Guardar ETag
      const newEtag = response.headers.get('ETag');
      if (newEtag) {
        this.etag = newEtag;
      }

      const data = await response.json();

      // Detectar si hay cambios
      const hasChanges = this.detectChanges(data);

      // Ajustar intervalo si es adaptativo
      if (this.adaptiveInterval) {
        this.adjustInterval(hasChanges);
      }

      // Guardar últimos datos
      this.lastData = data;

      // Notificar callbacks solo si hay cambios
      if (hasChanges || !this.etag) {
        this.notifyCallbacks(data);
      }
    } catch (error) {
      console.error('❌ Error en polling:', error);
      this.notifyErrorCallbacks(error);

      // En caso de error, aumentar intervalo
      if (this.adaptiveInterval) {
        this.interval = Math.min(this.maxInterval, this.interval * 1.5);
      }
    }
  }

  /**
   * Detectar cambios en los datos
   */
  detectChanges(newData) {
    if (!this.lastData) return true;

    // Comparación simple (puedes personalizar)
    return JSON.stringify(newData) !== JSON.stringify(this.lastData);
  }

  /**
   * Ajustar intervalo dinámicamente
   */
  adjustInterval(hasChanges) {
    if (hasChanges) {
      // Hay actividad, aumentar frecuencia (reducir intervalo)
      this.interval = Math.max(this.minInterval, this.interval - 2000);
      console.log(`⚡ Aumentando frecuencia: ${this.interval / 1000}s`);
    } else {
      // Sin cambios, reducir frecuencia (aumentar intervalo)
      this.interval = Math.min(this.maxInterval, this.interval + 3000);
      console.log(`🐢 Reduciendo frecuencia: ${this.interval / 1000}s`);
    }
  }

  /**
   * Programar siguiente fetch
   */
  scheduleNext() {
    if (!this.isRunning) return;

    this.timerId = setTimeout(() => {
      this.fetch();
      this.scheduleNext();
    }, this.interval);
  }

  /**
   * Configurar listener de visibilidad
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isRunning) {
        // Al volver a la pestaña, actualizar inmediatamente
        console.log('👁️ Pestaña visible, actualizando...');
        this.fetch();
      }
    });
  }

  /**
   * Notificar callbacks
   */
  notifyCallbacks(data) {
    this.callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error('Error en callback:', error);
      }
    });
  }

  /**
   * Notificar errores
   */
  notifyErrorCallbacks(error) {
    this.errorCallbacks.forEach(cb => {
      try {
        cb(error);
      } catch (err) {
        console.error('Error en error callback:', err);
      }
    });
  }

  /**
   * Cambiar URL dinámicamente
   */
  setUrl(newUrl) {
    this.url = newUrl;
    this.etag = null;
    this.lastData = null;

    if (this.isRunning) {
      this.fetch();
    }
  }

  /**
   * Cambiar intervalo dinámicamente
   */
  setInterval(newInterval) {
    this.interval = newInterval;
  }
}

/**
 * Helper específico para tabla de posiciones
 */
class TablaPosicionesPoller extends PollingService {
  constructor(quinielaId, options = {}) {
    const url = `${options.baseUrl || 'http://localhost:3000'}/api/v1/quinielas/${quinielaId}/tabla-posiciones`;

    // Configuración optimizada para tablas
    super(url, {
      interval: 15000, // 15 segundos
      adaptive: true,
      onlyWhenVisible: true,
      minInterval: 5000, // Mínimo 5s cuando hay actividad
      maxInterval: 60000, // Máximo 1 minuto cuando está quieto
      ...options,
    });
  }

  /**
   * Detectar cambios específicos de tabla
   */
  detectChanges(newData) {
    if (!this.lastData) return true;

    const oldTable = this.lastData.data || this.lastData;
    const newTable = newData.data || newData;

    // Comparar solo aciertos y posiciones
    if (!Array.isArray(oldTable) || !Array.isArray(newTable)) return true;
    if (oldTable.length !== newTable.length) return true;

    for (let i = 0; i < oldTable.length; i++) {
      if (oldTable[i].aciertos !== newTable[i].aciertos ||
          oldTable[i].posicion !== newTable[i].posicion) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Helper para partidos en vivo
 */
class PartidosEnVivoPoller extends PollingService {
  constructor(quinielaId, options = {}) {
    const url = `${options.baseUrl || 'http://localhost:3000'}/api/v1/quinielas/${quinielaId}`;

    super(url, {
      interval: 10000, // 10 segundos para en vivo
      adaptive: true,
      onlyWhenVisible: true,
      minInterval: 5000,
      maxInterval: 30000, // Máximo 30s para partidos en vivo
      ...options,
    });

    this.onGoalCallbacks = [];
  }

  /**
   * Callback especial cuando hay gol
   */
  onGoal(callback) {
    this.onGoalCallbacks.push(callback);
    return this;
  }

  /**
   * Detectar cambios en marcadores
   */
  detectChanges(newData) {
    if (!this.lastData) return true;

    const oldPartidos = this.lastData.data?.partidos || this.lastData.partidos || [];
    const newPartidos = newData.data?.partidos || newData.partidos || [];

    let hasChanges = false;

    newPartidos.forEach((newPartido, index) => {
      const oldPartido = oldPartidos[index];

      if (oldPartido &&
          (oldPartido.marcador_local !== newPartido.marcador_local ||
           oldPartido.marcador_visitante !== newPartido.marcador_visitante)) {

        hasChanges = true;

        // ¡Hay gol!
        this.notifyGoal({
          partido: newPartido,
          marcadorAnterior: {
            local: oldPartido.marcador_local,
            visitante: oldPartido.marcador_visitante,
          },
          marcadorNuevo: {
            local: newPartido.marcador_local,
            visitante: newPartido.marcador_visitante,
          },
        });
      }
    });

    return hasChanges;
  }

  /**
   * Notificar goles
   */
  notifyGoal(goalData) {
    this.onGoalCallbacks.forEach(cb => {
      try {
        cb(goalData);
      } catch (error) {
        console.error('Error en goal callback:', error);
      }
    });
  }
}

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PollingService,
    TablaPosicionesPoller,
    PartidosEnVivoPoller,
  };
}
