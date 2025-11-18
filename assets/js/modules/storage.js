/**
 * storage.js
 * Módulo de gestión de localStorage para QuinielaPro
 * Maneja almacenamiento persistente en el navegador
 */

const Storage = {
    // Prefijo para todas las claves
    prefix: 'quinielapro_',

    /**
     * Guarda un valor en localStorage
     * @param {string} key - Clave
     * @param {*} value - Valor a guardar (se convierte a JSON)
     * @returns {boolean} true si se guardó exitosamente
     */
    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            return false;
        }
    },

    /**
     * Obtiene un valor de localStorage
     * @param {string} key - Clave
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} Valor recuperado o defaultValue
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const item = localStorage.getItem(fullKey);

            if (item === null) {
                return defaultValue;
            }

            return JSON.parse(item);
        } catch (error) {
            console.error('Error al leer de localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Elimina un valor de localStorage
     * @param {string} key - Clave a eliminar
     * @returns {boolean} true si se eliminó exitosamente
     */
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
            return false;
        }
    },

    /**
     * Limpia todos los datos de QuinielaPro de localStorage
     * @returns {boolean} true si se limpió exitosamente
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
            return false;
        }
    },

    /**
     * Verifica si existe una clave
     * @param {string} key - Clave a verificar
     * @returns {boolean} true si existe
     */
    exists(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    },

    /**
     * Obtiene todas las claves almacenadas
     * @returns {array} Array de claves (sin prefijo)
     */
    keys() {
        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.replace(this.prefix, ''));
    },

    // ==================== FUNCIONES ESPECÍFICAS ====================

    /**
     * Guarda un borrador de quiniela
     * @param {object} borrador - Datos del borrador
     * @returns {string} ID del borrador
     */
    guardarBorradorQuiniela(borrador) {
        const borradores = this.get('borradores_quinielas', []);
        const id = borrador.id || `borrador_${Date.now()}`;

        const borradorConMetadata = {
            ...borrador,
            id: id,
            fechaCreacion: borrador.fechaCreacion || new Date().toISOString(),
            fechaActualizacion: new Date().toISOString()
        };

        // Verificar si ya existe y actualizar, o agregar nuevo
        const index = borradores.findIndex(b => b.id === id);
        if (index !== -1) {
            borradores[index] = borradorConMetadata;
        } else {
            borradores.push(borradorConMetadata);
        }

        this.set('borradores_quinielas', borradores);
        return id;
    },

    /**
     * Obtiene todos los borradores de quinielas
     * @returns {array} Array de borradores
     */
    obtenerBorradoresQuinielas() {
        return this.get('borradores_quinielas', []);
    },

    /**
     * Obtiene un borrador específico
     * @param {string} id - ID del borrador
     * @returns {object|null} Borrador o null si no existe
     */
    obtenerBorradorQuiniela(id) {
        const borradores = this.obtenerBorradoresQuinielas();
        return borradores.find(b => b.id === id) || null;
    },

    /**
     * Elimina un borrador de quiniela
     * @param {string} id - ID del borrador
     * @returns {boolean} true si se eliminó
     */
    eliminarBorradorQuiniela(id) {
        const borradores = this.obtenerBorradoresQuinielas();
        const filtrados = borradores.filter(b => b.id !== id);
        return this.set('borradores_quinielas', filtrados);
    },

    /**
     * Guarda preferencias de filtros del usuario
     * @param {object} filtros - Preferencias de filtros
     * @returns {boolean} true si se guardó
     */
    guardarPreferenciasFiltros(filtros) {
        return this.set('preferencias_filtros', filtros);
    },

    /**
     * Obtiene preferencias de filtros guardadas
     * @returns {object} Preferencias de filtros
     */
    obtenerPreferenciasFiltros() {
        return this.get('preferencias_filtros', {});
    },

    /**
     * Guarda historial de búsquedas
     * @param {string} busqueda - Término de búsqueda
     * @param {number} maxHistorial - Máximo de elementos en historial
     * @returns {boolean} true si se guardó
     */
    agregarBusquedaHistorial(busqueda, maxHistorial = 10) {
        if (!busqueda || busqueda.trim() === '') {
            return false;
        }

        let historial = this.get('historial_busquedas', []);

        // Eliminar búsqueda si ya existe (para moverla al principio)
        historial = historial.filter(b => b !== busqueda);

        // Agregar al principio
        historial.unshift(busqueda);

        // Limitar tamaño del historial
        if (historial.length > maxHistorial) {
            historial = historial.slice(0, maxHistorial);
        }

        return this.set('historial_busquedas', historial);
    },

    /**
     * Obtiene historial de búsquedas
     * @returns {array} Array de búsquedas
     */
    obtenerHistorialBusquedas() {
        return this.get('historial_busquedas', []);
    },

    /**
     * Limpia historial de búsquedas
     * @returns {boolean} true si se limpió
     */
    limpiarHistorialBusquedas() {
        return this.set('historial_busquedas', []);
    },

    /**
     * Guarda quinielas favoritas del usuario
     * @param {string} quinielaId - ID de la quiniela
     * @returns {boolean} true si se guardó
     */
    agregarFavorito(quinielaId) {
        const favoritos = this.get('favoritos', []);

        if (!favoritos.includes(quinielaId)) {
            favoritos.push(quinielaId);
            return this.set('favoritos', favoritos);
        }

        return true;
    },

    /**
     * Elimina una quiniela de favoritos
     * @param {string} quinielaId - ID de la quiniela
     * @returns {boolean} true si se eliminó
     */
    eliminarFavorito(quinielaId) {
        const favoritos = this.get('favoritos', []);
        const filtrados = favoritos.filter(id => id !== quinielaId);
        return this.set('favoritos', filtrados);
    },

    /**
     * Verifica si una quiniela es favorita
     * @param {string} quinielaId - ID de la quiniela
     * @returns {boolean} true si es favorita
     */
    esFavorito(quinielaId) {
        const favoritos = this.get('favoritos', []);
        return favoritos.includes(quinielaId);
    },

    /**
     * Obtiene todas las quinielas favoritas
     * @returns {array} Array de IDs de quinielas favoritas
     */
    obtenerFavoritos() {
        return this.get('favoritos', []);
    },

    /**
     * Guarda caché de quinielas para uso offline
     * @param {array} quinielas - Array de quinielas
     * @param {number} ttl - Tiempo de vida en milisegundos
     * @returns {boolean} true si se guardó
     */
    guardarCacheQuinielas(quinielas, ttl = 3600000) { // 1 hora por defecto
        const cache = {
            data: quinielas,
            timestamp: Date.now(),
            ttl: ttl
        };
        return this.set('cache_quinielas', cache);
    },

    /**
     * Obtiene caché de quinielas si aún es válido
     * @returns {array|null} Array de quinielas o null si expiró
     */
    obtenerCacheQuinielas() {
        const cache = this.get('cache_quinielas');

        if (!cache) {
            return null;
        }

        const ahora = Date.now();
        const expiracion = cache.timestamp + cache.ttl;

        if (ahora > expiracion) {
            this.remove('cache_quinielas');
            return null;
        }

        return cache.data;
    },

    /**
     * Invalida el caché de quinielas
     * @returns {boolean} true si se invalidó
     */
    invalidarCacheQuinielas() {
        return this.remove('cache_quinielas');
    },

    /**
     * Guarda estado del formulario (auto-save)
     * @param {string} formId - ID del formulario
     * @param {object} data - Datos del formulario
     * @returns {boolean} true si se guardó
     */
    guardarEstadoFormulario(formId, data) {
        const key = `form_state_${formId}`;
        const estado = {
            data: data,
            timestamp: Date.now()
        };
        return this.set(key, estado);
    },

    /**
     * Recupera estado del formulario
     * @param {string} formId - ID del formulario
     * @returns {object|null} Datos del formulario o null
     */
    recuperarEstadoFormulario(formId) {
        const key = `form_state_${formId}`;
        const estado = this.get(key);

        if (!estado) {
            return null;
        }

        return estado.data;
    },

    /**
     * Elimina estado guardado del formulario
     * @param {string} formId - ID del formulario
     * @returns {boolean} true si se eliminó
     */
    limpiarEstadoFormulario(formId) {
        const key = `form_state_${formId}`;
        return this.remove(key);
    },

    /**
     * Guarda configuraciones del usuario
     * @param {object} config - Configuraciones
     * @returns {boolean} true si se guardó
     */
    guardarConfiguracion(config) {
        const configActual = this.get('configuracion', {});
        const nuevaConfig = { ...configActual, ...config };
        return this.set('configuracion', nuevaConfig);
    },

    /**
     * Obtiene configuraciones del usuario
     * @returns {object} Configuraciones
     */
    obtenerConfiguracion() {
        return this.get('configuracion', {
            notificaciones: true,
            autoGuardado: true,
            recordarFiltros: true
        });
    },

    /**
     * Obtiene estadísticas de uso del storage
     * @returns {object} Estadísticas
     */
    obtenerEstadisticas() {
        const keys = this.keys();
        let totalSize = 0;

        keys.forEach(key => {
            const value = this.get(key);
            const size = JSON.stringify(value).length;
            totalSize += size;
        });

        return {
            totalKeys: keys.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            keys: keys
        };
    },

    /**
     * Exporta todos los datos a un archivo JSON
     * @returns {object} Datos exportados
     */
    exportarDatos() {
        const datos = {};
        const keys = this.keys();

        keys.forEach(key => {
            datos[key] = this.get(key);
        });

        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            datos: datos
        };
    },

    /**
     * Importa datos desde un objeto
     * @param {object} exportData - Datos exportados previamente
     * @returns {boolean} true si se importó correctamente
     */
    importarDatos(exportData) {
        try {
            if (!exportData || !exportData.datos) {
                return false;
            }

            Object.entries(exportData.datos).forEach(([key, value]) => {
                this.set(key, value);
            });

            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
