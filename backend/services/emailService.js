const nodemailer = require('nodemailer');
const sendgrid = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');
const config = require('../config');
if (config.app.mockIntegrations) {
  module.exports = require("./mocks/emailService");
} else {
  class EmailService {
    constructor() {
      this.from = config.email.from;
      this.platformEmail = config.email.platformEmail;
      
      // Set up SendGrid if API key is available
      if (config.email.sendgridApiKey) {
        sendgrid.setApiKey(config.email.sendgridApiKey);
        this.useSendGrid = true;
      } else {
        // Fallback to standard SMTP
        this.useSendGrid = false;
        this.transporter = nodemailer.createTransport({
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure,
          auth: {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass
          }
        });
      }
    }

    // Helper to load and compile email templates
    async loadTemplate(templateName) {
      const filePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      const source = fs.readFileSync(filePath, 'utf-8');
      return handlebars.compile(source);
    }

    // Send email using either SendGrid or SMTP
    async sendEmail(to, subject, templateName, templateVars) {
      try {
        const template = await this.loadTemplate(templateName);
        const html = template(templateVars);
        
        const mailOptions = {
          from: this.from,
          to,
          subject,
          html,
          text: this.convertHtmlToText(html)
        };
        
        if (this.useSendGrid) {
          await sendgrid.send(mailOptions);
        } else {
          await this.transporter.sendMail(mailOptions);
        }
        
        logger.info(`Email sent to ${to} with subject: ${subject}`);
        return true;
      } catch (error) {
        logger.error(`Failed to send email: ${error.message}`);
        throw new Error(`Email sending failed: ${error.message}`);
      }
    }

    // Extract raw email address from possible name/address formats
    extractAddress(value) {
      if (!value) return null;
      if (typeof value === 'object') {
        return value.email || value.address || null;
      }
      const match = value.match(/<?([^<>\s]+@[^<>\s]+)>?/);
      return match ? match[1].trim() : value.trim();
    }

    // Extract domain from email address
    extractDomain(email) {
      const addr = this.extractAddress(email);
      if (!addr) return null;

      const parts = addr.split('@');
      if (parts.length !== 2) return null;

      return parts[1].toLowerCase();
    }

    // Validate if sender and recipient domains match
    validateDomainMatch(senderEmail, recipientEmail) {
      const senderDomain = this.extractDomain(senderEmail);
      const recipientDomain = this.extractDomain(recipientEmail);

      if (!senderDomain || !recipientDomain) {
        return false;
      }

      return senderDomain === recipientDomain;
    }

    // Send session confirmation emails
    async sendSessionConfirmation(session, professional, user) {
      // Send to user
      await this.sendEmail(
        user.email,
        'Your networking session is confirmed',
        'session-confirmation-user',
        {
          userName: `${user.firstName} ${user.lastName}`,
          professionalName: `${professional.user.firstName} ${professional.user.lastName}`,
          professionalTitle: professional.title,
          sessionDate: new Date(session.startTime).toLocaleDateString(),
          sessionTime: new Date(session.startTime).toLocaleTimeString(),
          sessionDuration: (session.endTime - session.startTime) / (1000 * 60), // minutes
          zoomLink: session.zoomMeetingUrl,
          zoomPassword: session.zoomMeetingPassword,
          sessionId: session._id
        }
      );
      
      // Send to professional
      await this.sendEmail(
        professional.user.email,
        'New session booking confirmed',
        'session-confirmation-professional',
        {
          professionalName: `${professional.user.firstName} ${professional.user.lastName}`,
          sessionDate: new Date(session.startTime).toLocaleDateString(),
          sessionTime: new Date(session.startTime).toLocaleTimeString(),
          sessionDuration: (session.endTime - session.startTime) / (1000 * 60), // minutes
          zoomStartLink: session.zoomStartUrl,
          sessionId: session._id
        }
      );
      
      return true;
    }

    // Send payment confirmation emails
    async sendPaymentConfirmation(payment, session, user) {
      return this.sendEmail(
        user.email,
        'Payment Confirmation for Your Networking Session',
        'payment-confirmation',
        {
          userName: `${user.firstName} ${user.lastName}`,
          amount: payment.amount,
          currency: payment.currency,
          paymentDate: new Date(payment.createdAt).toLocaleDateString(),
          sessionDate: new Date(session.startTime).toLocaleDateString(),
          sessionId: session._id,
          paymentId: payment._id,
          receiptUrl: payment.receiptUrl
        }
      );
    }

    // Send payout notification to professional
    async sendPayoutNotification(payout, professional) {
      return this.sendEmail(
        professional.user.email,
        'Your Payout Has Been Processed',
        'payout-notification',
        {
          professionalName: `${professional.user.firstName} ${professional.user.lastName}`,
          amount: payout.amount,
          currency: payout.currency,
          payoutDate: new Date(payout.createdAt).toLocaleDateString(),
          accountLast4: payout.destination.last4,
          estimatedArrivalDate: new Date(payout.arrivalDate).toLocaleDateString(),
          payoutId: payout._id
        }
      );
    }

    // Convert HTML to plain text for email clients that prefer it
    convertHtmlToText(html) {
      return html
        .replace(/<style[^>]*>.*?<\/style>/gs, '')
        .replace(/<script[^>]*>.*?<\/script>/gs, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  module.exports = new EmailService();
}