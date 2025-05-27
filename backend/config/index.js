const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
}

const config = {
  get app() {
    return {
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT, 10) || 5000,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
      apiUrl: process.env.API_URL,
      mockIntegrations: process.env.MOCK_INTEGRATIONS === 'true'
    };
  },
  get rateLimit() {
    return {
      api: {
        max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,
        windowMin: parseInt(process.env.API_RATE_LIMIT_WINDOW_MIN, 10) || 15
      },
      auth: {
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
        windowMin: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 10) || 15
      },
      webhook: {
        max: parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX, 10) || 300,
        windowMin: parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MIN, 10) || 15
      }
    };
  },
  get database() {
    return { uri: requireEnv('MONGODB_URI') };
  },
  get auth() {
    return {
      jwtSecret: requireEnv('JWT_SECRET'),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
  },
  get stripe() {
    return {
      secretKey: requireEnv('STRIPE_SECRET_KEY'),
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      publicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
      basicPriceId: process.env.STRIPE_BASIC_PRICE_ID,
      premiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      enterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
    };
  },
  get email() {
    return {
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      sendgridWebhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      from: process.env.EMAIL_FROM || 'noreply@mentorconnect.com',
      platformEmail: process.env.PLATFORM_EMAIL || 'referrals@mentorconnect.com',
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };
  },
  get zoom() {
    return {
      apiKey: process.env.ZOOM_API_KEY,
      apiSecret: process.env.ZOOM_API_SECRET,
      verificationToken: process.env.ZOOM_VERIFICATION_TOKEN,
      webhookSecret: process.env.ZOOM_WEBHOOK_SECRET
    };
  },
  get google() {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    };
  },
  get business() {
    return {
      platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || 15),
      stripePlatformFeePercent: parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || 10),
      referralRewardAmount: parseInt(process.env.REFERRAL_REWARD_AMOUNT || 50, 10),
      maxRewardPerPro: parseInt(process.env.MAX_REWARD_PER_PRO || 5, 10),
      cooldownDays: parseInt(process.env.COOLDOWN_DAYS || 7, 10),
      referralPlatformFeePercent: parseFloat(process.env.REFERRAL_PLATFORM_FEE_PERCENT || 15),
      minPayoutAmount: parseFloat(process.env.MIN_PAYOUT_AMOUNT || 1)
    };
  },
  get logging() {
    return {
      logArchiveBucket: process.env.LOG_ARCHIVE_BUCKET,
      lokiUrl: process.env.LOKI_URL
    };
  }
};

module.exports = config;
