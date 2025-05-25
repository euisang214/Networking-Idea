const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const professionalRoutes = require('./professionals');
const sessionRoutes = require('./sessions');
const messageRoutes = require('./messages');
const notificationRoutes = require('./notifications');
const referralRoutes = require('./referrals');
const paymentRoutes = require('./payments');
const webhookRoutes = require('./webhooks');
const adminRoutes = require('./admin');
const config = require('../config');

// Register API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/professionals', professionalRoutes);
router.use('/sessions', sessionRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/referrals', referralRoutes);
router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: config.app.env
  });
});

module.exports = router;