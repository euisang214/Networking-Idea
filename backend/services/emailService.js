/**
 * Email service using SendGrid
 */
const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email
 * @param {Object} emailData - Email data
 * @returns {Object} SendGrid response
 */
const sendEmail = async (emailData) => {
  try {
    const msg = {
      to: emailData.to,
      from: emailData.from || process.env.SENDGRID_FROM_EMAIL,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    };
    
    if (emailData.templateId) {
      msg.templateId = emailData.templateId;
      msg.dynamicTemplateData = emailData.dynamicTemplateData;
    }
    
    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send welcome email to a new user
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendWelcomeEmail = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: 'Welcome to MentorConnect',
      text: `Hi ${data.firstName},\n\nWelcome to MentorConnect! We're excited to have you join our platform.\n\nTo get started, complete your profile and start discovering professionals in your field.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Welcome to MentorConnect!</h2>
          <p>Hi ${data.firstName},</p>
          <p>We're excited to have you join our platform. MentorConnect helps you connect with industry professionals for career guidance and networking opportunities.</p>
          <p>To get started:</p>
          <ol>
            <li>Complete your profile</li>
            <li>Browse professionals in your industry</li>
            <li>Book sessions with mentors who can help guide your career</li>
          </ol>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    throw error;
  }
};

/**
 * Send verification email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendVerificationEmail = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: 'Verify Your Email Address',
      text: `Hi ${data.firstName},\n\nPlease verify your email address by clicking the link below:\n\n${data.verificationLink}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Verify Your Email Address</h2>
          <p>Hi ${data.firstName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${data.verificationLink}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </p>
          <p style="color: #718096; font-size: 14px;">This link will expire in 24 hours.</p>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #4a5568;">${data.verificationLink}</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendPasswordResetEmail = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: 'Reset Your Password',
      text: `Hi ${data.firstName},\n\nYou recently requested to reset your password. Please click the link below to create a new password:\n\n${data.resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can ignore this email.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Reset Your Password</h2>
          <p>Hi ${data.firstName},</p>
          <p>You recently requested to reset your password. Please click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${data.resetLink}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </p>
          <p style="color: #718096; font-size: 14px;">This link will expire in 1 hour.</p>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #4a5568;">${data.resetLink}</p>
          <p>If you didn't request a password reset, you can ignore this email.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Send session confirmation email to seeker
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendSessionConfirmation = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return await sendEmail({
      to,
      subject: 'Your Session is Confirmed',
      text: `Hi ${data.firstName},\n\nYour session with ${data.professionalName} has been confirmed for ${formattedDate} at ${formattedTime}. The session will last ${data.duration} minutes.\n\nJoin the session: ${data.zoomUrl || 'Link will be provided closer to the session time'}\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Your Session is Confirmed</h2>
          <p>Hi ${data.firstName},</p>
          <p>Your session with <strong>${data.professionalName}</strong> has been confirmed.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
            <p style="margin: 0;"><strong>Professional:</strong> ${data.professionalName}</p>
          </div>
          ${data.zoomUrl ? `
          <p style="text-align: center;">
            <a href="${data.zoomUrl}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Join Zoom Meeting</a>
          </p>
          ` : `
          <p>A meeting link will be provided closer to the session time.</p>
          `}
          <p>Please be on time for your session. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send session confirmation email:', error);
    throw error;
  }
};

/**
 * Send session notification email to professional
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendSessionNotification = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return await sendEmail({
      to,
      subject: 'New Session Booked',
      text: `Hi ${data.firstName},\n\nA new session has been booked with you by ${data.seekerName} for ${formattedDate} at ${formattedTime}. The session will last ${data.duration} minutes.\n\nJoin the session: ${data.zoomUrl || 'Link will be provided closer to the session time'}\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">New Session Booked</h2>
          <p>Hi ${data.firstName},</p>
          <p>A new session has been booked with you by <strong>${data.seekerName}</strong>.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
            <p style="margin: 0;"><strong>Seeker:</strong> ${data.seekerName}</p>
          </div>
          ${data.zoomUrl ? `
          <p style="text-align: center;">
            <a href="${data.zoomUrl}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Join Zoom Meeting</a>
          </p>
          ` : `
          <p>A meeting link will be provided closer to the session time.</p>
          `}
          <p>Please ensure you're available at the scheduled time. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send session notification email:', error);
    throw error;
  }
};

/**
 * Send session reminder email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendSessionReminder = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const subject = data.isSeeker
      ? `Reminder: Session with ${data.professionalName} Tomorrow`
      : `Reminder: Session with ${data.seekerName} Tomorrow`;
    
    const contactName = data.isSeeker ? data.professionalName : data.seekerName;
    
    return await sendEmail({
      to,
      subject,
      text: `Hi ${data.firstName},\n\nThis is a reminder that you have a session scheduled with ${contactName} for tomorrow, ${formattedDate} at ${formattedTime}. The session will last ${data.duration} minutes.\n\nJoin the session: ${data.zoomUrl || 'Link will be provided closer to the session time'}\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Session Reminder</h2>
          <p>Hi ${data.firstName},</p>
          <p>This is a reminder that you have a session scheduled with <strong>${contactName}</strong> for tomorrow.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
            <p style="margin: 0;"><strong>${data.isSeeker ? 'Professional' : 'Seeker'}:</strong> ${contactName}</p>
          </div>
          ${data.zoomUrl ? `
          <p style="text-align: center;">
            <a href="${data.zoomUrl}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Join Zoom Meeting</a>
          </p>
          ` : `
          <p>A meeting link will be provided closer to the session time.</p>
          `}
          <p>Please be on time for your session. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send session reminder email:', error);
    throw error;
  }
};

/**
 * Send session update email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendSessionUpdate = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const contactName = data.professionalName || data.seekerName;
    
    return await sendEmail({
      to,
      subject: 'Session Update',
      text: `Hi ${data.firstName},\n\nYour session with ${contactName} has been updated. The session is now scheduled for ${formattedDate} at ${formattedTime}. The session will last ${data.duration} minutes.\n\nJoin the session: ${data.zoomUrl || 'Link will be provided closer to the session time'}\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Session Update</h2>
          <p>Hi ${data.firstName},</p>
          <p>Your session with <strong>${contactName}</strong> has been updated.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>New Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>New Time:</strong> ${formattedTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
            <p style="margin: 0;"><strong>${data.professionalName ? 'Professional' : 'Seeker'}:</strong> ${contactName}</p>
          </div>
          ${data.zoomUrl ? `
          <p style="text-align: center;">
            <a href="${data.zoomUrl}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Join Zoom Meeting</a>
          </p>
          ` : `
          <p>A meeting link will be provided closer to the session time.</p>
          `}
          <p>Please make sure to update your calendar with this new information.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send session update email:', error);
    throw error;
  }
};

/**
 * Send session cancellation email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendSessionCancellation = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const contactName = data.professionalName || data.seekerName;
    
    return await sendEmail({
      to,
      subject: 'Session Cancellation',
      text: `Hi ${data.firstName},\n\nYour session with ${contactName} scheduled for ${formattedDate} at ${formattedTime} has been cancelled.\n\nReason: ${data.reason}\n\nYou can book another session through the platform.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Session Cancellation</h2>
          <p>Hi ${data.firstName},</p>
          <p>Your session with <strong>${contactName}</strong> has been cancelled.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Cancelled Session:</strong></p>
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>${data.professionalName ? 'Professional' : 'Seeker'}:</strong> ${contactName}</p>
            <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
          </div>
          <p>You can book another session through the platform.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send session cancellation email:', error);
    throw error;
  }
};

/**
 * Send session feedback request email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendSessionFeedbackRequest = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return await sendEmail({
      to,
      subject: 'Share Your Feedback',
      text: `Hi ${data.firstName},\n\nThank you for attending the session with ${data.professionalName} on ${formattedDate}. We hope it was valuable for you.\n\nPlease take a moment to provide your feedback, which helps improve the quality of our platform and provides valuable insights to the professional.\n\nShare your feedback: ${data.feedbackLink}\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Share Your Feedback</h2>
          <p>Hi ${data.firstName},</p>
          <p>Thank you for attending the session with <strong>${data.professionalName}</strong> on ${formattedDate}. We hope it was valuable for you.</p>
          <p>Please take a moment to provide your feedback, which helps improve the quality of our platform and provides valuable insights to the professional.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.feedbackLink}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Share Your Feedback</a>
          </p>
          <p>Your feedback is important and will help us improve the platform for everyone.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send feedback request email:', error);
    throw error;
  }
};

/**
 * Send feedback notification email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendFeedbackNotification = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create star rating HTML
    const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
    
    return await sendEmail({
      to,
      subject: 'You Received Feedback',
      text: `Hi ${data.firstName},\n\nYou've received feedback for your session on ${formattedDate}.\n\nRating: ${data.rating}/5\n\nYou can view the detailed feedback here: ${data.feedbackUrl}\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">You Received Feedback</h2>
          <p>Hi ${data.firstName},</p>
          <p>You've received feedback for your session on ${formattedDate}.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Rating:</strong></p>
            <p style="margin: 0; font-size: 24px; color: #ecc94b;">${stars} (${data.rating}/5)</p>
          </div>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.feedbackUrl}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">View Detailed Feedback</a>
          </p>
          <p>Feedback helps you improve your mentoring and showcases your expertise to other seekers.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send feedback notification email:', error);
    throw error;
  }
};

/**
 * Send no-show notification email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendNoShowNotification = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return await sendEmail({
      to,
      subject: 'Missed Session Notification',
      text: `Hi ${data.firstName},\n\nThis is to inform you that you missed your scheduled session with ${data.professionalName} on ${formattedDate} at ${formattedTime}.\n\nIf this was a mistake or you had an emergency, please contact us or the professional to discuss rescheduling options.\n\nPlease note that frequent no-shows may affect your account status.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Missed Session Notification</h2>
          <p>Hi ${data.firstName},</p>
          <p>This is to inform you that you missed your scheduled session with <strong>${data.professionalName}</strong> on ${formattedDate} at ${formattedTime}.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Missed Session:</strong></p>
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 0;"><strong>Professional:</strong> ${data.professionalName}</p>
          </div>
          <p>If this was a mistake or you had an emergency, please contact us or the professional to discuss rescheduling options.</p>
          <p>Please note that frequent no-shows may affect your account status.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send no-show notification email:', error);
    throw error;
  }
};

/**
 * Send referral invitation email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendReferralInvitation = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: `${data.referrerName} Invited You to MentorConnect`,
      text: `Hi there,\n\n${data.referrerName} thinks you would benefit from MentorConnect, a platform that connects professionals for mentoring and networking.\n\nJoin using this referral link: ${data.referralLink}\n\nBy joining through this link, both you and ${data.referrerName} will receive benefits after your first session.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">${data.referrerName} Invited You to MentorConnect</h2>
          <p>Hi there,</p>
          <p><strong>${data.referrerName}</strong> thinks you would benefit from MentorConnect, a platform that connects professionals for mentoring and networking.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">MentorConnect helps you connect with industry professionals for career guidance, networking, and mentorship opportunities.</p>
          </div>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.referralLink}" style="display: inline-block; background-color: #4299e1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Join MentorConnect</a>
          </p>
          <p>By joining through this link, both you and ${data.referrerName} will receive benefits after your first session.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send referral invitation email:', error);
    throw error;
  }
};

/**
 * Send referral completed email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendReferralCompleted = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: 'Referral Reward Earned',
      text: `Hi ${data.firstName},\n\nGood news! ${data.referredName} whom you referred to MentorConnect has completed their first session. As a reward, we've added ${data.rewardAmount} credit to your account.\n\nKeep referring friends and colleagues to earn more rewards.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Referral Reward Earned</h2>
          <p>Hi ${data.firstName},</p>
          <p>Good news! <strong>${data.referredName}</strong> whom you referred to MentorConnect has completed their first session.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">As a reward, we've added <strong>${data.rewardAmount}</strong> credit to your account.</p>
          </div>
          <p>Keep referring friends and colleagues to earn more rewards.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send referral completed email:', error);
    throw error;
  }
};

/**
 * Send payment confirmation email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendPaymentConfirmation = async (to, data) => {
  try {
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return await sendEmail({
      to,
      subject: 'Payment Confirmation',
      text: `Hi ${data.firstName},\n\nYour payment of ${data.amount} for the session with ${data.professionalName} on ${formattedDate} at ${formattedTime} has been confirmed.\n\nPayment Details:\n- Transaction ID: ${data.transactionId}\n- Amount: ${data.amount}\n- Date: ${new Date().toLocaleDateString()}\n\nThank you for using MentorConnect.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Payment Confirmation</h2>
          <p>Hi ${data.firstName},</p>
          <p>Your payment has been confirmed for the session with <strong>${data.professionalName}</strong>.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Payment Details:</strong></p>
            <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> ${data.amount}</p>
            <p style="margin: 0 0 10px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Session Date:</strong> ${formattedDate}</p>
            <p style="margin: 0;"><strong>Session Time:</strong> ${formattedTime}</p>
          </div>
          <p>Thank you for using MentorConnect.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send payment confirmation email:', error);
    throw error;
  }
};

/**
 * Send payment refund email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendPaymentRefund = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: 'Payment Refund Confirmation',
      text: `Hi ${data.firstName},\n\nYour payment of ${data.amount} for the session with ${data.professionalName} has been refunded.\n\nRefund Details:\n- Transaction ID: ${data.transactionId}\n- Amount Refunded: ${data.amount}\n- Refund Date: ${new Date().toLocaleDateString()}\n- Reason: ${data.reason}\n\nThe refunded amount should appear in your account within 5-7 business days, depending on your payment method and bank processing times.\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Payment Refund Confirmation</h2>
          <p>Hi ${data.firstName},</p>
          <p>Your payment for the session with <strong>${data.professionalName}</strong> has been refunded.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Refund Details:</strong></p>
            <p style="margin: 0 0 10px 0;"><strong>Amount Refunded:</strong> ${data.amount}</p>
            <p style="margin: 0 0 10px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p style="margin: 0 0 10px 0;"><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
          </div>
          <p>The refunded amount should appear in your account within 5-7 business days, depending on your payment method and bank processing times.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send payment refund email:', error);
    throw error;
  }
};

/**
 * Send payout notification email
 * @param {string} to - Recipient email
 * @param {Object} data - Template data
 * @returns {Object} SendGrid response
 */
exports.sendPayoutNotification = async (to, data) => {
  try {
    return await sendEmail({
      to,
      subject: 'Payout Sent',
      text: `Hi ${data.firstName},\n\nA payout of ${data.amount} has been sent to your account. This payment covers earnings from ${data.sessionCount} completed sessions.\n\nPayout Details:\n- Amount: ${data.amount}\n- Transaction ID: ${data.transactionId}\n- Date: ${new Date().toLocaleDateString()}\n\nThe funds should appear in your account within 3-5 business days, depending on your bank processing times.\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nThe MentorConnect Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Payout Sent</h2>
          <p>Hi ${data.firstName},</p>
          <p>A payout has been sent to your account. This payment covers earnings from <strong>${data.sessionCount} completed sessions</strong>.</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Payout Details:</strong></p>
            <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> ${data.amount}</p>
            <p style="margin: 0 0 10px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>The funds should appear in your account within 3-5 business days, depending on your bank processing times.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>The MentorConnect Team</p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send payout notification email:', error);
    throw error;
  }
};
