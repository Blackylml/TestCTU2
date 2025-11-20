/**
 * Quiniela Service
 * Servicio de lógica de negocio para quinielas
 */

const { Quiniela, Partido, Participacion, User, Pick, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  QUINIELA_STATUS,
  PARTICIPACION_STATUS,
  PAGINATION
} = require('../config/constants');
const { Op } = require('sequelize');

/**
 * Crear nueva quiniela
 */
const createQuiniela = async (quinielaData, creadorId) => {
  const { partidos, ...quinielaInfo } = quinielaData;

  // Iniciar transacción
  const transaction = await sequelize.transaction();

  try {
    // Crear quiniela
    const quiniela = await Quiniela.create({
      ...quinielaInfo,
      creador_id: creadorId,
      status: QUINIELA_STATUS.DRAFT,
    }, { transaction });

    // Crear partidos si vienen
    if (partidos && partidos.length > 0) {
      const partidosData = partidos.map((partido, index) => ({
        ...partido,
        quiniela_id: quiniela.id,
        orden: partido.orden || index,
      }));

      await Partido.bulkCreate(partidosData, { transaction });
    }

    await transaction.commit();

    // Obtener quiniela completa con partidos
    return await getQuinielaById(quiniela.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Obtener quiniela por ID
 */
const getQuinielaById = async (id, includeRelations = true) => {
  const include = includeRelations ? [
    {
      model: Partido,
      as: 'partidos',
      order: [['orden', 'ASC']],
    },
    {
      model: User,
      as: 'creador',
      attributes: ['id', 'nombre', 'email'],
    },
  ] : [];

  const quiniela = await Quiniela.findByPk(id, { include });

  if (!quiniela) {
    throw new AppError(ERROR_MESSAGES.QUINIELA_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return quiniela;
};

/**
 * Listar quinielas con filtros
 */
const listQuinielas = async (filters = {}) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    status,
    deporte,
    search,
    publico = true,
    orderBy = 'created_at',
    orderDir = 'DESC',
  } = filters;

  const offset = (page - 1) * limit;
  const where = {};

  // Filtros
  if (status) where.status = status;
  if (deporte) where.deporte = deporte;
  if (publico !== undefined) where.publico = publico;

  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { descripcion: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Quiniela.findAndCountAll({
    where,
    include: [
      {
        model: Partido,
        as: 'partidos',
        attributes: ['id'],
      },
      {
        model: User,
        as: 'creador',
        attributes: ['id', 'nombre'],
      },
    ],
    order: [[orderBy, orderDir]],
    limit,
    offset,
  });

  return {
    quinielas: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Obtener quinielas disponibles para compra
 */
const getQuinielasDisponibles = async (filters = {}) => {
  const { page = 1, limit = 20, deporte } = filters;
  const offset = (page - 1) * limit;
  const now = new Date();

  const where = {
    status: QUINIELA_STATUS.ACTIVE,
    publico: true,
    fecha_cierre: { [Op.gt]: now },
  };

  if (deporte) where.deporte = deporte;

  const { count, rows } = await Quiniela.findAndCountAll({
    where,
    include: [
      {
        model: Partido,
        as: 'partidos',
        attributes: ['id', 'equipo_local', 'equipo_visitante', 'fecha_partido'],
      },
    ],
    order: [['fecha_inicio', 'ASC']],
    limit,
    offset,
  });

  return {
    quinielas: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Actualizar quiniela
 */
const updateQuiniela = async (id, updates, userId) => {
  const quiniela = await getQuinielaById(id, false);

  // Verificar permisos (solo el creador puede actualizar)
  if (quiniela.creador_id !== userId) {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  // No permitir actualizar si ya inició
  if (quiniela.hasIniciado()) {
    throw new AppError(ERROR_MESSAGES.QUINIELA_STARTED, HTTP_STATUS.BAD_REQUEST);
  }

  // Campos que no se pueden actualizar
  delete updates.creador_id;
  delete updates.participantes_actuales;
  delete updates.total_recaudado;
  delete updates.total_premios_pagados;

  await quiniela.update(updates);

  return await getQuinielaById(id);
};

/**
 * Activar quiniela (cambiar de borrador a activa)
 */
const activarQuiniela = async (id, userId) => {
  const quiniela = await getQuinielaById(id);

  // Verificar permisos
  if (quiniela.creador_id !== userId) {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  // Verificar que esté en borrador
  if (quiniela.status !== QUINIELA_STATUS.DRAFT) {
    throw new AppError('La quiniela ya está activada', HTTP_STATUS.BAD_REQUEST);
  }

  // Verificar que tenga partidos
  if (!quiniela.partidos || quiniela.partidos.length === 0) {
    throw new AppError('La quiniela debe tener al menos un partido', HTTP_STATUS.BAD_REQUEST);
  }

  await quiniela.update({ status: QUINIELA_STATUS.ACTIVE });

  return quiniela;
};

/**
 * Eliminar quiniela
 */
const deleteQuiniela = async (id, userId) => {
  const quiniela = await getQuinielaById(id, false);

  // Verificar permisos
  if (quiniela.creador_id !== userId) {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  // No permitir eliminar si ya tiene participantes
  if (quiniela.participantes_actuales > 0) {
    throw new AppError(
      'No se puede eliminar una quiniela con participantes',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  await quiniela.destroy();

  return { message: 'Quiniela eliminada exitosamente' };
};

/**
 * Comprar participación en quiniela
 */
const comprarQuiniela = async (quinielaId, userId) => {
  const quiniela = await getQuinielaById(quinielaId);

  // Verificar que esté abierta para compras
  if (!quiniela.isAbiertaParaCompras()) {
    throw new AppError(ERROR_MESSAGES.QUINIELA_CLOSED, HTTP_STATUS.BAD_REQUEST);
  }

  // Verificar que no haya comprado ya
  const existeParticipacion = await Participacion.existeParticipacion(userId, quinielaId);
  if (existeParticipacion) {
    throw new AppError(ERROR_MESSAGES.DUPLICATE_PARTICIPACION, HTTP_STATUS.CONFLICT);
  }

  // Verificar cupos
  if (!quiniela.hayCuposDisponibles()) {
    throw new AppError(ERROR_MESSAGES.MAX_PARTICIPANTS_REACHED, HTTP_STATUS.BAD_REQUEST);
  }

  const transaction = await sequelize.transaction();

  try {
    // Crear participación
    const participacion = await Participacion.create({
      user_id: userId,
      quiniela_id: quinielaId,
      precio_pagado: quiniela.precio,
      total_picks: quiniela.partidos.length,
      status: PARTICIPACION_STATUS.PENDING,
    }, { transaction });

    // Actualizar quiniela
    await quiniela.increment('participantes_actuales', { transaction });
    await quiniela.increment('total_recaudado', {
      by: parseFloat(quiniela.precio),
      transaction
    });

    // Actualizar estadísticas del usuario
    const user = await User.findByPk(userId, { transaction });
    await user.increment('total_participaciones', { transaction });
    await user.increment('total_invertido', {
      by: parseFloat(quiniela.precio),
      transaction
    });

    await transaction.commit();

    return participacion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Obtener estadísticas de quiniela
 */
const getQuinielaStats = async (id) => {
  const quiniela = await getQuinielaById(id);

  const [totalParticipaciones, partidosCompletados, ganadores] = await Promise.all([
    Participacion.count({ where: { quiniela_id: id } }),
    Partido.count({
      where: {
        quiniela_id: id,
        status: 'completado'
      }
    }),
    Participacion.count({
      where: {
        quiniela_id: id,
        status: PARTICIPACION_STATUS.WINNER
      }
    }),
  ]);

  return {
    quiniela: quiniela.toPublicJSON(),
    stats: {
      total_participaciones: totalParticipaciones,
      partidos_completados: partidosCompletados,
      total_partidos: quiniela.partidos.length,
      ganadores,
      utilidad: quiniela.calcularUtilidad(),
      margen: quiniela.calcularMargen(),
    },
  };
};

module.exports = {
  createQuiniela,
  getQuinielaById,
  listQuinielas,
  getQuinielasDisponibles,
  updateQuiniela,
  activarQuiniela,
  deleteQuiniela,
  comprarQuiniela,
  getQuinielaStats,
};
