/**
 * Notification Service
 * Servicio de notificaciones (preparado para futuro)
 */

/**
 * Enviar notificación de quiniela creada
 */
const notifyQuinielaCreated = async (quiniela) => {
  // TODO: Implementar envío de notificaciones
  // Puede ser email, push notifications, SMS, etc.
  console.log(`[Notificación] Quiniela creada: ${quiniela.nombre}`);
  return { sent: true };
};

/**
 * Enviar notificación de quiniela próxima a cerrarse
 */
const notifyQuinielaClosing = async (quiniela, participants) => {
  // TODO: Notificar a participantes que la quiniela está por cerrar
  console.log(`[Notificación] Quiniela ${quiniela.nombre} cierra pronto`);
  return { sent: true };
};

/**
 * Enviar notificación de resultados disponibles
 */
const notifyResultadosDisponibles = async (quiniela, participants) => {
  // TODO: Notificar a participantes que hay resultados
  console.log(`[Notificación] Resultados disponibles para ${quiniela.nombre}`);
  return { sent: true };
};

/**
 * Enviar notificación de premio ganado
 */
const notifyPremioGanado = async (user, participacion, premio) => {
  // TODO: Notificar al usuario que ganó un premio
  console.log(`[Notificación] ${user.nombre} ganó $${premio}`);
  return { sent: true };
};

/**
 * Enviar email de bienvenida
 */
const sendWelcomeEmail = async (user) => {
  // TODO: Enviar email de bienvenida
  console.log(`[Email] Bienvenida enviada a ${user.email}`);
  return { sent: true };
};

/**
 * Enviar email de verificación
 */
const sendVerificationEmail = async (user, token) => {
  // TODO: Enviar email con link de verificación
  console.log(`[Email] Verificación enviada a ${user.email}`);
  return { sent: true };
};

/**
 * Enviar email de reset de contraseña
 */
const sendPasswordResetEmail = async (user, token) => {
  // TODO: Enviar email con link de reset
  console.log(`[Email] Reset de contraseña enviado a ${user.email}`);
  return { sent: true };
};

/**
 * Enviar notificación general
 */
const sendNotification = async (userId, type, message, data = {}) => {
  // TODO: Implementar sistema de notificaciones in-app
  console.log(`[Notificación] Para user ${userId}: ${message}`);
  return { sent: true };
};

module.exports = {
  notifyQuinielaCreated,
  notifyQuinielaClosing,
  notifyResultadosDisponibles,
  notifyPremioGanado,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotification,
};
