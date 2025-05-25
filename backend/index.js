const config = require('./config');
const { server } = require('./app');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');

// Set port
const PORT = config.app.port;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running in ${config.app.env} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, { error });
    process.exit(1);
  }
};

startServer();