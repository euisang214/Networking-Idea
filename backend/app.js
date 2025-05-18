/**
 * Main application setup
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');

// Import configuration
const passportConfig = require('./config/passport');
const middlewareConfig = require('./config/middleware');
const swaggerSpec = require('./config/swagger');

// Import routes
const apiRoutes = require('./routes/api');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');

// Create Express app
const app = express();

// Apply security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply general middlewares
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport and use authentication strategies
app.use(passport.initialize());
passportConfig(passport);

// Apply middleware configuration
middlewareConfig(app);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Service is running',
    timestamp: new Date()
  });
});

// Error handler must be after all middleware and routes
app.use(errorHandler);

module.exports = app;
