const fs = require('fs');
const path = require('path');
let AWS;
try { AWS = require('aws-sdk'); } catch { AWS = null; }
const User = require('../models/user');
const Session = require('../models/session');
const Message = require('../models/message');
const Referral = require('../models/referral');
const Payment = require('../models/payment');
const logger = require('./logger');

async function gdprDeleteUser(userId) {
  await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });
  await Session.deleteMany({ $or: [{ professional: userId }, { user: userId }] });
  await Referral.deleteMany({ $or: [{ referrer: userId }, { candidate: userId }] });
  await Payment.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);
  logger.info(`GDPR delete completed for user ${userId}`);
}

async function archiveLogs() {
  const bucket = process.env.LOG_ARCHIVE_BUCKET;
  if (!bucket) return;
  const dir = path.join(__dirname, '../logs');
  if (!fs.existsSync(dir)) return;
  if (!AWS) return;
  const files = fs.readdirSync(dir);
  const s3 = new AWS.S3();
  await Promise.all(files.map(file => {
    const Body = fs.readFileSync(path.join(dir, file));
    return s3.putObject({
      Bucket: bucket,
      Key: `logs/${Date.now()}_${file}`,
      Body,
      ServerSideEncryption: 'aws:kms'
    }).promise();
  }));
  logger.info('Archived logs to S3');
}

module.exports = { gdprDeleteUser, archiveLogs };
