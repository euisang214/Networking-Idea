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

// Replace the handleReferralEmail function with this:
const handleReferralEmail = async (emailData) => {
  try {
    logger.info('Processing referral email', { from: emailData.from, to: emailData.to });
    
    // Extract sender domain and recipient domain
    const senderEmail = emailData.from;
    const recipientEmail = emailData.to;
    const ccEmails = emailData.cc ? emailData.cc.split(',').map(e => e.trim()) : [];
    
    // Check if platform email was CC'd
    const platformEmail = process.env.PLATFORM_EMAIL || 'referrals@mentorconnect.com';
    const platformCCd = ccEmails.includes(platformEmail);
    
    if (!platformCCd) {
      logger.info('Platform not CC\'d on email, skipping referral processing');
      return { processed: false, reason: 'Platform not CC\'d' };
    }
    
    // Extract domains
    const senderDomain = senderEmail.split('@')[1];
    const recipientDomain = recipientEmail.split('@')[1];
    
    // Verify domains match (same company)
    if (senderDomain !== recipientDomain) {
      logger.info('Email domains do not match', { senderDomain, recipientDomain });
      return { processed: false, reason: 'Domain mismatch' };
    }
    
    // Find candidate mentioned in email body
    const User = require('../models/user');
    const candidate = await User.findCandidateInEmailContent(emailData.text || emailData.html);
    
    if (!candidate) {
      logger.info('No candidate found in email content');
      return { processed: false, reason: 'No candidate found' };
    }
    
    // Find professional by sender email
    const professional = await User.findOne({ 
      email: senderEmail.toLowerCase(),
      userType: 'professional'
    }).populate('professionalProfile');
    
    if (!professional || !professional.professionalProfile) {
      logger.info('Professional not found', { senderEmail });
      return { processed: false, reason: 'Professional not found' };
    }
    
    // Create referral record
    const Referral = require('../models/referral');
    const referral = new Referral({
      professional: professional.professionalProfile._id,
      candidate: candidate._id,
      referralType: 'email',
      status: 'verified', // Automatically verified!
      emailDetails: {
        senderEmail,
        senderDomain,
        recipientEmail,
        recipientDomain,
        referralEmailId: emailData.messageId,
        ccEmails,
        subject: emailData.subject,
        timestamp: new Date()
      },
      emailDomainVerified: true,
      verificationDetails: {
        verifiedAt: new Date(),
        verificationMethod: 'email-domain-auto',
        verifiedBy: null // System verification
      }
    });
    
    await referral.save();
    
    // **AUTOMATIC PAYOUT PROCESSING**
    const PaymentService = require('../services/paymentService');
    const payoutResult = await PaymentService.processReferralPayment(referral._id);
    
    logger.info(`Referral automatically processed and paid: ${referral._id}`, payoutResult);
    
    return { 
      processed: true, 
      referralId: referral._id,
      payoutAmount: payoutResult.amount,
      platformFee: payoutResult.platformFee
    };
    
  } catch (error) {
    logger.error(`Error processing referral email: ${error.message}`);
    throw error;
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