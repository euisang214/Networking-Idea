/**
 * Server entry point
 */
require('dotenv').config();
const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');
const db = require('./db');
const cronJobs = require('./cron');

// Get port from environment
const port = process.env.PORT || 8000;
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Database connection handling
const startServer = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1+1 AS result');
    logger.info('Database connection established successfully');
    
    // Start the server
    server.listen(port);
    logger.info(`Server started on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    
    // Initialize cron jobs
    cronJobs.initJobs();
    logger.info('Background jobs initialized');
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

// Server event listeners
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server gracefully');
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close database connection
  try {
    await db.destroy();
    logger.info('Database connections closed');
  } catch (err) {
    logger.error('Error closing database connections:', err);
  }
  
  // Exit process
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
