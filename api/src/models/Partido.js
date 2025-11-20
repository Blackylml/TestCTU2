/**
 * Partido Model
 * Modelo de partidos/eventos deportivos
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PARTIDO_STATUS, PARTIDO_RESULTS } = require('../config/constants');

const Partido = sequelize.define('Partido', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  equipo_local: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El equipo local es requerido',
      },
    },
  },
  equipo_visitante: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El equipo visitante es requerido',
      },
    },
  },
  fecha_partido: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Fecha de partido inválida',
      },
    },
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PARTIDO_STATUS)),
    defaultValue: PARTIDO_STATUS.PENDING,
    allowNull: false,
  },
  // Marcadores
  marcador_local: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'El marcador no puede ser negativo',
      },
    },
  },
  marcador_visitante: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'El marcador no puede ser negativo',
      },
    },
  },
  // Resultado (local, visitante, empate)
  resultado: {
    type: DataTypes.ENUM(...Object.values(PARTIDO_RESULTS)),
    allowNull: true,
  },
  // Órden de los partidos en la quiniela
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // Información adicional del partido
  liga: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  jornada: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  estadio: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // ID externo de API deportiva (para futuro)
  external_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  // Metadata adicional
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Datos adicionales del partido (clima, odds, etc.)',
  },
}, {
  tableName: 'partidos',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['quiniela_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['fecha_partido'],
    },
    {
      fields: ['resultado'],
    },
    {
      fields: ['quiniela_id', 'orden'],
    },
  ],
});

/**
 * Métodos de instancia
 */

// Verificar si el partido ha iniciado
Partido.prototype.hasIniciado = function() {
  return new Date() >= new Date(this.fecha_partido);
};

// Verificar si está completado
Partido.prototype.isCompletado = function() {
  return this.status === PARTIDO_STATUS.COMPLETED && this.resultado !== null;
};

// Verificar si está en progreso
Partido.prototype.isEnProgreso = function() {
  return this.status === PARTIDO_STATUS.IN_PROGRESS;
};

// Calcular resultado basado en marcadores
Partido.prototype.calcularResultado = function() {
  if (this.marcador_local === null || this.marcador_visitante === null) {
    return null;
  }

  if (this.marcador_local > this.marcador_visitante) {
    return PARTIDO_RESULTS.LOCAL;
  } else if (this.marcador_visitante > this.marcador_local) {
    return PARTIDO_RESULTS.VISITANTE;
  } else {
    return PARTIDO_RESULTS.EMPATE;
  }
};

// Actualizar resultado automáticamente
Partido.prototype.actualizarResultado = async function() {
  const resultado = this.calcularResultado();
  if (resultado) {
    return this.update({ resultado });
  }
  return this;
};

// Marcar como completado
Partido.prototype.marcarCompletado = async function(marcadorLocal, marcadorVisitante) {
  this.marcador_local = marcadorLocal;
  this.marcador_visitante = marcadorVisitante;
  this.status = PARTIDO_STATUS.COMPLETED;
  this.resultado = this.calcularResultado();
  return this.save();
};

// Obtener datos públicos
Partido.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    quiniela_id: this.quiniela_id,
    equipo_local: this.equipo_local,
    equipo_visitante: this.equipo_visitante,
    fecha_partido: this.fecha_partido,
    status: this.status,
    marcador_local: this.marcador_local,
    marcador_visitante: this.marcador_visitante,
    resultado: this.resultado,
    orden: this.orden,
    liga: this.liga,
    jornada: this.jornada,
    estadio: this.estadio,
    ciudad: this.ciudad,
    has_iniciado: this.hasIniciado(),
    is_completado: this.isCompletado(),
  };
};

/**
 * Métodos estáticos
 */

// Obtener partidos de una quiniela
Partido.findByQuiniela = async function(quinielaId, options = {}) {
  return this.findAll({
    where: { quiniela_id: quinielaId },
    order: [['orden', 'ASC']],
    ...options,
  });
};

// Obtener partidos pendientes
Partido.findPendientes = async function(quinielaId) {
  return this.findAll({
    where: {
      quiniela_id: quinielaId,
      status: PARTIDO_STATUS.PENDING,
    },
    order: [['orden', 'ASC']],
  });
};

// Obtener partidos completados
Partido.findCompletados = async function(quinielaId) {
  return this.findAll({
    where: {
      quiniela_id: quinielaId,
      status: PARTIDO_STATUS.COMPLETED,
    },
    order: [['orden', 'ASC']],
  });
};

module.exports = Partido;
