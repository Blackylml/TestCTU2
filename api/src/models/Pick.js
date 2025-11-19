/**
 * Pick Model
 * Modelo de predicciones de usuarios para partidos
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PARTIDO_RESULTS } = require('../config/constants');

const Pick = sequelize.define('Pick', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  participacion_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'participaciones',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  partido_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'partidos',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  prediccion: {
    type: DataTypes.ENUM(...Object.values(PARTIDO_RESULTS)),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La predicción es requerida',
      },
    },
  },
  // Resultado real del partido (se copia cuando el partido termina)
  resultado_real: {
    type: DataTypes.ENUM(...Object.values(PARTIDO_RESULTS)),
    allowNull: true,
  },
  // Si acertó o no
  acierto: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  // Marcador predicho (opcional, para futuras features)
  marcador_local_predicho: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  marcador_visitante_predicho: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Confianza en la predicción (1-5, para futuras features)
  confianza: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  },
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'picks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['participacion_id', 'partido_id'],
      name: 'unique_participacion_partido',
    },
    {
      fields: ['participacion_id'],
    },
    {
      fields: ['partido_id'],
    },
    {
      fields: ['prediccion'],
    },
    {
      fields: ['acierto'],
    },
  ],
});

/**
 * Métodos de instancia
 */

// Verificar acierto
Pick.prototype.verificarAcierto = function() {
  if (this.resultado_real === null) return null;
  return this.prediccion === this.resultado_real;
};

// Actualizar resultado y verificar acierto
Pick.prototype.actualizarResultado = async function(resultadoReal) {
  const acierto = this.prediccion === resultadoReal;
  return this.update({
    resultado_real: resultadoReal,
    acierto,
  });
};

// Obtener datos públicos
Pick.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    participacion_id: this.participacion_id,
    partido_id: this.partido_id,
    prediccion: this.prediccion,
    resultado_real: this.resultado_real,
    acierto: this.acierto,
    marcador_local_predicho: this.marcador_local_predicho,
    marcador_visitante_predicho: this.marcador_visitante_predicho,
    confianza: this.confianza,
    created_at: this.created_at,
    updated_at: this.updated_at,
  };
};

/**
 * Métodos estáticos
 */

// Obtener picks de una participación
Pick.findByParticipacion = async function(participacionId, options = {}) {
  return this.findAll({
    where: { participacion_id: participacionId },
    ...options,
  });
};

// Obtener picks de un partido
Pick.findByPartido = async function(partidoId, options = {}) {
  return this.findAll({
    where: { partido_id: partidoId },
    ...options,
  });
};

// Contar aciertos de una participación
Pick.contarAciertos = async function(participacionId) {
  return this.count({
    where: {
      participacion_id: participacionId,
      acierto: true,
    },
  });
};

// Obtener distribución de predicciones para un partido
Pick.getDistribucionPredicciones = async function(partidoId) {
  const picks = await this.findAll({
    where: { partido_id: partidoId },
    attributes: [
      'prediccion',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['prediccion'],
    raw: true,
  });

  const distribucion = {
    [PARTIDO_RESULTS.LOCAL]: 0,
    [PARTIDO_RESULTS.VISITANTE]: 0,
    [PARTIDO_RESULTS.EMPATE]: 0,
  };

  picks.forEach(pick => {
    distribucion[pick.prediccion] = parseInt(pick.count);
  });

  return distribucion;
};

module.exports = Pick;
