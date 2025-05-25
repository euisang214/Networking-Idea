const { body, param, query } = require('express-validator');

// Generic validators reused across routes
const validators = {
  // User validators
  userId: param('userId').isMongoId().withMessage('Invalid user ID'),
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  lastName: body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  userType: body('userType')
    .optional()
    .isIn(['candidate', 'professional', 'admin'])
    .withMessage('User type must be candidate, professional, or admin'),
  resume: body('resume')
    .optional()
    .isString()
    .withMessage('Resume must be a string'),

  // Session validators
  sessionId: param('sessionId').isMongoId().withMessage('Invalid session ID'),
  startTime: body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid date')
    .toDate(),
  endTime: body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid date')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  // Professional validators
  professionalId: param('professionalId').isMongoId().withMessage('Invalid professional ID'),
  hourlyRate: body('hourlyRate')
    .isNumeric()
    .withMessage('Hourly rate must be a number')
    .isFloat({ min: 0 })
    .withMessage('Hourly rate cannot be negative'),
  yearsOfExperience: body('yearsOfExperience')
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a non-negative integer'),
  industryId: body('industry')
    .isMongoId()
    .withMessage('Invalid industry ID'),

  // Payment validators
  paymentMethodId: body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required'),
  amount: body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount cannot be negative'),

  // Referral validators
  referralId: param('referralId').isMongoId().withMessage('Invalid referral ID'),
  candidateEmail: body('candidateEmail')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid candidate email')
    .normalizeEmail(),

  // Pagination validators
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  // Message validators
  messageId: param('messageId').isMongoId().withMessage('Invalid message ID'),
  content: body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 5000 })
    .withMessage('Message content cannot exceed 5000 characters'),

  // Rating validators
  rating: body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  comment: body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
};

// Schemas that were previously defined inline with celebrate/simpleJoi
const authSchemas = {
  register: [
    validators.email,
    validators.password,
    validators.firstName,
    validators.lastName,
    validators.userType,
    validators.resume,
  ],
  login: [
    validators.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],
  google: [
    body('idToken').notEmpty().withMessage('idToken is required'),
    body('accessToken').notEmpty().withMessage('accessToken is required'),
    body('refreshToken').optional(),
  ],
};

module.exports = { validators, authSchemas };
