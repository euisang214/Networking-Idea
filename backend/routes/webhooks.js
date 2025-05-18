/**
 * Webhook routes
 */
const express = require('express');
const stripeWebhook = require('../webhooks/stripeWebhook');
const zoomWebhook = require('../webhooks/zoomWebhook');
const sendgridWebhook = require('../webhooks/sendgridWebhook');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Raw body parser for stripe webhooks
 */
const stripeWebhookParser = express.raw({ type: 'application/json' });

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Webhooks]
 *     description: Receives and processes webhook events from Stripe
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Webhook error
 */
router.post('/stripe', stripeWebhookParser, (req, res) => {
  try {
    // Pass raw body to Stripe webhook handler
    stripeWebhook.handleWebhook(req, res);
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

/**
 * @swagger
 * /webhooks/zoom:
 *   post:
 *     summary: Zoom webhook endpoint
 *     tags: [Webhooks]
 *     description: Receives and processes webhook events from Zoom
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Webhook error
 */
router.post('/zoom', (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-zm-signature'];
    const timestamp = req.headers['x-zm-request-timestamp'];
    const payload = req.body;
    
    const isValid = zoomWebhook.verifyWebhook(signature, timestamp, payload);
    
    if (!isValid) {
      logger.warn('Invalid Zoom webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook
    zoomWebhook.handleWebhook(req, res);
  } catch (error) {
    logger.error('Zoom webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

/**
 * @swagger
 * /webhooks/sendgrid:
 *   post:
 *     summary: SendGrid webhook endpoint
 *     tags: [Webhooks]
 *     description: Receives and processes webhook events from SendGrid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Webhook error
 */
router.post('/sendgrid', (req, res) => {
  try {
    // Verify webhook signature
    const key = req.headers['sendgrid-webhook-key'];
    
    if (key !== process.env.SENDGRID_WEBHOOK_KEY) {
      logger.warn('Invalid SendGrid webhook key');
      return res.status(401).json({ error: 'Invalid key' });
    }
    
    // Process webhook
    sendgridWebhook.handleWebhook(req, res);
  } catch (error) {
    logger.error('SendGrid webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

module.exports = router;
