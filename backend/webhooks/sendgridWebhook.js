const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');
const ReferralService = require('../services/referralService');
const Referral = require('../models/referral');
const ReferralEvent = require('../models/referralEvent');
const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');
const { ExternalServiceError } = require('../utils/errorTypes');
const { verifySendGridSignature } = require('../utils/signatureUtils');
const Ajv = require('ajv');
const eventSchema = require('../schemas/sendgridEventSchema.json');
const ajv = new Ajv();
const validateEvents = ajv.compile(eventSchema);

// Handle email parsing for referral verification
const handleReferralEmail = async (emailData) => {
  try {
    // Parse email data
    const parsedEmail = EmailService.parseReferralEmail(emailData);
    
    if (!parsedEmail) {
      logger.info('Email parsed but not recognized as referral email');
      return null;
    }
    
    // Check if platform email is CC'd
    if (!parsedEmail.isPlatformCCd) {
      logger.info(`Platform email not CC'd in email from ${parsedEmail.senderEmail}`);
      return {
        success: false,
        reason: 'Platform email not CC\'d'
      };
    }
    
    // Check if domains match
    if (!parsedEmail.domainsMatch) {
      logger.info(`Domain mismatch in referral email: ${parsedEmail.senderDomain} vs ${parsedEmail.recipientDomain}`);
      return {
        success: false,
        reason: 'Email domains do not match',
        domains: {
          sender: parsedEmail.senderDomain,
          recipient: parsedEmail.recipientDomain
        }
      };
    }
    
    // Create referral record
    const referral = await ReferralService.createReferralFromEmail(parsedEmail);
    
    if (!referral) {
      logger.info('Could not create referral from email');
      return {
        success: false,
        reason: 'Could not create referral'
      };
    }
    
    // If domains match, verify referral and process reward
    if (parsedEmail.domainsMatch) {
      await ReferralService.verifyReferral(referral._id);
    }
    
    logger.info(`Referral ${referral._id} created from email`);
    
    return {
      success: true,
      referralId: referral._id,
      verified: parsedEmail.domainsMatch
    };
  } catch (error) {
    logger.error(`Error handling referral email: ${error.message}`);
    throw new ExternalServiceError(error.message, 'SendGrid');
  }
};

// SendGrid inbound email parse webhook
router.post('/inbound', async (req, res) => {
  try {
    logger.info('Received incoming email webhook from SendGrid');
    
    // SendGrid sends form data
    const emailData = {
      from: req.body.from,
      to: req.body.to,
      cc: req.body.cc,
      subject: req.body.subject,
      text: req.body.text,
      html: req.body.html,
      messageId: req.body.messageId || `msg_${Date.now()}`
    };
    
    // Process the email for referrals
    const result = await handleReferralEmail(emailData);
    
    // Always return 200 to SendGrid, even if we couldn't process the email
    return responseFormatter.success(res, result || { processed: false });
  } catch (error) {
    logger.error(`SendGrid webhook error: ${error.message}`);
    // Always return 200 to SendGrid to acknowledge receipt
    return responseFormatter.success(res, { error: error.message });
  }
});

// SendGrid event webhook (for tracking email opens, clicks, etc.)
router.post('/events', async (req, res) => {
  try {
    logger.info('Received email events webhook from SendGrid');

    if (!verifySendGridSignature(req, process.env.SENDGRID_WEBHOOK_SECRET)) {
      logger.warn('Invalid SendGrid signature');
      return responseFormatter.error(res, 'Invalid signature', 401);
    }

    const events = req.body;

    if (!validateEvents(events)) {
      logger.warn('Invalid SendGrid event payload');
      return responseFormatter.validationError(res, validateEvents.errors);
    }

    if (Array.isArray(events)) {
      for (const event of events) {
        const eventType = event.event;
        const emailId = event.sg_message_id;

        logger.debug(`SendGrid event ${eventType} for message ${emailId}`);

        let referralId = null;
        const referral = await Referral.findOne({ 'emailDetails.referralEmailId': emailId });
        if (referral) {
          referralId = referral._id;
        }

        await ReferralEvent.create({
          referral: referralId,
          type: eventType,
          data: event
        });
      }
    }

    // Always return 200 to SendGrid
    return responseFormatter.success(res, { processed: true });
  } catch (error) {
    logger.error(`SendGrid events webhook error: ${error.message}`);
    // Always return 200 to SendGrid to acknowledge receipt
    return responseFormatter.success(res, { error: error.message });
  }
});

module.exports = router;