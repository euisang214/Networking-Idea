const { describe, it, expect, vi } = require('./test-helpers');

process.env.PLATFORM_EMAIL = 'referrals@mentorconnect.com';
vi.mock('nodemailer', () => ({ createTransport: vi.fn() }));
vi.mock('@sendgrid/mail', () => ({ setApiKey: vi.fn(), send: vi.fn() }));
vi.mock('handlebars', () => ({ compile: vi.fn(() => () => '') }));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }));
const EmailService = require('../backend/services/emailService');

describe('EmailService.parseReferralEmail', () => {
  it('returns null when platform email not CC\'d', () => {
    const result = EmailService.parseReferralEmail({
      from: 'pro@company.com',
      to: 'colleague@company.com',
      cc: 'other@company.com',
      subject: 'Test',
      text: 'candidate@example.com'
    });
    expect(result).toBe(null);
  });

  it('parses referral email when platform CC\'d', () => {
    const result = EmailService.parseReferralEmail({
      from: 'Pro <pro@company.com>',
      to: 'Col <colleague@company.com>',
      cc: 'other@company.com, referrals@mentorconnect.com',
      subject: 'Referral',
      text: 'candidate@example.com',
      messageId: 'm1'
    });
    expect(result.senderEmail).toBe('pro@company.com');
    expect(result.recipientEmail).toBe('colleague@company.com');
    expect(result.ccEmails).toEqual(['other@company.com', 'referrals@mentorconnect.com']);
    expect(result.isPlatformCCd).toBe(true);
    expect(result.domainsMatch).toBe(true);
  });
});
