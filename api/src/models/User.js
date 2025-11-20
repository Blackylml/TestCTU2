/**
 * User Model
 * Modelo de usuarios del sistema
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { USER_ROLES, USER_STATUS } = require('../config/constants');

const User = sequelize.define('User', {
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
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres',
      },
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Este email ya está registrado',
    },
    validate: {
      isEmail: {
        msg: 'Email inválido',
      },
      notEmpty: {
        msg: 'El email es requerido',
      },
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La contraseña es requerida',
      },
      len: {
        args: [6, 255],
        msg: 'La contraseña debe tener al menos 6 caracteres',
      },
    },
  },
  rol: {
    type: DataTypes.ENUM(...Object.values(USER_ROLES)),
    defaultValue: USER_ROLES.USER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(USER_STATUS)),
    defaultValue: USER_STATUS.ACTIVE,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Estadísticas del usuario
  total_participaciones: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_ganadas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_ganado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_invertido: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Seguridad
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lock_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
    {
      fields: ['rol'],
    },
    {
      fields: ['status'],
    },
  ],
  hooks: {
    // Hash password antes de crear
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password antes de actualizar si cambió
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

/**
 * Métodos de instancia
 */

// Comparar password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Verificar si la cuenta está bloqueada
User.prototype.isLocked = function() {
  return !!(this.lock_until && this.lock_until > Date.now());
};

// Incrementar intentos de login
User.prototype.incrementLoginAttempts = async function() {
  const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const LOCK_TIME = parseInt(process.env.LOCK_TIME) || 900000; // 15 minutos

  if (this.lock_until && this.lock_until < Date.now()) {
    return this.update({
      login_attempts: 1,
      lock_until: null,
    });
  }

  const updates = {
    login_attempts: this.login_attempts + 1,
  };

  if (this.login_attempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.lock_until = Date.now() + LOCK_TIME;
  }

  return this.update(updates);
};

// Reset intentos de login
User.prototype.resetLoginAttempts = async function() {
  return this.update({
    login_attempts: 0,
    lock_until: null,
    last_login: new Date(),
  });
};

// Obtener datos públicos del usuario
User.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    nombre: this.nombre,
    email: this.email,
    rol: this.rol,
    status: this.status,
    telefono: this.telefono,
    avatar_url: this.avatar_url,
    total_participaciones: this.total_participaciones,
    total_ganadas: this.total_ganadas,
    total_ganado: parseFloat(this.total_ganado),
    total_invertido: parseFloat(this.total_invertido),
    created_at: this.created_at,
  };
};

/**
 * Métodos estáticos
 */

// Buscar por email
User.findByEmail = async function(email) {
  return this.findOne({
    where: { email: email.toLowerCase().trim() },
  });
};

// Buscar usuarios activos
User.findActive = async function(options = {}) {
  return this.findAll({
    where: { status: USER_STATUS.ACTIVE },
    ...options,
  });
};

module.exports = User;
