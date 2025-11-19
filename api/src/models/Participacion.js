/**
 * Participacion Model
 * Modelo de participaciones de usuarios en quinielas
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PARTICIPACION_STATUS } = require('../config/constants');

const Participacion = sequelize.define('Participacion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  quiniela_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'quinielas',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PARTICIPACION_STATUS)),
    defaultValue: PARTICIPACION_STATUS.PENDING,
    allowNull: false,
  },
  // Datos de compra
  precio_pagado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_compra: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // Resultados
  aciertos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  posicion_final: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  premio_ganado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Control de llenado de picks
  picks_completados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_picks: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_picks_completados: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Información adicional de la participación',
  },
}, {
  tableName: 'participaciones',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'quiniela_id'],
      name: 'unique_user_quiniela',
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['quiniela_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['aciertos'],
    },
    {
      fields: ['posicion_final'],
    },
  ],
});

/**
 * Métodos de instancia
 */

// Verificar si los picks están completos
Participacion.prototype.isPicksCompletos = function() {
  return this.picks_completados === this.total_picks;
};

// Verificar si ganó premio
Participacion.prototype.isGanador = function() {
  return parseFloat(this.premio_ganado) > 0;
};

// Calcular porcentaje de aciertos
Participacion.prototype.calcularPorcentajeAciertos = function() {
  if (this.total_picks === 0) return 0;
  return (this.aciertos / this.total_picks) * 100;
};

// Calcular ROI (Return on Investment)
Participacion.prototype.calcularROI = function() {
  const invertido = parseFloat(this.precio_pagado);
  if (invertido === 0) return 0;
  const ganancia = parseFloat(this.premio_ganado) - invertido;
  return (ganancia / invertido) * 100;
};

// Marcar picks como completados
Participacion.prototype.marcarPicksCompletos = async function() {
  return this.update({
    status: PARTICIPACION_STATUS.FILLED,
    fecha_picks_completados: new Date(),
  });
};

// Actualizar aciertos
Participacion.prototype.actualizarAciertos = async function(aciertos) {
  return this.update({ aciertos });
};

// Asignar premio
Participacion.prototype.asignarPremio = async function(posicion, monto) {
  return this.update({
    posicion_final: posicion,
    premio_ganado: monto,
    status: monto > 0 ? PARTICIPACION_STATUS.WINNER : PARTICIPACION_STATUS.LOSER,
  });
};

// Obtener datos públicos
Participacion.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    user_id: this.user_id,
    quiniela_id: this.quiniela_id,
    status: this.status,
    precio_pagado: parseFloat(this.precio_pagado),
    fecha_compra: this.fecha_compra,
    aciertos: this.aciertos,
    posicion_final: this.posicion_final,
    premio_ganado: parseFloat(this.premio_ganado),
    picks_completados: this.picks_completados,
    total_picks: this.total_picks,
    picks_completos: this.isPicksCompletos(),
    porcentaje_aciertos: this.calcularPorcentajeAciertos(),
    roi: this.calcularROI(),
    is_ganador: this.isGanador(),
    created_at: this.created_at,
  };
};

/**
 * Métodos estáticos
 */

// Obtener participaciones de un usuario
Participacion.findByUser = async function(userId, options = {}) {
  return this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    ...options,
  });
};

// Obtener participaciones de una quiniela
Participacion.findByQuiniela = async function(quinielaId, options = {}) {
  return this.findAll({
    where: { quiniela_id: quinielaId },
    ...options,
  });
};

// Obtener ganadores de una quiniela
Participacion.findGanadores = async function(quinielaId) {
  return this.findAll({
    where: {
      quiniela_id: quinielaId,
      status: PARTICIPACION_STATUS.WINNER,
    },
    order: [['posicion_final', 'ASC']],
  });
};

// Obtener tabla de posiciones
Participacion.findTablaPosiciones = async function(quinielaId) {
  return this.findAll({
    where: {
      quiniela_id: quinielaId,
      status: {
        [sequelize.Sequelize.Op.in]: [
          PARTICIPACION_STATUS.FILLED,
          PARTICIPACION_STATUS.IN_PROGRESS,
          PARTICIPACION_STATUS.COMPLETED,
          PARTICIPACION_STATUS.WINNER,
          PARTICIPACION_STATUS.LOSER,
        ],
      },
    },
    order: [
      ['aciertos', 'DESC'],
      ['fecha_picks_completados', 'ASC'],
    ],
  });
};

// Verificar si usuario ya participa
Participacion.existeParticipacion = async function(userId, quinielaId) {
  const count = await this.count({
    where: {
      user_id: userId,
      quiniela_id: quinielaId,
    },
  });
  return count > 0;
};

module.exports = Participacion;
