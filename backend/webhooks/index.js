const express = require('express');
const router = express.Router();

// Import webhook handlers
const stripeWebhook = require('./stripeWebhook');
const zoomWebhook = require('./zoomWebhook');
const sendgridWebhook = require('./sendgridWebhook');
const { webhookLimiter } = require('../middlewares/rateLimiter');

// Register webhook routes
router.use(webhookLimiter);
router.use('/stripe', stripeWebhook);
router.use('/zoom', zoomWebhook);
router.use('/sendgrid', sendgridWebhook);

module.exports = router;
