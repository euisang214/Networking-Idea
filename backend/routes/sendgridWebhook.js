/**
 * SendGrid webhook handler
 */
const UserModel = require('../models/user');
const ReferralModel = require('../models/referral');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle SendGrid webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
  try {
    const events = req.body;
    logger.info(`Received SendGrid webhook with ${events.length} events`);
    
    // Process each event
    for (const event of events) {
      await processEvent(event);
    }
    
    // Return success response
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('SendGrid webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

/**
 * Process a SendGrid event
 * @param {Object} event - SendGrid event object
 */
async function processEvent(event) {
  try {
    logger.info(`Processing SendGrid event: ${event.event}`);
    
    // Handle different event types
    switch (event.event) {
      case 'delivered':
        // Email was delivered successfully
        // No action needed for most cases
        break;
        
      case 'open':
        // Email was opened
        await handleEmailOpen(event);
        break;
        
      case 'click':
        // Link in email was clicked
        await handleEmailClick(event);
        break;
        
      case 'bounce':
        // Email bounced
        await handleEmailBounce(event);
        break;
        
      case 'dropped':
        // Email was dropped (not delivered)
        await handleEmailDropped(event);
        break;
        
      case 'spamreport':
        // Email was reported as spam
        await handleSpamReport(event);
        break;
        
      case 'unsubscribe':
        // User unsubscribed from emails
        await handleUnsubscribe(event);
        break;
        
      case 'group_unsubscribe':
        // User unsubscribed from a group
        await handleGroupUnsubscribe(event);
        break;
        
      case 'group_resubscribe':
        // User resubscribed to a group
        await handleGroupResubscribe(event);
        break;
        
      case 'processed':
        // Email was processed by SendGrid
        // No action needed for most cases
        break;
        
      case 'deferred':
        // Email was deferred (temporary delivery failure)
        // No action needed for most cases
        break;
        
      default:
        logger.info(`Unhandled SendGrid event type: ${event.event}`);
    }
  } catch (error) {
    logger.error(`Error processing SendGrid event ${event.event}:`, error);
    // Continue processing other events
  }
}

/**
 * Handle email open event
 * @param {Object} event - SendGrid event object
 */
async function handleEmailOpen(event) {
  try {
    // This could be used for analytics
    // For now, we'll just log it
    logger.info(`Email opened by ${event.email}`);
    
    // If this is a referral invitation, you could track it
    if (event.category && event.category.includes('referral_invitation')) {
      await trackReferralEmailOpen(event.email);
    }
  } catch (error) {
    logger.error('Error handling email open event:', error);
    throw error;
  }
}

/**
 * Handle email click event
 * @param {Object} event - SendGrid event object
 */
async function handleEmailClick(event) {
  try {
    // This could be used for analytics
    // For now, we'll just log it
    logger.info(`Email link clicked by ${event.email}: ${event.url}`);
    
    // If this is a referral invitation and the registration link was clicked,
    // you could track it
    if (
      event.category &&
      event.category.includes('referral_invitation') &&
      event.url.includes('/register')
    ) {
      await trackReferralLinkClick(event.email);
    }
  } catch (error) {
    logger.error('Error handling email click event:', error);
    throw error;
  }
}

/**
 * Handle email bounce event
 * @param {Object} event - SendGrid event object
 */
async function handleEmailBounce(event) {
  try {
    logger.warn(`Email bounced for ${event.email}: ${event.reason}`);
    
    // Find user by email
    const user = await UserModel.findByEmail(event.email);
    
    if (user) {
      // Mark user as having delivery issues
      await UserModel.update(user.id, {
        email_status: 'bounced',
        email_status_reason: event.reason
      });
      
      logger.info(`User ${user.id} marked as having bounced email`);
    }
    
    // If this is a referral invitation, mark it as failed
    if (event.category && event.category.includes('referral_invitation')) {
      await markReferralAsFailed(event.email, 'bounced');
    }
  } catch (error) {
    logger.error('Error handling email bounce event:', error);
    throw error;
  }
}

/**
 * Handle email dropped event
 * @param {Object} event - SendGrid event object
 */
async function handleEmailDropped(event) {
  try {
    logger.warn(`Email dropped for ${event.email}: ${event.reason}`);
    
    // Find user by email
    const user = await UserModel.findByEmail(event.email);
    
    if (user) {
      // Mark user as having delivery issues
      await UserModel.update(user.id, {
        email_status: 'dropped',
        email_status_reason: event.reason
      });
      
      logger.info(`User ${user.id} marked as having dropped email`);
    }
    
    // If this is a referral invitation, mark it as failed
    if (event.category && event.category.includes('referral_invitation')) {
      await markReferralAsFailed(event.email, 'dropped');
    }
  } catch (error) {
    logger.error('Error handling email dropped event:', error);
    throw error;
  }
}

/**
 * Handle spam report event
 * @param {Object} event - SendGrid event object
 */
async function handleSpamReport(event) {
  try {
    logger.warn(`Email reported as spam by ${event.email}`);
    
    // Find user by email
    const user = await UserModel.findByEmail(event.email);
    
    if (user) {
      // Mark user as having reported spam
      await UserModel.update(user.id, {
        email_status: 'spam_reported',
        email_opt_out: true
      });
      
      logger.info(`User ${user.id} marked as having reported spam`);
    }
    
    // If this is a referral invitation, mark it as failed
    if (event.category && event.category.includes('referral_invitation')) {
      await markReferralAsFailed(event.email, 'spam_reported');
    }
  } catch (error) {
    logger.error('Error handling spam report event:', error);
    throw error;
  }
}

/**
 * Handle unsubscribe event
 * @param {Object} event - SendGrid event object
 */
async function handleUnsubscribe(event) {
  try {
    logger.info(`User ${event.email} unsubscribed from emails`);
    
    // Find user by email
    const user = await UserModel.findByEmail(event.email);
    
    if (user) {
      // Mark user as unsubscribed
      await UserModel.update(user.id, {
        email_opt_out: true
      });
      
      logger.info(`User ${user.id} marked as unsubscribed`);
    }
  } catch (error) {
    logger.error('Error handling unsubscribe event:', error);
    throw error;
  }
}

/**
 * Handle group unsubscribe event
 * @param {Object} event - SendGrid event object
 */
async function handleGroupUnsubscribe(event) {
  try {
    logger.info(`User ${event.email} unsubscribed from group ${event.asm_group_id}`);
    
    // Find user by email
    const user = await UserModel.findByEmail(event.email);
    
    if (user) {
      // Update user's email preferences based on the unsubscribe group
      // This would depend on your email preference data model
      logger.info(`User ${user.id} unsubscribed from group ${event.asm_group_id}`);
    }
  } catch (error) {
    logger.error('Error handling group unsubscribe event:', error);
    throw error;
  }
}

/**
 * Handle group resubscribe event
 * @param {Object} event - SendGrid event object
 */
async function handleGroupResubscribe(event) {
  try {
    logger.info(`User ${event.email} resubscribed to group ${event.asm_group_id}`);
    
    // Find user by email
    const user = await UserModel.findByEmail(event.email);
    
    if (user) {
      // Update user's email preferences based on the resubscribe group
      // This would depend on your email preference data model
      logger.info(`User ${user.id} resubscribed to group ${event.asm_group_id}`);
    }
  } catch (error) {
    logger.error('Error handling group resubscribe event:', error);
    throw error;
  }
}

/**
 * Track referral email open
 * @param {string} email - Recipient email
 */
async function trackReferralEmailOpen(email) {
  try {
    // Find referral by email
    const referral = await ReferralModel.findByEmail(email);
    
    if (referral && referral.status === 'invited') {
      // Update referral tracking data
      // This would depend on your tracking data model
      logger.info(`Referral invitation opened by ${email}`);
    }
  } catch (error) {
    logger.error('Error tracking referral email open:', error);
    throw error;
  }
}

/**
 * Track referral link click
 * @param {string} email - Recipient email
 */
async function trackReferralLinkClick(email) {
  try {
    // Find referral by email
    const referral = await ReferralModel.findByEmail(email);
    
    if (referral && referral.status === 'invited') {
      // Update referral tracking data
      // This would depend on your tracking data model
      logger.info(`Referral link clicked by ${email}`);
      
      // Notify referrer
      await notificationService.createNotification({
        user_id: referral.referrer_id,
        title: 'Referral Link Clicked',
        content: `Your referral ${email} clicked on the invitation link.`,
        type: 'referral'
      });
    }
  } catch (error) {
    logger.error('Error tracking referral link click:', error);
    throw error;
  }
}

/**
 * Mark referral as failed
 * @param {string} email - Recipient email
 * @param {string} reason - Failure reason
 */
async function markReferralAsFailed(email, reason) {
  try {
    // Find referral by email
    const referral = await ReferralModel.findByEmail(email);
    
    if (referral && referral.status === 'invited') {
      // Update referral status
      // This would depend on your referral data model
      logger.info(`Referral invitation to ${email} failed: ${reason}`);
      
      // Notify referrer
      await notificationService.createNotification({
        user_id: referral.referrer_id,
        title: 'Referral Invitation Failed',
        content: `Your referral invitation to ${email} could not be delivered. Please check the email address and try again.`,
        type: 'referral'
      });
    }
  } catch (error) {
    logger.error('Error marking referral as failed:', error);
    throw error;
  }
}
