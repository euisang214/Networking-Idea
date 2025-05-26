const config = require('./config');
const { server } = require('./app');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');

// Set port
const PORT = config.app.port;

console.log('Starting MentorConnect Backend...');
console.log('Environment:', config.app.env);
console.log('Port:', PORT);

// Connect to database and start server
const startServer = async () => {
  try {
    console.log('Connecting to database...');
    // Connect to MongoDB
    await connectDatabase();
    
    console.log('Starting HTTP server...');
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running in ${config.app.env} mode on port ${PORT}`);
      logger.info(`Server running in ${config.app.env} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    logger.error(`Failed to start server: ${error.message}`, { error });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();