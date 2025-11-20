/**
 * Express Application Setup
 * Configuración principal de Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Middlewares
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const quinielasRoutes = require('./routes/quinielas');
const partidosRoutes = require('./routes/partidos');

// Crear app
const app = express();

/**
 * Middlewares globales
 */

// Security headers
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: process.env.CORS_CREDENTIALS === 'true',
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', apiLimiter);

/**
 * API Routes
 */
const API_VERSION = process.env.API_VERSION || 'v1';

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'QuinielaPro API',
    version: API_VERSION,
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      quinielas: `/api/${API_VERSION}/quinielas`,
      partidos: `/api/${API_VERSION}/partidos`,
    },
    docs: '/api/docs',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/quinielas`, quinielasRoutes);
app.use(`/api/${API_VERSION}/partidos`, partidosRoutes);

/**
 * Error handling
 */

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;
