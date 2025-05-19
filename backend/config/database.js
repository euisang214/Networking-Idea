const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 */
const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
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