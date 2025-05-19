const logger = require('../utils/logger');
const reminderJob = require('./reminderJob');
const payoutJob = require('./payoutJob');

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  logger.info('Initializing cron jobs');
  
  // Start reminder job
  reminderJob.start();
  logger.info('Session reminder job started');
  
  // Start payout job
  payoutJob.start();
  logger.info('Professional payout job started');
};

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
  logger.info('Stopping cron jobs');
  
  reminderJob.stop();
  logger.info('Session reminder job stopped');
  
  payoutJob.stop();
  logger.info('Professional payout job stopped');
};

module.exports = {
  initCronJobs,
  stopCronJobs
};