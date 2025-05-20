const { describe, it, expect } = require('./test-helpers');
const crypto = require('crypto');
const { verifyZoomSignature, verifySendGridSignature } = require('../backend/utils/signatureUtils');

describe('signature utils', () => {
  it('verifies Zoom signature', () => {
    const secret = 'zoomsecret';
    const body = JSON.stringify({ event:'meeting.ended' });
    const ts = Math.floor(Date.now()/1000).toString();
    const msg = `v0:${ts}:${body}`;
    const hash = crypto.createHmac('sha256', secret).update(msg).digest('hex');
    const sig = `v0=${hash}`;
    const req = { rawBody: body, headers:{ 'x-zm-signature': sig, 'x-zm-request-timestamp': ts } };
    expect(verifyZoomSignature(req, secret)).toBe(true);
  });

  it('rejects Zoom signature with old timestamp', () => {
    const secret = 'zoomsecret';
    const body = '{}';
    const ts = (Math.floor(Date.now()/1000) - 400).toString();
    const msg = `v0:${ts}:${body}`;
    const hash = crypto.createHmac('sha256', secret).update(msg).digest('hex');
    const sig = `v0=${hash}`;
    const req = { rawBody: body, headers:{ 'x-zm-signature': sig, 'x-zm-request-timestamp': ts } };
    expect(verifyZoomSignature(req, secret)).toBe(false);
  });

  it('verifies SendGrid signature', () => {
    const secret = 'sgsecret';
    const body = '[{"event":"delivered","sg_message_id":"1"}]';
    const ts = Math.floor(Date.now()/1000).toString();
    const token = 'abc';
    const payload = ts + token + body;
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('base64');
    const req = { rawBody: body, headers:{
      'x-twilio-email-event-webhook-signature': hash,
      'x-twilio-email-event-webhook-timestamp': ts,
      'x-twilio-email-event-webhook-token': token
    }};
    expect(verifySendGridSignature(req, secret)).toBe(true);
  });
});
