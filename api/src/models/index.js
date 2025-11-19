/**
 * Models Index
 * Centraliza todos los modelos y sus relaciones
 */

const { sequelize } = require('../config/database');
const User = require('./User');
const Quiniela = require('./Quiniela');
const Partido = require('./Partido');
const Participacion = require('./Participacion');
const Pick = require('./Pick');

/**
 * Definir relaciones entre modelos
 */

// User <-> Quiniela (creador)
User.hasMany(Quiniela, {
  foreignKey: 'creador_id',
  as: 'quinielas_creadas',
});
Quiniela.belongsTo(User, {
  foreignKey: 'creador_id',
  as: 'creador',
});

// Quiniela <-> Partido
Quiniela.hasMany(Partido, {
  foreignKey: 'quiniela_id',
  as: 'partidos',
  onDelete: 'CASCADE',
});
Partido.belongsTo(Quiniela, {
  foreignKey: 'quiniela_id',
  as: 'quiniela',
});

// User <-> Participacion
User.hasMany(Participacion, {
  foreignKey: 'user_id',
  as: 'participaciones',
  onDelete: 'CASCADE',
});
Participacion.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'usuario',
});

// Quiniela <-> Participacion
Quiniela.hasMany(Participacion, {
  foreignKey: 'quiniela_id',
  as: 'participaciones',
  onDelete: 'CASCADE',
});
Participacion.belongsTo(Quiniela, {
  foreignKey: 'quiniela_id',
  as: 'quiniela',
});

// Participacion <-> Pick
Participacion.hasMany(Pick, {
  foreignKey: 'participacion_id',
  as: 'picks',
  onDelete: 'CASCADE',
});
Pick.belongsTo(Participacion, {
  foreignKey: 'participacion_id',
  as: 'participacion',
});

// Partido <-> Pick
Partido.hasMany(Pick, {
  foreignKey: 'partido_id',
  as: 'picks',
  onDelete: 'CASCADE',
});
Pick.belongsTo(Partido, {
  foreignKey: 'partido_id',
  as: 'partido',
});

/**
 * Relación Many-to-Many entre User y Quiniela a través de Participacion
 */
User.belongsToMany(Quiniela, {
  through: Participacion,
  foreignKey: 'user_id',
  otherKey: 'quiniela_id',
  as: 'quinielas_participadas',
});

Quiniela.belongsToMany(User, {
  through: Participacion,
  foreignKey: 'quiniela_id',
  otherKey: 'user_id',
  as: 'participantes',
});

/**
 * Exportar todos los modelos y la instancia de sequelize
 */
module.exports = {
  sequelize,
  User,
  Quiniela,
  Partido,
  Participacion,
  Pick,
};
