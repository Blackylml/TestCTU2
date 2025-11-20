/**
 * Calculator Service
 * Servicio para cálculo de ganadores y distribución de premios
 * Basado en el calculator.js del frontend
 */

const { Quiniela, Partido, Participacion, Pick, User, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const {
  HTTP_STATUS,
  PARTICIPACION_STATUS,
  PARTIDO_STATUS,
  QUINIELA_STATUS,
} = require('../config/constants');

/**
 * Actualizar resultado de un partido
 */
const actualizarResultadoPartido = async (partidoId, marcadorLocal, marcadorVisitante) => {
  const partido = await Partido.findByPk(partidoId);

  if (!partido) {
    throw new AppError('Partido no encontrado', HTTP_STATUS.NOT_FOUND);
  }

  // Actualizar partido
  await partido.marcarCompletado(marcadorLocal, marcadorVisitante);

  // Actualizar todos los picks de este partido
  const picks = await Pick.findByPartido(partidoId);

  for (const pick of picks) {
    await pick.actualizarResultado(partido.resultado);
  }

  return partido;
};

/**
 * Actualizar aciertos de una participación
 */
const actualizarAciertosPar ticipacion = async (participacionId) => {
  const aciertos = await Pick.contarAciertos(participacionId);

  const participacion = await Participacion.findByPk(participacionId);
  if (participacion) {
    await participacion.actualizarAciertos(aciertos);
  }

  return aciertos;
};

/**
 * Actualizar aciertos de todas las participaciones de una quiniela
 */
const actualizarAciertosTodos = async (quinielaId) => {
  const participaciones = await Participacion.findByQuiniela(quinielaId);

  for (const participacion of participaciones) {
    await actualizarAciertosParticipacion(participacion.id);
  }

  return { message: 'Aciertos actualizados' };
};

/**
 * Calcular ganadores de una quiniela
 */
const calcularGanadores = async (quinielaId) => {
  const quiniela = await Quiniela.findByPk(quinielaId, {
    include: [{ model: Partido, as: 'partidos' }],
  });

  if (!quiniela) {
    throw new AppError('Quiniela no encontrada', HTTP_STATUS.NOT_FOUND);
  }

  // Verificar que todos los partidos estén completados
  const partidosPendientes = quiniela.partidos.filter(p => p.status !== PARTIDO_STATUS.COMPLETED);
  if (partidosPendientes.length > 0) {
    throw new AppError(
      `Faltan ${partidosPendientes.length} partidos por completar`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Actualizar aciertos de todas las participaciones
  await actualizarAciertosTodos(quinielaId);

  // Obtener tabla de posiciones ordenada
  const participaciones = await Participacion.findTablaPosiciones(quinielaId);

  if (participaciones.length === 0) {
    throw new AppError('No hay participaciones en esta quiniela', HTTP_STATUS.BAD_REQUEST);
  }

  // Asignar posiciones
  const transaction = await sequelize.transaction();

  try {
    let posicionActual = 1;
    let aciertosAnterior = null;
    let contadorEmpate = 0;

    for (let i = 0; i < participaciones.length; i++) {
      const participacion = participaciones[i];

      // Manejar empates - mismo número de aciertos
      if (aciertosAnterior === participacion.aciertos) {
        contadorEmpate++;
      } else {
        posicionActual += contadorEmpate;
        contadorEmpate = 1;
      }

      participacion.posicion_final = posicionActual;
      await participacion.save({ transaction });

      aciertosAnterior = participacion.aciertos;
    }

    // Distribuir premios
    await distribuirPremios(quinielaId, transaction);

    // Marcar quiniela como completada
    await quiniela.update({ status: QUINIELA_STATUS.COMPLETED }, { transaction });

    await transaction.commit();

    // Retornar ganadores
    return await Participacion.findGanadores(quinielaId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Distribuir premios entre ganadores
 */
const distribuirPremios = async (quinielaId, transaction = null) => {
  const quiniela = await Quiniela.findByPk(quinielaId, { transaction });

  if (!quiniela) {
    throw new AppError('Quiniela no encontrada', HTTP_STATUS.NOT_FOUND);
  }

  const participaciones = await Participacion.findTablaPosiciones(quinielaId);

  if (participaciones.length === 0) {
    return;
  }

  let totalPremiosPagados = 0;

  // Encontrar ganadores por posición
  const primerosLugares = participaciones.filter(p => p.posicion_final === 1);
  const segundosLugares = participaciones.filter(p => p.posicion_final === 2);
  const tercerosLugares = participaciones.filter(p => p.posicion_final === 3);

  // Distribuir premio de primer lugar
  if (primerosLugares.length > 0 && quiniela.premio_primero > 0) {
    const premioPorGanador = parseFloat(quiniela.premio_primero) / primerosLugares.length;

    for (const ganador of primerosLugares) {
      await ganador.update({
        premio_ganado: premioPorGanador,
        status: PARTICIPACION_STATUS.WINNER,
      }, { transaction });

      // Actualizar estadísticas del usuario
      const user = await User.findByPk(ganador.user_id, { transaction });
      await user.increment('total_ganadas', { transaction });
      await user.increment('total_ganado', { by: premioPorGanador, transaction });

      totalPremiosPagados += premioPorGanador;
    }
  }

  // Distribuir premio de segundo lugar
  if (segundosLugares.length > 0 && quiniela.premio_segundo > 0) {
    const premioPorGanador = parseFloat(quiniela.premio_segundo) / segundosLugares.length;

    for (const ganador of segundosLugares) {
      await ganador.update({
        premio_ganado: premioPorGanador,
        status: PARTICIPACION_STATUS.WINNER,
      }, { transaction });

      const user = await User.findByPk(ganador.user_id, { transaction });
      await user.increment('total_ganado', { by: premioPorGanador, transaction });

      totalPremiosPagados += premioPorGanador;
    }
  }

  // Distribuir premio de tercer lugar
  if (tercerosLugares.length > 0 && quiniela.premio_tercero > 0) {
    const premioPorGanador = parseFloat(quiniela.premio_tercero) / tercerosLugares.length;

    for (const ganador of tercerosLugares) {
      await ganador.update({
        premio_ganado: premioPorGanador,
        status: PARTICIPACION_STATUS.WINNER,
      }, { transaction });

      const user = await User.findByPk(ganador.user_id, { transaction });
      await user.increment('total_ganado', { by: premioPorGanador, transaction });

      totalPremiosPagados += premioPorGanador;
    }
  }

  // Marcar como perdedoras las que no ganaron
  const perdedores = participaciones.filter(p =>
    !primerosLugares.includes(p) &&
    !segundosLugares.includes(p) &&
    !tercerosLugares.includes(p)
  );

  for (const perdedor of perdedores) {
    if (perdedor.status !== PARTICIPACION_STATUS.LOSER) {
      await perdedor.update({
        status: PARTICIPACION_STATUS.LOSER,
      }, { transaction });
    }
  }

  // Actualizar total de premios pagados en la quiniela
  await quiniela.update({
    total_premios_pagados: totalPremiosPagados,
  }, { transaction });

  return totalPremiosPagados;
};

/**
 * Obtener tabla de posiciones de una quiniela
 */
const getTablaPosiciones = async (quinielaId) => {
  const participaciones = await Participacion.findAll({
    where: { quiniela_id: quinielaId },
    include: [
      {
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email', 'avatar_url'],
      },
    ],
    order: [
      ['aciertos', 'DESC'],
      ['fecha_picks_completados', 'ASC'],
    ],
  });

  return participaciones.map((p, index) => ({
    posicion: index + 1,
    ...p.toPublicJSON(),
    usuario: p.usuario,
  }));
};

/**
 * Obtener estadísticas de un usuario en una quiniela
 */
const getEstadisticasUsuario = async (userId, quinielaId) => {
  const participacion = await Participacion.findOne({
    where: {
      user_id: userId,
      quiniela_id: quinielaId,
    },
    include: [
      {
        model: Pick,
        as: 'picks',
        include: [
          {
            model: Partido,
            as: 'partido',
          },
        ],
      },
    ],
  });

  if (!participacion) {
    throw new AppError('Participación no encontrada', HTTP_STATUS.NOT_FOUND);
  }

  const totalPicks = participacion.picks.length;
  const aciertosTotales = participacion.aciertos;
  const porcentajeAciertos = totalPicks > 0 ? (aciertosTotales / totalPicks) * 100 : 0;

  return {
    participacion: participacion.toPublicJSON(),
    estadisticas: {
      total_picks: totalPicks,
      aciertos: aciertosTotales,
      errores: totalPicks - aciertosTotales,
      porcentaje_aciertos: porcentajeAciertos.toFixed(2),
      roi: participacion.calcularROI().toFixed(2),
    },
    picks: participacion.picks,
  };
};

/**
 * Obtener distribución de predicciones para un partido
 */
const getDistribucionPredicciones = async (partidoId) => {
  return await Pick.getDistribucionPredicciones(partidoId);
};

module.exports = {
  actualizarResultadoPartido,
  actualizarAciertosParticipacion,
  actualizarAciertosTodos,
  calcularGanadores,
  distribuirPremios,
  getTablaPosiciones,
  getEstadisticasUsuario,
  getDistribucionPredicciones,
};
