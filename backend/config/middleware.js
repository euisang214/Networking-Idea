const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { swaggerSpec, swaggerUi } = require('./swagger');
// The errorHandler middleware should be registered after routes
// so it is imported in app.js instead of here.
// const errorHandler = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Configure Express middleware
 * @param {Express} app - Express application
 */
const configureMiddleware = (app) => {
  // Body parser middleware
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/webhooks/')) {
          req.rawBody = buf.toString();
        }
      }
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Security middleware
  app.use(helmet());
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000'],
    credentials: true
  };
  app.use(cors(corsOptions));
  
  // Rate limiting
  app.use('/api/', apiLimiter);
  
  // Logging middleware
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
  }
  
  // Request logger
  app.use(logger.requestLogger);
  
  // Passport middleware
  app.use(passport.initialize());
  
  // Swagger API docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Error handling middleware is registered in app.js
  // after all routes so that errors from routes are
  // properly handled.
}; 

module.exports = configureMiddleware;
