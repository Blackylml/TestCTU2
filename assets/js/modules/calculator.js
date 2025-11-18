/**
 * calculator.js
 * Módulo de cálculos para QuinielaPro
 * Contiene algoritmos de cálculo de ganadores, estadísticas y distribución de premios
 */

const Calculator = {
    /**
     * Determina el resultado de un partido basado en el marcador
     * @param {number} golesLocal - Goles del equipo local
     * @param {number} golesVisitante - Goles del equipo visitante
     * @returns {string} 'local', 'visitante' o 'empate'
     */
    determinarResultado(golesLocal, golesVisitante) {
        if (golesLocal > golesVisitante) return 'local';
        if (golesVisitante > golesLocal) return 'visitante';
        return 'empate';
    },

    /**
     * Calcula aciertos de un usuario comparando sus picks con resultados reales
     * @param {array} userPicks - Picks del usuario [{partidoId, resultado}]
     * @param {array} resultadosReales - Resultados reales [{partidoId, golesLocal, golesVisitante}]
     * @returns {object} {aciertos: number, detalles: array}
     */
    calcularAciertos(userPicks, resultadosReales) {
        let aciertos = 0;
        const detalles = [];

        userPicks.forEach(pick => {
            const partidoReal = resultadosReales.find(r => r.partidoId === pick.partidoId);

            if (partidoReal) {
                const resultadoReal = this.determinarResultado(
                    partidoReal.golesLocal,
                    partidoReal.golesVisitante
                );

                const esAcierto = pick.resultado === resultadoReal;
                if (esAcierto) {
                    aciertos++;
                }

                detalles.push({
                    partidoId: pick.partidoId,
                    pickUsuario: pick.resultado,
                    resultadoReal: resultadoReal,
                    esAcierto: esAcierto,
                    marcador: {
                        local: partidoReal.golesLocal,
                        visitante: partidoReal.golesVisitante
                    }
                });
            }
        });

        return {
            aciertos: aciertos,
            total: userPicks.length,
            porcentaje: (aciertos / userPicks.length) * 100,
            detalles: detalles
        };
    },

    /**
     * Calcula ganadores de una quiniela
     * @param {array} participaciones - Array de participaciones con picks de usuarios
     * @param {array} resultadosReales - Resultados reales de los partidos
     * @param {object} criteriosDesempate - Criterios de desempate {usarTimestamp, usarAleatorio}
     * @returns {array} Array de ganadores ordenados por aciertos
     */
    calcularGanadores(participaciones, resultadosReales, criteriosDesempate = { usarTimestamp: true }) {
        // Calcular aciertos para cada participación
        const participacionesConAciertos = participaciones.map(participacion => {
            const resultado = this.calcularAciertos(participacion.picks, resultadosReales);

            return {
                userId: participacion.userId,
                userName: participacion.userName,
                aciertos: resultado.aciertos,
                porcentaje: resultado.porcentaje,
                detalles: resultado.detalles,
                timestamp: participacion.timestamp || new Date().getTime(),
                participacionId: participacion.id
            };
        });

        // Ordenar por aciertos (mayor a menor)
        participacionesConAciertos.sort((a, b) => {
            // Primero por número de aciertos
            if (b.aciertos !== a.aciertos) {
                return b.aciertos - a.aciertos;
            }

            // Desempate por timestamp (primero el que participó antes)
            if (criteriosDesempate.usarTimestamp) {
                return a.timestamp - b.timestamp;
            }

            // Desempate aleatorio (si se especifica)
            if (criteriosDesempate.usarAleatorio) {
                return Math.random() - 0.5;
            }

            return 0;
        });

        // Asignar posiciones
        participacionesConAciertos.forEach((participacion, index) => {
            participacion.posicion = index + 1;
        });

        return participacionesConAciertos;
    },

    /**
     * Distribuye premios entre los ganadores
     * @param {array} ganadores - Array de ganadores ordenados
     * @param {array} premios - Array de premios [{posicion, monto, descripcion}]
     * @returns {array} Array de ganadores con premios asignados
     */
    distribuirPremios(ganadores, premios) {
        return ganadores.map(ganador => {
            const premio = premios.find(p => p.posicion === ganador.posicion);

            return {
                ...ganador,
                premio: premio ? {
                    monto: premio.monto,
                    descripcion: premio.descripcion || `${ganador.posicion}° Lugar`
                } : null,
                esPremio: !!premio
            };
        });
    },

    /**
     * Calcula estadísticas generales de un usuario
     * @param {array} participaciones - Historial de participaciones del usuario
     * @returns {object} Estadísticas del usuario
     */
    calcularEstadisticasUsuario(participaciones) {
        if (!participaciones || participaciones.length === 0) {
            return {
                totalParticipaciones: 0,
                totalAciertos: 0,
                porcentajeAciertosGlobal: 0,
                premiosGanados: 0,
                totalGanado: 0,
                totalGastado: 0,
                roi: 0,
                rachaActual: { tipo: null, cantidad: 0 },
                mejorPosicion: null,
                promedioAciertos: 0
            };
        }

        let totalAciertos = 0;
        let totalPartidos = 0;
        let premiosGanados = 0;
        let totalGanado = 0;
        let totalGastado = 0;
        let mejorPosicion = Infinity;

        participaciones.forEach(participacion => {
            totalAciertos += participacion.aciertos || 0;
            totalPartidos += participacion.totalPartidos || 0;
            totalGastado += participacion.precioEntrada || 0;

            if (participacion.premio) {
                premiosGanados++;
                totalGanado += participacion.premio.monto || 0;
            }

            if (participacion.posicion && participacion.posicion < mejorPosicion) {
                mejorPosicion = participacion.posicion;
            }
        });

        // Calcular racha actual
        const racha = this.calcularRacha(participaciones);

        // Calcular ROI (Return on Investment)
        const roi = totalGastado > 0 ? ((totalGanado - totalGastado) / totalGastado) * 100 : 0;

        return {
            totalParticipaciones: participaciones.length,
            totalAciertos: totalAciertos,
            porcentajeAciertosGlobal: totalPartidos > 0 ? (totalAciertos / totalPartidos) * 100 : 0,
            premiosGanados: premiosGanados,
            totalGanado: totalGanado,
            totalGastado: totalGastado,
            roi: roi,
            rachaActual: racha,
            mejorPosicion: mejorPosicion === Infinity ? null : mejorPosicion,
            promedioAciertos: participaciones.length > 0 ? totalAciertos / participaciones.length : 0
        };
    },

    /**
     * Calcula la racha actual de un usuario (victorias/derrotas consecutivas)
     * @param {array} participaciones - Historial de participaciones ordenado por fecha
     * @returns {object} {tipo: 'victorias'|'derrotas', cantidad: number}
     */
    calcularRacha(participaciones) {
        if (!participaciones || participaciones.length === 0) {
            return { tipo: null, cantidad: 0 };
        }

        // Ordenar por fecha (más reciente primero)
        const participacionesOrdenadas = [...participaciones].sort((a, b) => {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        let racha = 0;
        let tipoRacha = null;

        // La primera participación determina el tipo de racha
        const primerGano = participacionesOrdenadas[0].premio !== null && participacionesOrdenadas[0].premio !== undefined;
        tipoRacha = primerGano ? 'victorias' : 'derrotas';

        // Contar rachas consecutivas
        for (const participacion of participacionesOrdenadas) {
            const gano = participacion.premio !== null && participacion.premio !== undefined;

            if ((tipoRacha === 'victorias' && gano) || (tipoRacha === 'derrotas' && !gano)) {
                racha++;
            } else {
                break;
            }
        }

        return {
            tipo: tipoRacha,
            cantidad: racha
        };
    },

    /**
     * Calcula estadísticas de una quiniela
     * @param {array} participaciones - Todas las participaciones de la quiniela
     * @param {array} resultadosReales - Resultados reales de los partidos
     * @returns {object} Estadísticas de la quiniela
     */
    calcularEstadisticasQuiniela(participaciones, resultadosReales) {
        if (!participaciones || participaciones.length === 0) {
            return {
                totalParticipantes: 0,
                promedioAciertos: 0,
                partidoMasDificil: null,
                partidoMasFacil: null,
                distribucionResultados: []
            };
        }

        const totalParticipantes = participaciones.length;
        let sumaAciertos = 0;

        // Calcular aciertos para cada participación
        const participacionesConAciertos = participaciones.map(p => {
            const resultado = this.calcularAciertos(p.picks, resultadosReales);
            sumaAciertos += resultado.aciertos;
            return resultado;
        });

        const promedioAciertos = sumaAciertos / totalParticipantes;

        // Calcular partido más difícil y más fácil
        const estadisticasPartidos = this.calcularEstadisticasPartidos(participaciones, resultadosReales);

        // Calcular distribución de resultados (cuántos usuarios acertaron 0, 1, 2... partidos)
        const distribucion = {};
        participacionesConAciertos.forEach(p => {
            const aciertos = p.aciertos;
            distribucion[aciertos] = (distribucion[aciertos] || 0) + 1;
        });

        const distribucionArray = Object.keys(distribucion).map(aciertos => ({
            aciertos: parseInt(aciertos),
            usuarios: distribucion[aciertos],
            porcentaje: (distribucion[aciertos] / totalParticipantes) * 100
        })).sort((a, b) => a.aciertos - b.aciertos);

        return {
            totalParticipantes: totalParticipantes,
            promedioAciertos: promedioAciertos,
            partidoMasDificil: estadisticasPartidos.masDificil,
            partidoMasFacil: estadisticasPartidos.masFacil,
            distribucionResultados: distribucionArray
        };
    },

    /**
     * Calcula estadísticas por partido (qué porcentaje de usuarios acertó cada partido)
     * @param {array} participaciones - Participaciones
     * @param {array} resultadosReales - Resultados reales
     * @returns {object} Estadísticas por partido
     */
    calcularEstadisticasPartidos(participaciones, resultadosReales) {
        const estadisticas = {};

        participaciones.forEach(participacion => {
            const resultado = this.calcularAciertos(participacion.picks, resultadosReales);

            resultado.detalles.forEach(detalle => {
                if (!estadisticas[detalle.partidoId]) {
                    estadisticas[detalle.partidoId] = {
                        partidoId: detalle.partidoId,
                        aciertos: 0,
                        total: 0,
                        resultadoReal: detalle.resultadoReal,
                        marcador: detalle.marcador
                    };
                }

                estadisticas[detalle.partidoId].total++;
                if (detalle.esAcierto) {
                    estadisticas[detalle.partidoId].aciertos++;
                }
            });
        });

        // Convertir a array y calcular porcentajes
        const partidosArray = Object.values(estadisticas).map(p => ({
            ...p,
            porcentajeAciertos: (p.aciertos / p.total) * 100
        }));

        // Encontrar más difícil y más fácil
        const masDificil = partidosArray.reduce((prev, current) =>
            (prev.porcentajeAciertos < current.porcentajeAciertos) ? prev : current
        , partidosArray[0]);

        const masFacil = partidosArray.reduce((prev, current) =>
            (prev.porcentajeAciertos > current.porcentajeAciertos) ? prev : current
        , partidosArray[0]);

        return {
            masDificil: masDificil,
            masFacil: masFacil,
            todos: partidosArray
        };
    },

    /**
     * Calcula el total de premios a repartir
     * @param {array} premios - Array de premios
     * @returns {number} Total de premios
     */
    calcularTotalPremios(premios) {
        return premios.reduce((total, premio) => total + (premio.monto || 0), 0);
    },

    /**
     * Calcula ingresos potenciales de una quiniela
     * @param {number} precio - Precio de entrada
     * @param {number} participantes - Número estimado de participantes
     * @returns {object} Cálculos financieros
     */
    calcularIngresos(precio, participantes, premios) {
        const ingresosTotal = precio * participantes;
        const totalPremios = this.calcularTotalPremios(premios);
        const utilidad = ingresosTotal - totalPremios;
        const margenUtilidad = ingresosTotal > 0 ? (utilidad / ingresosTotal) * 100 : 0;

        return {
            ingresosTotal: ingresosTotal,
            totalPremios: totalPremios,
            utilidad: utilidad,
            margenUtilidad: margenUtilidad
        };
    },

    /**
     * Calcula puntos de un usuario basado en performance
     * @param {object} estadisticas - Estadísticas del usuario
     * @returns {number} Puntos totales
     */
    calcularPuntos(estadisticas) {
        let puntos = 0;

        // Puntos por aciertos
        puntos += estadisticas.totalAciertos * 10;

        // Puntos por premios ganados
        puntos += estadisticas.premiosGanados * 50;

        // Bonus por racha
        if (estadisticas.rachaActual.tipo === 'victorias') {
            puntos += estadisticas.rachaActual.cantidad * 20;
        }

        // Bonus por ROI positivo
        if (estadisticas.roi > 0) {
            puntos += Math.floor(estadisticas.roi);
        }

        return puntos;
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
}
