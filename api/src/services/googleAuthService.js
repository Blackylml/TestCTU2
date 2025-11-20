/**
 * Google OAuth Service
 * Servicio para autenticación con Google OAuth 2.0
 */

const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS, USER_STATUS } = require('../config/constants');

// Configuración de Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Google OAuth no configurado. Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env');
}

// Cliente OAuth2
const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

/**
 * Generar URL de autorización de Google
 */
const getAuthUrl = () => {
  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Forzar pantalla de consentimiento
  });

  return authUrl;
};

/**
 * Verificar token de Google (para login desde frontend)
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      googleId: payload.sub,
      email: payload.email,
      nombre: payload.name,
      avatar_url: payload.picture,
      email_verified: payload.email_verified,
    };
  } catch (error) {
    console.error('❌ Error verificando token de Google:', error.message);
    throw new AppError('Token de Google inválido', HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Obtener tokens con código de autorización
 */
const getTokensFromCode = async (code) => {
  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Verificar el ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      googleId: payload.sub,
      email: payload.email,
      nombre: payload.name,
      avatar_url: payload.picture,
      email_verified: payload.email_verified,
      tokens,
    };
  } catch (error) {
    console.error('❌ Error obteniendo tokens de Google:', error.message);
    throw new AppError('Error en autenticación con Google', HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Login o registro con Google
 */
const loginWithGoogle = async (googleData) => {
  const { googleId, email, nombre, avatar_url, email_verified } = googleData;

  // Buscar usuario por Google ID
  let user = await User.findOne({
    where: { google_id: googleId },
  });

  // Si no existe, buscar por email
  if (!user) {
    user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    // Si existe usuario con ese email pero sin Google ID, vincular cuentas
    if (user) {
      await user.update({
        google_id: googleId,
        avatar_url: avatar_url || user.avatar_url,
        email_verified: email_verified,
      });
    }
  }

  // Si no existe, crear nuevo usuario
  if (!user) {
    user = await User.create({
      nombre,
      email,
      password: generateRandomPassword(), // Contraseña aleatoria (no usada)
      google_id: googleId,
      avatar_url,
      email_verified: email_verified,
      status: USER_STATUS.ACTIVE,
      rol: 'user',
    });
  }

  // Verificar estado del usuario
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError('Usuario inactivo o suspendido', HTTP_STATUS.FORBIDDEN);
  }

  // Actualizar último login
  await user.update({ last_login: new Date() });

  // Generar tokens JWT
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: user.toPublicJSON(),
    token,
    refreshToken,
    isNewUser: !googleId, // True si es primera vez con Google
  };
};

/**
 * Login con ID Token de Google (para frontend)
 */
const loginWithGoogleToken = async (idToken) => {
  const googleData = await verifyGoogleToken(idToken);
  return loginWithGoogle(googleData);
};

/**
 * Callback de Google OAuth (flujo completo)
 */
const handleGoogleCallback = async (code) => {
  const googleData = await getTokensFromCode(code);
  return loginWithGoogle(googleData);
};

/**
 * Vincular cuenta de Google a usuario existente
 */
const linkGoogleAccount = async (userId, idToken) => {
  const googleData = await verifyGoogleToken(idToken);

  // Verificar que el Google ID no esté usado por otro usuario
  const existingUser = await User.findOne({
    where: { google_id: googleData.googleId },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new AppError(
      'Esta cuenta de Google ya está vinculada a otro usuario',
      HTTP_STATUS.CONFLICT
    );
  }

  // Actualizar usuario
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
  }

  await user.update({
    google_id: googleData.googleId,
    avatar_url: googleData.avatar_url || user.avatar_url,
    email_verified: googleData.email_verified,
  });

  return {
    message: 'Cuenta de Google vinculada exitosamente',
    user: user.toPublicJSON(),
  };
};

/**
 * Desvincular cuenta de Google
 */
const unlinkGoogleAccount = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
  }

  if (!user.google_id) {
    throw new AppError('No hay cuenta de Google vinculada', HTTP_STATUS.BAD_REQUEST);
  }

  // Verificar que el usuario tenga contraseña configurada
  // (para evitar que quede sin forma de login)
  if (!user.password || user.password.startsWith('GOOGLE_')) {
    throw new AppError(
      'Debes configurar una contraseña antes de desvincular tu cuenta de Google',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  await user.update({
    google_id: null,
  });

  return {
    message: 'Cuenta de Google desvinculada exitosamente',
  };
};

/**
 * Generar contraseña aleatoria para usuarios de Google
 */
const generateRandomPassword = () => {
  return `GOOGLE_${require('crypto').randomBytes(32).toString('hex')}`;
};

module.exports = {
  getAuthUrl,
  verifyGoogleToken,
  getTokensFromCode,
  loginWithGoogleToken,
  handleGoogleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
};
