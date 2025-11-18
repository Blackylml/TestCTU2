/**
 * partidosManager.js
 * Módulo de gestión dinámica de partidos para QuinielaPro
 * Maneja la creación, edición y eliminación de partidos en formularios
 */

const PartidosManager = {
    partidos: [],
    nextId: 1,
    container: null,
    callbacks: {
        onChange: null,
        onAdd: null,
        onRemove: null
    },

    /**
     * Inicializa el gestor de partidos
     * @param {string|HTMLElement} containerId - ID o elemento del contenedor
     * @param {object} options - Opciones de configuración
     */
    init(containerId, options = {}) {
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!this.container) {
            console.error('Contenedor no encontrado');
            return;
        }

        this.callbacks = {
            onChange: options.onChange || null,
            onAdd: options.onAdd || null,
            onRemove: options.onRemove || null,
            onValidate: options.onValidate || null
        };

        this.partidos = [];
        this.nextId = 1;
    },

    /**
     * Agrega un nuevo partido
     * @param {object} data - Datos del partido (opcional)
     * @returns {object} Partido creado
     */
    agregarPartido(data = {}) {
        const partido = {
            id: data.id || `partido_${this.nextId++}`,
            equipoLocal: data.equipoLocal || '',
            equipoVisitante: data.equipoVisitante || '',
            fecha: data.fecha || '',
            hora: data.hora || '',
            estado: data.estado || 'pendiente',
            golesLocal: data.golesLocal !== undefined ? data.golesLocal : null,
            golesVisitante: data.golesVisitante !== undefined ? data.golesVisitante : null
        };

        this.partidos.push(partido);
        this.render();

        if (this.callbacks.onAdd) {
            this.callbacks.onAdd(partido);
        }

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.partidos);
        }

        return partido;
    },

    /**
     * Elimina un partido
     * @param {string} partidoId - ID del partido a eliminar
     * @returns {boolean} true si se eliminó
     */
    eliminarPartido(partidoId) {
        const index = this.partidos.findIndex(p => p.id === partidoId);

        if (index === -1) {
            return false;
        }

        const partidoEliminado = this.partidos[index];
        this.partidos.splice(index, 1);
        this.render();

        if (this.callbacks.onRemove) {
            this.callbacks.onRemove(partidoEliminado);
        }

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.partidos);
        }

        return true;
    },

    /**
     * Actualiza datos de un partido
     * @param {string} partidoId - ID del partido
     * @param {object} data - Datos a actualizar
     * @returns {object|null} Partido actualizado o null
     */
    actualizarPartido(partidoId, data) {
        const partido = this.partidos.find(p => p.id === partidoId);

        if (!partido) {
            return null;
        }

        Object.assign(partido, data);

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.partidos);
        }

        return partido;
    },

    /**
     * Obtiene un partido por ID
     * @param {string} partidoId - ID del partido
     * @returns {object|null} Partido o null
     */
    obtenerPartido(partidoId) {
        return this.partidos.find(p => p.id === partidoId) || null;
    },

    /**
     * Obtiene todos los partidos
     * @returns {array} Array de partidos
     */
    obtenerTodos() {
        return [...this.partidos];
    },

    /**
     * Limpia todos los partidos
     * @returns {boolean} true si se limpió
     */
    limpiar() {
        this.partidos = [];
        this.nextId = 1;
        this.render();

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.partidos);
        }

        return true;
    },

    /**
     * Carga partidos desde un array
     * @param {array} partidos - Array de partidos
     * @returns {boolean} true si se cargó
     */
    cargar(partidos) {
        this.partidos = partidos.map((p, index) => ({
            ...p,
            id: p.id || `partido_${index + 1}`
        }));

        this.nextId = this.partidos.length + 1;
        this.render();

        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.partidos);
        }

        return true;
    },

    /**
     * Valida todos los partidos
     * @returns {object} {valid: boolean, errors: array}
     */
    validar() {
        const errors = [];

        if (this.partidos.length === 0) {
            errors.push({
                tipo: 'general',
                mensaje: 'Debe agregar al menos un partido'
            });
        } else if (this.partidos.length < 3) {
            errors.push({
                tipo: 'general',
                mensaje: 'Se requieren al menos 3 partidos'
            });
        }

        this.partidos.forEach((partido, index) => {
            const partidoErrors = this.validarPartido(partido);

            if (!partidoErrors.valid) {
                errors.push({
                    tipo: 'partido',
                    partidoId: partido.id,
                    index: index,
                    errores: partidoErrors.errors
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Valida un partido individual
     * @param {object} partido - Partido a validar
     * @returns {object} {valid: boolean, errors: array}
     */
    validarPartido(partido) {
        const errors = [];

        if (!partido.equipoLocal || partido.equipoLocal.trim() === '') {
            errors.push('El equipo local es requerido');
        }

        if (!partido.equipoVisitante || partido.equipoVisitante.trim() === '') {
            errors.push('El equipo visitante es requerido');
        }

        if (partido.equipoLocal === partido.equipoVisitante) {
            errors.push('Los equipos deben ser diferentes');
        }

        if (!partido.fecha) {
            errors.push('La fecha es requerida');
        }

        // Si hay un callback de validación personalizado, usarlo
        if (this.callbacks.onValidate) {
            const customErrors = this.callbacks.onValidate(partido);
            if (customErrors && customErrors.length > 0) {
                errors.push(...customErrors);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Renderiza la lista de partidos en el contenedor
     */
    render() {
        if (!this.container) {
            return;
        }

        // Limpiar contenedor
        this.container.innerHTML = '';

        if (this.partidos.length === 0) {
            this.container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-futbol text-4xl mb-2"></i>
                    <p>No hay partidos agregados</p>
                    <p class="text-sm">Haz clic en "Agregar Partido" para comenzar</p>
                </div>
            `;
            return;
        }

        // Renderizar cada partido
        this.partidos.forEach((partido, index) => {
            const partidoElement = this.crearElementoPartido(partido, index);
            this.container.appendChild(partidoElement);
        });
    },

    /**
     * Crea el elemento HTML para un partido
     * @param {object} partido - Datos del partido
     * @param {number} index - Índice del partido
     * @returns {HTMLElement} Elemento del partido
     */
    crearElementoPartido(partido, index) {
        const div = document.createElement('div');
        div.className = 'bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700';
        div.dataset.partidoId = partido.id;

        const estadoBadge = this.crearBadgeEstado(partido.estado);

        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">
                    Partido ${index + 1}
                </h4>
                <div class="flex gap-2">
                    ${estadoBadge}
                    <button type="button" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            onclick="PartidosManager.eliminarPartido('${partido.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Equipo Local -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Equipo Local
                    </label>
                    <input type="text"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           value="${partido.equipoLocal}"
                           onchange="PartidosManager.actualizarPartido('${partido.id}', {equipoLocal: this.value})"
                           placeholder="Nombre del equipo local">
                </div>

                <!-- Equipo Visitante -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Equipo Visitante
                    </label>
                    <input type="text"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           value="${partido.equipoVisitante}"
                           onchange="PartidosManager.actualizarPartido('${partido.id}', {equipoVisitante: this.value})"
                           placeholder="Nombre del equipo visitante">
                </div>

                <!-- Fecha -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha
                    </label>
                    <input type="date"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           value="${partido.fecha}"
                           onchange="PartidosManager.actualizarPartido('${partido.id}', {fecha: this.value})">
                </div>

                <!-- Hora -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora
                    </label>
                    <input type="time"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           value="${partido.hora || ''}"
                           onchange="PartidosManager.actualizarPartido('${partido.id}', {hora: this.value})">
                </div>
            </div>
        `;

        return div;
    },

    /**
     * Crea un badge de estado para un partido
     * @param {string} estado - Estado del partido
     * @returns {string} HTML del badge
     */
    crearBadgeEstado(estado) {
        const estados = {
            pendiente: { clase: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', texto: 'Pendiente' },
            en_vivo: { clase: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', texto: 'En Vivo' },
            completado: { clase: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', texto: 'Completado' },
            proximo: { clase: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', texto: 'Próximo' }
        };

        const config = estados[estado] || estados.pendiente;

        return `<span class="px-2 py-1 text-xs rounded-full ${config.clase}">${config.texto}</span>`;
    },

    /**
     * Exporta partidos a formato JSON
     * @returns {string} JSON de partidos
     */
    exportar() {
        return JSON.stringify(this.partidos, null, 2);
    },

    /**
     * Importa partidos desde JSON
     * @param {string} json - JSON de partidos
     * @returns {boolean} true si se importó correctamente
     */
    importar(json) {
        try {
            const partidos = JSON.parse(json);
            this.cargar(partidos);
            return true;
        } catch (error) {
            console.error('Error al importar partidos:', error);
            return false;
        }
    },

    /**
     * Cuenta partidos por estado
     * @returns {object} Conteo de partidos por estado
     */
    contarPorEstado() {
        const conteo = {
            pendiente: 0,
            en_vivo: 0,
            completado: 0,
            proximo: 0
        };

        this.partidos.forEach(partido => {
            const estado = partido.estado || 'pendiente';
            conteo[estado] = (conteo[estado] || 0) + 1;
        });

        return conteo;
    },

    /**
     * Obtiene partidos filtrados por estado
     * @param {string} estado - Estado a filtrar
     * @returns {array} Partidos filtrados
     */
    filtrarPorEstado(estado) {
        if (!estado || estado === 'todos') {
            return this.partidos;
        }

        return this.partidos.filter(p => p.estado === estado);
    },

    /**
     * Ordena partidos por fecha
     * @param {string} direccion - 'asc' o 'desc'
     * @returns {array} Partidos ordenados
     */
    ordenarPorFecha(direccion = 'asc') {
        const partidosOrdenados = [...this.partidos].sort((a, b) => {
            const fechaA = new Date(`${a.fecha} ${a.hora || '00:00'}`);
            const fechaB = new Date(`${b.fecha} ${b.hora || '00:00'}`);

            return direccion === 'asc'
                ? fechaA - fechaB
                : fechaB - fechaA;
        });

        return partidosOrdenados;
    },

    /**
     * Calcula el total de partidos
     * @returns {number} Total de partidos
     */
    total() {
        return this.partidos.length;
    },

    /**
     * Verifica si hay cambios sin guardar
     * @param {array} partidosOriginales - Partidos originales para comparar
     * @returns {boolean} true si hay cambios
     */
    hayCambios(partidosOriginales) {
        if (this.partidos.length !== partidosOriginales.length) {
            return true;
        }

        return JSON.stringify(this.partidos) !== JSON.stringify(partidosOriginales);
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PartidosManager;
}
