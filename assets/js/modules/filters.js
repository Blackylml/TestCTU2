/**
 * filters.js
 * Módulo de filtros y búsqueda para QuinielaPro
 * Maneja filtrado, búsqueda, ordenamiento y paginación de datos
 */

const Filters = {
    /**
     * Filtra quinielas por múltiples criterios
     * @param {array} quinielas - Array de quinielas
     * @param {object} criterios - Criterios de filtrado
     * @returns {array} Quinielas filtradas
     */
    filtrarQuinielas(quinielas, criterios = {}) {
        let resultado = [...quinielas];

        // Filtrar por estado
        if (criterios.estado && criterios.estado !== 'todas') {
            resultado = resultado.filter(q => q.estado === criterios.estado);
        }

        // Filtrar por deporte
        if (criterios.deporte && criterios.deporte !== 'todos') {
            resultado = resultado.filter(q =>
                q.deporte.toLowerCase() === criterios.deporte.toLowerCase()
            );
        }

        // Filtrar por rango de precio
        if (criterios.precioMin !== undefined && criterios.precioMin !== null) {
            resultado = resultado.filter(q => q.precio >= criterios.precioMin);
        }
        if (criterios.precioMax !== undefined && criterios.precioMax !== null) {
            resultado = resultado.filter(q => q.precio <= criterios.precioMax);
        }

        // Filtrar por fecha de inicio
        if (criterios.fechaInicio) {
            const fechaInicio = new Date(criterios.fechaInicio);
            resultado = resultado.filter(q => {
                const fechaQuiniela = new Date(q.fechaInicio);
                return fechaQuiniela >= fechaInicio;
            });
        }

        // Filtrar por fecha de finalización
        if (criterios.fechaFin) {
            const fechaFin = new Date(criterios.fechaFin);
            resultado = resultado.filter(q => {
                const fechaQuiniela = new Date(q.fechaFinalizacion);
                return fechaQuiniela <= fechaFin;
            });
        }

        // Filtrar por número de participantes
        if (criterios.participantesMin !== undefined) {
            resultado = resultado.filter(q => q.participantes >= criterios.participantesMin);
        }

        // Filtrar por premios mínimos
        if (criterios.premioMin !== undefined) {
            resultado = resultado.filter(q => {
                const maxPremio = Math.max(...q.premios.map(p => p.monto));
                return maxPremio >= criterios.premioMin;
            });
        }

        return resultado;
    },

    /**
     * Búsqueda de texto en quinielas
     * @param {array} quinielas - Array de quinielas
     * @param {string} query - Texto a buscar
     * @param {array} campos - Campos donde buscar (nombre, descripcion, deporte)
     * @returns {array} Quinielas que coinciden con la búsqueda
     */
    buscarQuinielas(quinielas, query, campos = ['nombre', 'descripcion', 'deporte']) {
        if (!query || query.trim() === '') {
            return quinielas;
        }

        const queryLower = query.toLowerCase().trim();

        return quinielas.filter(quiniela => {
            return campos.some(campo => {
                const valor = quiniela[campo];
                if (typeof valor === 'string') {
                    return valor.toLowerCase().includes(queryLower);
                }
                return false;
            });
        });
    },

    /**
     * Ordena quinielas por un campo específico
     * @param {array} quinielas - Array de quinielas
     * @param {string} campo - Campo por el cual ordenar
     * @param {string} direccion - 'asc' o 'desc'
     * @returns {array} Quinielas ordenadas
     */
    ordenarQuinielas(quinielas, campo, direccion = 'asc') {
        const resultado = [...quinielas];

        resultado.sort((a, b) => {
            let valorA = a[campo];
            let valorB = b[campo];

            // Manejo especial para fechas
            if (campo.includes('fecha') || campo.includes('Fecha')) {
                valorA = new Date(valorA).getTime();
                valorB = new Date(valorB).getTime();
            }

            // Manejo especial para premios (ordenar por premio mayor)
            if (campo === 'premios') {
                valorA = Math.max(...a.premios.map(p => p.monto));
                valorB = Math.max(...b.premios.map(p => p.monto));
            }

            // Comparación
            if (valorA < valorB) {
                return direccion === 'asc' ? -1 : 1;
            }
            if (valorA > valorB) {
                return direccion === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return resultado;
    },

    /**
     * Pagina un array de datos
     * @param {array} datos - Array de datos a paginar
     * @param {number} pagina - Número de página (empezando en 1)
     * @param {number} porPagina - Elementos por página
     * @returns {object} {datos, totalPaginas, paginaActual, total}
     */
    paginar(datos, pagina = 1, porPagina = 10) {
        const total = datos.length;
        const totalPaginas = Math.ceil(total / porPagina);
        const paginaActual = Math.max(1, Math.min(pagina, totalPaginas));
        const inicio = (paginaActual - 1) * porPagina;
        const fin = inicio + porPagina;

        return {
            datos: datos.slice(inicio, fin),
            totalPaginas: totalPaginas,
            paginaActual: paginaActual,
            total: total,
            inicio: inicio + 1,
            fin: Math.min(fin, total)
        };
    },

    /**
     * Aplica filtros, búsqueda, ordenamiento y paginación en una sola función
     * @param {array} quinielas - Array de quinielas
     * @param {object} opciones - {filtros, busqueda, orden, pagina, porPagina}
     * @returns {object} Resultado completo con datos y metadatos
     */
    procesarQuinielas(quinielas, opciones = {}) {
        let resultado = [...quinielas];

        // 1. Aplicar filtros
        if (opciones.filtros) {
            resultado = this.filtrarQuinielas(resultado, opciones.filtros);
        }

        // 2. Aplicar búsqueda
        if (opciones.busqueda) {
            resultado = this.buscarQuinielas(
                resultado,
                opciones.busqueda,
                opciones.camposBusqueda
            );
        }

        // 3. Aplicar ordenamiento
        if (opciones.orden) {
            resultado = this.ordenarQuinielas(
                resultado,
                opciones.orden.campo || 'fechaInicio',
                opciones.orden.direccion || 'asc'
            );
        }

        // 4. Aplicar paginación
        const paginacion = this.paginar(
            resultado,
            opciones.pagina || 1,
            opciones.porPagina || 10
        );

        return {
            ...paginacion,
            filtrosAplicados: opciones.filtros || {},
            busquedaAplicada: opciones.busqueda || '',
            ordenAplicado: opciones.orden || {}
        };
    },

    /**
     * Filtra partidos por estado
     * @param {array} partidos - Array de partidos
     * @param {string} estado - Estado a filtrar (pendiente, en_vivo, completado, proximo)
     * @returns {array} Partidos filtrados
     */
    filtrarPartidosPorEstado(partidos, estado) {
        if (!estado || estado === 'todos') {
            return partidos;
        }

        return partidos.filter(partido => partido.estado === estado);
    },

    /**
     * Obtiene opciones únicas de un campo en un array de objetos
     * Útil para generar filtros dinámicos
     * @param {array} datos - Array de objetos
     * @param {string} campo - Campo del cual extraer valores únicos
     * @returns {array} Array de valores únicos
     */
    obtenerOpcionesUnicas(datos, campo) {
        const valores = datos.map(item => item[campo]);
        return [...new Set(valores)].sort();
    },

    /**
     * Cuenta elementos por categoría
     * @param {array} datos - Array de datos
     * @param {string} campo - Campo a contar
     * @returns {object} Objeto con conteo por categoría
     */
    contarPorCategoria(datos, campo) {
        const conteo = {};

        datos.forEach(item => {
            const valor = item[campo];
            conteo[valor] = (conteo[valor] || 0) + 1;
        });

        return conteo;
    },

    /**
     * Filtra participaciones de usuario por estado de quiniela
     * @param {array} participaciones - Participaciones del usuario
     * @param {string} estado - Estado de la quiniela
     * @returns {array} Participaciones filtradas
     */
    filtrarParticipaciones(participaciones, estado) {
        if (!estado || estado === 'todas') {
            return participaciones;
        }

        return participaciones.filter(p => p.quinielaEstado === estado);
    },

    /**
     * Busca usuarios por nombre o email
     * @param {array} usuarios - Array de usuarios
     * @param {string} query - Texto a buscar
     * @returns {array} Usuarios encontrados
     */
    buscarUsuarios(usuarios, query) {
        if (!query || query.trim() === '') {
            return usuarios;
        }

        const queryLower = query.toLowerCase().trim();

        return usuarios.filter(usuario => {
            return (
                usuario.nombre?.toLowerCase().includes(queryLower) ||
                usuario.email?.toLowerCase().includes(queryLower) ||
                usuario.username?.toLowerCase().includes(queryLower)
            );
        });
    },

    /**
     * Filtra usuarios por rol
     * @param {array} usuarios - Array de usuarios
     * @param {string} rol - Rol a filtrar (admin, usuario)
     * @returns {array} Usuarios filtrados
     */
    filtrarUsuariosPorRol(usuarios, rol) {
        if (!rol || rol === 'todos') {
            return usuarios;
        }

        return usuarios.filter(u => u.rol === rol);
    },

    /**
     * Filtra usuarios por estado (activo/inactivo)
     * @param {array} usuarios - Array de usuarios
     * @param {boolean} activo - true para activos, false para inactivos
     * @returns {array} Usuarios filtrados
     */
    filtrarUsuariosPorEstado(usuarios, activo) {
        if (activo === undefined || activo === null) {
            return usuarios;
        }

        return usuarios.filter(u => u.activo === activo);
    },

    /**
     * Filtra historial por rango de fechas
     * @param {array} historial - Array de registros históricos
     * @param {Date|string} fechaInicio - Fecha de inicio
     * @param {Date|string} fechaFin - Fecha de fin
     * @returns {array} Historial filtrado
     */
    filtrarPorRangoFechas(historial, fechaInicio, fechaFin) {
        let resultado = [...historial];

        if (fechaInicio) {
            const inicio = new Date(fechaInicio);
            resultado = resultado.filter(item => new Date(item.fecha) >= inicio);
        }

        if (fechaFin) {
            const fin = new Date(fechaFin);
            resultado = resultado.filter(item => new Date(item.fecha) <= fin);
        }

        return resultado;
    },

    /**
     * Ordena tabla de posiciones
     * @param {array} posiciones - Array de posiciones
     * @param {string} criterio - Criterio de ordenamiento (aciertos, puntos, etc.)
     * @returns {array} Posiciones ordenadas
     */
    ordenarTabla(posiciones, criterio = 'aciertos') {
        const resultado = [...posiciones];

        resultado.sort((a, b) => {
            // Primero por criterio principal
            if (b[criterio] !== a[criterio]) {
                return b[criterio] - a[criterio];
            }

            // Desempate por timestamp (más temprano gana)
            if (a.timestamp && b.timestamp) {
                return a.timestamp - b.timestamp;
            }

            return 0;
        });

        return resultado;
    },

    /**
     * Genera un resumen de filtros activos
     * @param {object} filtros - Objeto de filtros
     * @returns {array} Array de etiquetas de filtros activos
     */
    generarResumenFiltros(filtros) {
        const resumen = [];

        for (const [key, value] of Object.entries(filtros)) {
            if (value && value !== 'todos' && value !== 'todas') {
                resumen.push({
                    campo: key,
                    valor: value,
                    etiqueta: `${this.formatearNombreCampo(key)}: ${value}`
                });
            }
        }

        return resumen;
    },

    /**
     * Formatea el nombre de un campo para mostrar
     * @param {string} campo - Nombre del campo
     * @returns {string} Nombre formateado
     */
    formatearNombreCampo(campo) {
        const nombres = {
            estado: 'Estado',
            deporte: 'Deporte',
            precioMin: 'Precio mínimo',
            precioMax: 'Precio máximo',
            fechaInicio: 'Fecha inicio',
            fechaFin: 'Fecha fin',
            participantesMin: 'Participantes mínimos',
            premioMin: 'Premio mínimo'
        };

        return nombres[campo] || campo;
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Filters;
}
