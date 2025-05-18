/**
 * Database configuration using Knex.js
 */
const knex = require('knex');
const logger = require('../utils/logger');

// Define the database connection configuration
const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'mentor_connect',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 10,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './db/seeds'
  },
  debug: process.env.NODE_ENV === 'development'
};

// Create the Knex instance
const db = knex(config);

// Add event listeners
db.on('query', (data) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`SQL Query: ${data.sql} with ${JSON.stringify(data.bindings)}`);
  }
});

db.on('error', (err) => {
  logger.error('Database error:', err);
});

// Export the database connection
module.exports = db;
