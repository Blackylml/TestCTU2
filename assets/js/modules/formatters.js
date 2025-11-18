/**
 * formatters.js
 * Módulo de formateo de datos para QuinielaPro
 * Funciones para formatear fechas, monedas, números y otros datos
 */

const Formatters = {
    /**
     * Formatea una moneda (pesos mexicanos por defecto)
     * @param {number} valor - Valor numérico
     * @param {string} moneda - Código de moneda (MXN, USD, etc.)
     * @param {string} locale - Locale para formateo
     * @returns {string} Moneda formateada
     */
    moneda(valor, moneda = 'MXN', locale = 'es-MX') {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '$0.00';
        }

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    },

    /**
     * Formatea un número con separadores de miles
     * @param {number} valor - Valor numérico
     * @param {number} decimales - Número de decimales
     * @returns {string} Número formateado
     */
    numero(valor, decimales = 0) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '0';
        }

        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(valor);
    },

    /**
     * Formatea un porcentaje
     * @param {number} valor - Valor decimal (0.5 = 50%)
     * @param {number} decimales - Número de decimales
     * @returns {string} Porcentaje formateado
     */
    porcentaje(valor, decimales = 2) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '0%';
        }

        return `${this.numero(valor, decimales)}%`;
    },

    /**
     * Formatea una fecha en formato legible
     * @param {Date|string} fecha - Fecha a formatear
     * @param {object} opciones - Opciones de formato
     * @returns {string} Fecha formateada
     */
    fecha(fecha, opciones = {}) {
        if (!fecha) {
            return '';
        }

        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

        if (isNaN(date.getTime())) {
            return '';
        }

        const defaultOpciones = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const formatOpciones = { ...defaultOpciones, ...opciones };

        return new Intl.DateTimeFormat('es-MX', formatOpciones).format(date);
    },

    /**
     * Formatea una fecha en formato corto (DD/MM/YYYY)
     * @param {Date|string} fecha - Fecha a formatear
     * @returns {string} Fecha en formato corto
     */
    fechaCorta(fecha) {
        if (!fecha) {
            return '';
        }

        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

        if (isNaN(date.getTime())) {
            return '';
        }

        return this.fecha(date, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    /**
     * Formatea fecha y hora
     * @param {Date|string} fecha - Fecha a formatear
     * @returns {string} Fecha y hora formateada
     */
    fechaHora(fecha) {
        if (!fecha) {
            return '';
        }

        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

        if (isNaN(date.getTime())) {
            return '';
        }

        return this.fecha(date, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Formatea una hora (HH:MM)
     * @param {Date|string} fecha - Fecha u hora
     * @returns {string} Hora formateada
     */
    hora(fecha) {
        if (!fecha) {
            return '';
        }

        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

        if (isNaN(date.getTime())) {
            return '';
        }

        return new Intl.DateTimeFormat('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    /**
     * Formatea fecha relativa (hace 2 días, en 3 horas, etc.)
     * @param {Date|string} fecha - Fecha a formatear
     * @returns {string} Fecha relativa
     */
    fechaRelativa(fecha) {
        if (!fecha) {
            return '';
        }

        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

        if (isNaN(date.getTime())) {
            return '';
        }

        const ahora = new Date();
        const diferencia = date - ahora;
        const segundos = Math.floor(Math.abs(diferencia) / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        const meses = Math.floor(dias / 30);
        const años = Math.floor(dias / 365);

        const esPasado = diferencia < 0;
        const prefijo = esPasado ? 'hace' : 'en';
        const sufijo = esPasado ? '' : '';

        if (años > 0) {
            return `${prefijo} ${años} ${años === 1 ? 'año' : 'años'}`;
        }
        if (meses > 0) {
            return `${prefijo} ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        }
        if (dias > 0) {
            return `${prefijo} ${dias} ${dias === 1 ? 'día' : 'días'}`;
        }
        if (horas > 0) {
            return `${prefijo} ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
        }
        if (minutos > 0) {
            return `${prefijo} ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
        }
        return 'ahora mismo';
    },

    /**
     * Formatea un marcador (3-1, 0-0, etc.)
     * @param {number} golesLocal - Goles del equipo local
     * @param {number} golesVisitante - Goles del equipo visitante
     * @returns {string} Marcador formateado
     */
    marcador(golesLocal, golesVisitante) {
        if (golesLocal === null || golesLocal === undefined ||
            golesVisitante === null || golesVisitante === undefined) {
            return 'vs';
        }

        return `${golesLocal} - ${golesVisitante}`;
    },

    /**
     * Formatea un estado de quiniela
     * @param {string} estado - Estado de la quiniela
     * @returns {object} {texto, clase}
     */
    estadoQuiniela(estado) {
        const estados = {
            activa: {
                texto: 'Activa',
                clase: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            },
            cerrada: {
                texto: 'Cerrada',
                clase: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            },
            finalizada: {
                texto: 'Finalizada',
                clase: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            },
            cancelada: {
                texto: 'Cancelada',
                clase: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }
        };

        return estados[estado] || {
            texto: estado,
            clase: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        };
    },

    /**
     * Formatea un estado de partido
     * @param {string} estado - Estado del partido
     * @returns {object} {texto, clase, icono}
     */
    estadoPartido(estado) {
        const estados = {
            pendiente: {
                texto: 'Pendiente',
                clase: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                icono: 'fa-clock'
            },
            en_vivo: {
                texto: 'En Vivo',
                clase: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                icono: 'fa-circle'
            },
            completado: {
                texto: 'Completado',
                clase: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                icono: 'fa-check'
            },
            proximo: {
                texto: 'Próximo',
                clase: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                icono: 'fa-calendar'
            }
        };

        return estados[estado] || estados.pendiente;
    },

    /**
     * Trunca un texto a cierta longitud
     * @param {string} texto - Texto a truncar
     * @param {number} maxLength - Longitud máxima
     * @param {string} sufijo - Sufijo al truncar (...)
     * @returns {string} Texto truncado
     */
    truncar(texto, maxLength = 50, sufijo = '...') {
        if (!texto) {
            return '';
        }

        if (texto.length <= maxLength) {
            return texto;
        }

        return texto.substring(0, maxLength - sufijo.length) + sufijo;
    },

    /**
     * Capitaliza la primera letra de un texto
     * @param {string} texto - Texto a capitalizar
     * @returns {string} Texto capitalizado
     */
    capitalizar(texto) {
        if (!texto) {
            return '';
        }

        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    },

    /**
     * Capitaliza cada palabra de un texto
     * @param {string} texto - Texto a capitalizar
     * @returns {string} Texto con cada palabra capitalizada
     */
    capitalizarPalabras(texto) {
        if (!texto) {
            return '';
        }

        return texto
            .split(' ')
            .map(palabra => this.capitalizar(palabra))
            .join(' ');
    },

    /**
     * Formatea un nombre de usuario
     * @param {object} usuario - Objeto usuario {nombre, apellido, username}
     * @returns {string} Nombre formateado
     */
    nombreUsuario(usuario) {
        if (!usuario) {
            return 'Usuario';
        }

        if (usuario.nombre && usuario.apellido) {
            return `${usuario.nombre} ${usuario.apellido}`;
        }

        if (usuario.nombre) {
            return usuario.nombre;
        }

        if (usuario.username) {
            return usuario.username;
        }

        return 'Usuario';
    },

    /**
     * Formatea iniciales de un nombre
     * @param {string} nombre - Nombre completo
     * @returns {string} Iniciales (ej: Juan Pérez -> JP)
     */
    iniciales(nombre) {
        if (!nombre) {
            return 'U';
        }

        const palabras = nombre.trim().split(' ');
        if (palabras.length === 1) {
            return palabras[0].charAt(0).toUpperCase();
        }

        return (palabras[0].charAt(0) + palabras[palabras.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * Formatea un resultado de pick (local, visitante, empate)
     * @param {string} resultado - Resultado del pick
     * @returns {object} {texto, icono, clase}
     */
    resultadoPick(resultado) {
        const resultados = {
            local: {
                texto: 'Local',
                icono: 'fa-home',
                clase: 'text-blue-600 dark:text-blue-400'
            },
            visitante: {
                texto: 'Visitante',
                icono: 'fa-plane',
                clase: 'text-green-600 dark:text-green-400'
            },
            empate: {
                texto: 'Empate',
                icono: 'fa-equals',
                clase: 'text-yellow-600 dark:text-yellow-400'
            }
        };

        return resultados[resultado] || {
            texto: resultado,
            icono: 'fa-question',
            clase: 'text-gray-600 dark:text-gray-400'
        };
    },

    /**
     * Formatea un tamaño de archivo
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} Tamaño formateado (1.5 MB, 500 KB, etc.)
     */
    tamanioArchivo(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Formatea un número de teléfono
     * @param {string} telefono - Número de teléfono
     * @returns {string} Teléfono formateado
     */
    telefono(telefono) {
        if (!telefono) {
            return '';
        }

        // Eliminar todo excepto números
        const numeros = telefono.replace(/\D/g, '');

        // Formato mexicano: (XXX) XXX-XXXX
        if (numeros.length === 10) {
            return `(${numeros.substring(0, 3)}) ${numeros.substring(3, 6)}-${numeros.substring(6)}`;
        }

        return telefono;
    },

    /**
     * Formatea una lista de elementos
     * @param {array} elementos - Array de elementos
     * @param {string} separador - Separador (,)
     * @param {string} ultimoSeparador - Último separador (y)
     * @returns {string} Lista formateada
     */
    lista(elementos, separador = ', ', ultimoSeparador = ' y ') {
        if (!elementos || elementos.length === 0) {
            return '';
        }

        if (elementos.length === 1) {
            return elementos[0];
        }

        if (elementos.length === 2) {
            return elementos.join(ultimoSeparador);
        }

        const ultimoElemento = elementos[elementos.length - 1];
        const resto = elementos.slice(0, -1);

        return resto.join(separador) + ultimoSeparador + ultimoElemento;
    },

    /**
     * Formatea un rango de fechas
     * @param {Date|string} fechaInicio - Fecha de inicio
     * @param {Date|string} fechaFin - Fecha de fin
     * @returns {string} Rango formateado
     */
    rangoFechas(fechaInicio, fechaFin) {
        if (!fechaInicio || !fechaFin) {
            return '';
        }

        return `${this.fechaCorta(fechaInicio)} - ${this.fechaCorta(fechaFin)}`;
    },

    /**
     * Formatea duración en segundos a formato legible
     * @param {number} segundos - Duración en segundos
     * @returns {string} Duración formateada (2h 30m, 45m, etc.)
     */
    duracion(segundos) {
        if (!segundos || segundos <= 0) {
            return '0s';
        }

        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;

        const partes = [];

        if (horas > 0) {
            partes.push(`${horas}h`);
        }
        if (minutos > 0) {
            partes.push(`${minutos}m`);
        }
        if (segs > 0 && horas === 0) {
            partes.push(`${segs}s`);
        }

        return partes.join(' ') || '0s';
    },

    /**
     * Formatea un color hex a RGB
     * @param {string} hex - Color en hexadecimal (#FF0000)
     * @returns {object} {r, g, b}
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Sanitiza HTML para prevenir XSS
     * @param {string} html - HTML a sanitizar
     * @returns {string} HTML sanitizado
     */
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Formatters;
}
