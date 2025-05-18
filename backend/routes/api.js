/**
 * Main API routes configuration
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const professionalRoutes = require('./professionals');
const sessionRoutes = require('./sessions');
const paymentRoutes = require('./payments');
const referralRoutes = require('./referrals');
const messageRoutes = require('./messages');
const notificationRoutes = require('./notifications');
const webhookRoutes = require('./webhooks');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/professionals', professionalRoutes);
router.use('/sessions', sessionRoutes);
router.use('/payments', paymentRoutes);
router.use('/referrals', referralRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;
