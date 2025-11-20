/**
 * JWT Configuration
 * Configuración para tokens JWT
 */

require('dotenv').config();

module.exports = {
  // Secret para firmar tokens
  secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',

  // Expiración del token de acceso
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Secret para refresh tokens
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret',

  // Expiración del refresh token
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Opciones por defecto para firmar tokens
  signOptions: {
    algorithm: 'HS256',
  },

  // Opciones por defecto para verificar tokens
  verifyOptions: {
    algorithms: ['HS256'],
  },
};
