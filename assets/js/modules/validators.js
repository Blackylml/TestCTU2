/**
 * validators.js
 * Módulo de validaciones para QuinielaPro
 * Contiene todas las validaciones de formularios, datos y reglas de negocio
 */

const Validators = {
    /**
     * Valida campos requeridos
     * @param {string} value - Valor a validar
     * @returns {object} {valid: boolean, message: string}
     */
    required(value) {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        return {
            valid: trimmedValue !== '' && trimmedValue !== null && trimmedValue !== undefined,
            message: 'Este campo es requerido'
        };
    },

    /**
     * Valida que un valor sea un número positivo
     * @param {number|string} value - Valor a validar
     * @returns {object} {valid: boolean, message: string}
     */
    positiveNumber(value) {
        const num = parseFloat(value);
        return {
            valid: !isNaN(num) && num > 0,
            message: 'Debe ser un número mayor a 0'
        };
    },

    /**
     * Valida que un valor sea un entero no negativo
     * @param {number|string} value - Valor a validar
     * @returns {object} {valid: boolean, message: string}
     */
    nonNegativeInteger(value) {
        const num = parseInt(value, 10);
        return {
            valid: !isNaN(num) && num >= 0 && Number.isInteger(num),
            message: 'Debe ser un número entero mayor o igual a 0'
        };
    },

    /**
     * Valida formato de email
     * @param {string} email - Email a validar
     * @returns {object} {valid: boolean, message: string}
     */
    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: emailRegex.test(email),
            message: 'Formato de email inválido'
        };
    },

    /**
     * Valida longitud mínima
     * @param {string} value - Valor a validar
     * @param {number} minLength - Longitud mínima
     * @returns {object} {valid: boolean, message: string}
     */
    minLength(value, minLength) {
        return {
            valid: value.length >= minLength,
            message: `Debe tener al menos ${minLength} caracteres`
        };
    },

    /**
     * Valida longitud máxima
     * @param {string} value - Valor a validar
     * @param {number} maxLength - Longitud máxima
     * @returns {object} {valid: boolean, message: string}
     */
    maxLength(value, maxLength) {
        return {
            valid: value.length <= maxLength,
            message: `No debe exceder ${maxLength} caracteres`
        };
    },

    /**
     * Valida que una fecha sea posterior a otra
     * @param {Date|string} date1 - Primera fecha
     * @param {Date|string} date2 - Segunda fecha (debe ser posterior)
     * @returns {object} {valid: boolean, message: string}
     */
    dateAfter(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return {
            valid: d2 > d1,
            message: 'La fecha debe ser posterior'
        };
    },

    /**
     * Valida que una fecha sea futura
     * @param {Date|string} date - Fecha a validar
     * @returns {object} {valid: boolean, message: string}
     */
    futureDate(date) {
        const d = new Date(date);
        const now = new Date();
        return {
            valid: d > now,
            message: 'La fecha debe ser futura'
        };
    },

    /**
     * Valida rango de fechas para una quiniela
     * Reglas: fecha_inicio < fecha_cierre < fecha_finalizacion
     * @param {object} dates - {inicio, cierre, finalizacion}
     * @returns {object} {valid: boolean, errors: array}
     */
    quinielaDateRange(dates) {
        const errors = [];
        const { inicio, cierre, finalizacion } = dates;

        const inicioDate = new Date(inicio);
        const cierreDate = new Date(cierre);
        const finalizacionDate = new Date(finalizacion);
        const now = new Date();

        // Validar que inicio sea futuro
        if (inicioDate <= now) {
            errors.push('La fecha de inicio debe ser futura');
        }

        // Validar que cierre sea posterior a inicio
        if (cierreDate <= inicioDate) {
            errors.push('La fecha de cierre debe ser posterior a la fecha de inicio');
        }

        // Validar que finalización sea posterior a cierre
        if (finalizacionDate <= cierreDate) {
            errors.push('La fecha de finalización debe ser posterior a la fecha de cierre');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Valida datos de un partido
     * @param {object} partido - {equipoLocal, equipoVisitante, fecha}
     * @returns {object} {valid: boolean, errors: array}
     */
    partido(partido) {
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
            errors.push('La fecha del partido es requerida');
        } else {
            const fechaPartido = new Date(partido.fecha);
            if (isNaN(fechaPartido.getTime())) {
                errors.push('Formato de fecha inválido');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Valida marcador de un partido
     * @param {object} marcador - {golesLocal, golesVisitante}
     * @returns {object} {valid: boolean, errors: array}
     */
    marcador(marcador) {
        const errors = [];

        const localValidation = this.nonNegativeInteger(marcador.golesLocal);
        if (!localValidation.valid) {
            errors.push('Goles local: ' + localValidation.message);
        }

        const visitanteValidation = this.nonNegativeInteger(marcador.golesVisitante);
        if (!visitanteValidation.valid) {
            errors.push('Goles visitante: ' + visitanteValidation.message);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Valida datos financieros de una quiniela
     * @param {object} financial - {precio, premios}
     * @returns {object} {valid: boolean, errors: array}
     */
    quinielaFinancial(financial) {
        const errors = [];

        // Validar precio
        const precioValidation = this.positiveNumber(financial.precio);
        if (!precioValidation.valid) {
            errors.push('Precio: ' + precioValidation.message);
        }

        // Validar que haya al menos un premio
        if (!financial.premios || financial.premios.length === 0) {
            errors.push('Debe definir al menos un premio');
        } else {
            // Validar cada premio
            financial.premios.forEach((premio, index) => {
                const premioValidation = this.positiveNumber(premio.monto);
                if (!premioValidation.valid) {
                    errors.push(`Premio ${index + 1}: ${premioValidation.message}`);
                }

                // Validar posición del premio
                const posicionValidation = this.positiveNumber(premio.posicion);
                if (!posicionValidation.valid) {
                    errors.push(`Premio ${index + 1} - Posición: ${posicionValidation.message}`);
                }
            });

            // Validar que no haya posiciones duplicadas
            const posiciones = financial.premios.map(p => p.posicion);
            const duplicados = posiciones.filter((pos, index) => posiciones.indexOf(pos) !== index);
            if (duplicados.length > 0) {
                errors.push('No puede haber posiciones de premio duplicadas');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Valida un formulario completo de creación de quiniela
     * @param {object} formData - Datos del formulario
     * @returns {object} {valid: boolean, errors: object}
     */
    quinielaForm(formData) {
        const errors = {};

        // Validar nombre
        const nombreValidation = this.required(formData.nombre);
        if (!nombreValidation.valid) {
            errors.nombre = nombreValidation.message;
        } else {
            const lengthValidation = this.minLength(formData.nombre, 3);
            if (!lengthValidation.valid) {
                errors.nombre = lengthValidation.message;
            }
        }

        // Validar descripción
        const descripcionValidation = this.required(formData.descripcion);
        if (!descripcionValidation.valid) {
            errors.descripcion = descripcionValidation.message;
        }

        // Validar deporte
        const deporteValidation = this.required(formData.deporte);
        if (!deporteValidation.valid) {
            errors.deporte = deporteValidation.message;
        }

        // Validar fechas
        const dateRangeValidation = this.quinielaDateRange({
            inicio: formData.fechaInicio,
            cierre: formData.fechaCierre,
            finalizacion: formData.fechaFinalizacion
        });
        if (!dateRangeValidation.valid) {
            errors.fechas = dateRangeValidation.errors;
        }

        // Validar financiero
        const financialValidation = this.quinielaFinancial({
            precio: formData.precio,
            premios: formData.premios
        });
        if (!financialValidation.valid) {
            errors.financiero = financialValidation.errors;
        }

        // Validar partidos
        if (!formData.partidos || formData.partidos.length === 0) {
            errors.partidos = ['Debe agregar al menos un partido'];
        } else if (formData.partidos.length < 3) {
            errors.partidos = ['Se requieren al menos 3 partidos'];
        } else {
            const partidosErrors = [];
            formData.partidos.forEach((partido, index) => {
                const partidoValidation = this.partido(partido);
                if (!partidoValidation.valid) {
                    partidosErrors.push({
                        index: index,
                        errors: partidoValidation.errors
                    });
                }
            });
            if (partidosErrors.length > 0) {
                errors.partidos = partidosErrors;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    },

    /**
     * Valida picks de un usuario para una quiniela
     * @param {array} picks - Array de picks [{partidoId, resultado}]
     * @param {number} totalPartidos - Total de partidos en la quiniela
     * @returns {object} {valid: boolean, errors: array}
     */
    userPicks(picks, totalPartidos) {
        const errors = [];

        // Validar que haya picks
        if (!picks || picks.length === 0) {
            errors.push('Debe realizar al menos una selección');
            return { valid: false, errors: errors };
        }

        // Validar que se hayan completado todos los picks
        if (picks.length !== totalPartidos) {
            errors.push(`Debe completar todos los ${totalPartidos} partidos`);
        }

        // Validar que no haya picks duplicados
        const partidoIds = picks.map(p => p.partidoId);
        const duplicados = partidoIds.filter((id, index) => partidoIds.indexOf(id) !== index);
        if (duplicados.length > 0) {
            errors.push('Hay partidos seleccionados más de una vez');
        }

        // Validar que cada pick tenga un resultado válido
        const resultadosValidos = ['local', 'visitante', 'empate'];
        picks.forEach((pick, index) => {
            if (!resultadosValidos.includes(pick.resultado)) {
                errors.push(`Partido ${index + 1}: Resultado inválido`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
