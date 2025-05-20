const crypto = require('crypto');

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyZoomSignature(req, secret, tolerance = 300) {
  const signature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  if (!signature || !timestamp || !req.rawBody || !secret) return false;
  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > tolerance) {
    return false;
  }
  const message = `v0:${timestamp}:${req.rawBody}`;
  const hash = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const expected = `v0=${hash}`;
  return safeCompare(expected, signature);
}

function verifySendGridSignature(req, secret, tolerance = 300) {
  const signature = req.headers['x-twilio-email-event-webhook-signature'];
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
  const token = req.headers['x-twilio-email-event-webhook-token'];
  if (!signature || !timestamp || !token || !req.rawBody || !secret) return false;
  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > tolerance) {
    return false;
  }
  const payload = timestamp + token + req.rawBody;
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  return safeCompare(hash, signature);
}

module.exports = { verifyZoomSignature, verifySendGridSignature };
