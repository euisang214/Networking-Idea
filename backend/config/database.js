const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('.');

/**
 * Connect to MongoDB database with retry logic
 */
const connectDatabase = async (retries = 5) => {
  try {
    console.log('Attempting to connect to MongoDB:', config.database.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    const connection = await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });
    
    console.log('MongoDB connected successfully');
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    
    return connection;
  } catch (error) {
    console.error(`MongoDB connection error (${retries} retries left):`, error.message);
    logger.error(`MongoDB connection error: ${error.message}`, { error });
    
    if (retries > 0) {
      console.log(`Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDatabase(retries - 1);
    }
    
    console.error('Failed to connect to MongoDB after all retries');
    process.exit(1);
  }
};

module.exports = connectDatabase;