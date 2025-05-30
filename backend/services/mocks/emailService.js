const logger = require('../../utils/logger');

class MockEmailService {
  async loadTemplate(name) {
    logger.debug('Mock loadTemplate', name);
    return () => `Mock template ${name}`;
  }

  async sendEmail(to, subject, templateName, vars) {
    logger.debug('Mock sendEmail', { to, subject, templateName, vars });
    return true;
  }

  extractDomain(email) {
    return email ? email.split('@')[1] : null;
  }

  validateDomainMatch(a, b) {
    return this.extractDomain(a) === this.extractDomain(b);
  }


  async sendSessionConfirmation() { return true; }
  async sendPaymentConfirmation() { return true; }
  async sendPayoutNotification() { return true; }
  convertHtmlToText(html) { return html; }
}

module.exports = new MockEmailService();
