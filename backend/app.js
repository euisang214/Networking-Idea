const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const configurePassport = require('./config/passport');
const configureMiddleware = require('./config/middleware');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');
const cronJobs = require('./cron');
const metrics = require('./utils/metrics');
const { archiveLogs } = require('./utils/compliance');
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./utils/errorTypes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
configureMiddleware(app);
metrics.init(app);

// Configure passport
configurePassport();

// API routes
app.use('/api', apiRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Any routes not caught by API will load the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Handle unmatched routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Error handling middleware
app.use(errorHandler);

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', socket => {
  logger.info(`Socket.io connection established: ${socket.id}`);
  
  // Join user to personal room
  socket.on('join-user', userId => {
    if (userId) {
      socket.join(`user-${userId}`);
      logger.debug(`User ${userId} joined socket room`);
    }
  });
  
  // Leave user room
  socket.on('leave-user', userId => {
    if (userId) {
      socket.leave(`user-${userId}`);
      logger.debug(`User ${userId} left socket room`);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    logger.debug(`Socket.io connection closed: ${socket.id}`);
  });
});

// Make io available globally
global.io = io;

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { error: err });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { error: err });
  process.exit(1);
});

// Initialize cron jobs
cronJobs.initCronJobs();

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Stop cron jobs
  cronJobs.stopCronJobs();

  // Archive logs for compliance
  await archiveLogs();
  
  // Close server
  if (server.listening) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { app, server };