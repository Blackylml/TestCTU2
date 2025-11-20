/**
 * Quiniela Model
 * Modelo de quinielas deportivas
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { QUINIELA_STATUS, SPORTS } = require('../config/constants');

const Quiniela = sequelize.define('Quiniela', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido',
      },
      len: {
        args: [3, 100],
        msg: 'El nombre debe tener entre 3 y 100 caracteres',
      },
    },
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deporte: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El deporte es requerido',
      },
    },
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'El precio debe ser mayor a 0',
      },
    },
  },
  premio_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'El premio debe ser mayor a 0',
      },
    },
  },
  premio_primero: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  premio_segundo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  premio_tercero: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  max_participantes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  participantes_actuales: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(QUINIELA_STATUS)),
    defaultValue: QUINIELA_STATUS.DRAFT,
    allowNull: false,
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Fecha de inicio inválida',
      },
    },
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Fecha de cierre inválida',
      },
      isAfterInicio(value) {
        if (value <= this.fecha_inicio) {
          throw new Error('La fecha de cierre debe ser posterior a la fecha de inicio');
        }
      },
    },
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Imagen de portada (para futuro)
  imagen_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // ID del creador (admin)
  creador_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  // Estadísticas
  total_recaudado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_premios_pagados: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Configuración adicional
  permitir_cambios_picks: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Permite editar picks antes del cierre',
  },
  notificar_resultados: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Enviar notificaciones cuando haya resultados',
  },
  publico: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Visible en el catálogo público',
  },
  // Metadata adicional (JSON para futuras features)
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Datos adicionales extensibles',
  },
}, {
  tableName: 'quinielas',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['deporte'],
    },
    {
      fields: ['fecha_inicio'],
    },
    {
      fields: ['fecha_cierre'],
    },
    {
      fields: ['creador_id'],
    },
    {
      fields: ['publico'],
    },
  ],
});

/**
 * Métodos de instancia
 */

// Verificar si está abierta para compras
Quiniela.prototype.isAbiertaParaCompras = function() {
  const now = new Date();
  return (
    this.status === QUINIELA_STATUS.ACTIVE &&
    now < new Date(this.fecha_cierre) &&
    (!this.max_participantes || this.participantes_actuales < this.max_participantes)
  );
};

// Verificar si está cerrada
Quiniela.prototype.isCerrada = function() {
  return new Date() >= new Date(this.fecha_cierre);
};

// Verificar si ha iniciado
Quiniela.prototype.hasIniciado = function() {
  return new Date() >= new Date(this.fecha_inicio);
};

// Verificar si está completada
Quiniela.prototype.isCompletada = function() {
  return this.status === QUINIELA_STATUS.COMPLETED;
};

// Verificar si hay cupos disponibles
Quiniela.prototype.hayCuposDisponibles = function() {
  if (!this.max_participantes) return true;
  return this.participantes_actuales < this.max_participantes;
};

// Calcular utilidad
Quiniela.prototype.calcularUtilidad = function() {
  return parseFloat(this.total_recaudado) - parseFloat(this.total_premios_pagados);
};

// Calcular margen de ganancia
Quiniela.prototype.calcularMargen = function() {
  const recaudado = parseFloat(this.total_recaudado);
  if (recaudado === 0) return 0;
  return ((recaudado - parseFloat(this.total_premios_pagados)) / recaudado) * 100;
};

// Obtener datos públicos
Quiniela.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    nombre: this.nombre,
    descripcion: this.descripcion,
    deporte: this.deporte,
    precio: parseFloat(this.precio),
    premio_total: parseFloat(this.premio_total),
    premio_primero: parseFloat(this.premio_primero),
    premio_segundo: parseFloat(this.premio_segundo),
    premio_tercero: parseFloat(this.premio_tercero),
    max_participantes: this.max_participantes,
    participantes_actuales: this.participantes_actuales,
    status: this.status,
    fecha_inicio: this.fecha_inicio,
    fecha_cierre: this.fecha_cierre,
    fecha_fin: this.fecha_fin,
    imagen_url: this.imagen_url,
    publico: this.publico,
    abierta_para_compras: this.isAbiertaParaCompras(),
    cupos_disponibles: this.hayCuposDisponibles(),
    created_at: this.created_at,
  };
};

/**
 * Métodos estáticos
 */

// Obtener quinielas activas
Quiniela.findActive = async function(options = {}) {
  return this.findAll({
    where: {
      status: QUINIELA_STATUS.ACTIVE,
      publico: true,
    },
    ...options,
  });
};

// Obtener quinielas disponibles para compra
Quiniela.findDisponibles = async function(options = {}) {
  const now = new Date();
  return this.findAll({
    where: {
      status: QUINIELA_STATUS.ACTIVE,
      publico: true,
      fecha_cierre: {
        [sequelize.Sequelize.Op.gt]: now,
      },
    },
    ...options,
  });
};

// Obtener quinielas por deporte
Quiniela.findByDeporte = async function(deporte, options = {}) {
  return this.findAll({
    where: { deporte },
    ...options,
  });
};

module.exports = Quiniela;
