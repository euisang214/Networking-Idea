const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('.');

/**
 * Connect to MongoDB database
 */
const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    
    return connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`, { error });
    process.exit(1);
  }
};

module.exports = connectDatabase;