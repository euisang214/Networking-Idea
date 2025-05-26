const { describe, it, expect, vi } = require('./test-helpers');

process.env.PLATFORM_EMAIL = 'referrals@mentorconnect.com';
process.env.MOCK_INTEGRATIONS = 'false';
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

describe('EmailService utility methods', () => {
  it('extracts address from name strings', () => {
    expect(EmailService.extractAddress('User <user@example.com>')).toBe('user@example.com');
    expect(EmailService.extractAddress({ email: 'test@example.com' })).toBe('test@example.com');
  });

  it('validates matching domains', () => {
    expect(EmailService.validateDomainMatch('a@company.com', 'b@company.com')).toBe(true);
    expect(EmailService.validateDomainMatch('a@one.com', 'b@two.com')).toBe(false);
  });

  it('converts html to text', () => {
    const html = '<style>p{color:red}</style><h1>Hello</h1><p>World</p><script>alert(1)</script>';
    expect(EmailService.convertHtmlToText(html)).toBe('HelloWorld');
  });
});
