/**
 * Server Entry Point
 * Punto de entrada principal del servidor
 */

require('dotenv').config();
const app = require('./src/app');
const { testConnection, syncDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Iniciar servidor
 */
const startServer = async () => {
  try {
    console.log('🚀 Iniciando QuinielaPro API...');
    console.log(`📦 Entorno: ${NODE_ENV}`);

    // Probar conexión a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Sincronizar modelos (solo en desarrollo)
    if (NODE_ENV === 'development') {
      console.log('🔄 Sincronizando modelos...');
      await syncDatabase({ alter: true });
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('✅ Servidor iniciado exitosamente');
      console.log(`🌐 API disponible en: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('Presiona CTRL+C para detener el servidor');
    });

    // Manejo de errores del servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} ya está en uso`);
      } else {
        console.error('❌ Error del servidor:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM recibido. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT recibido. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();
