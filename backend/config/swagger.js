const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MentorConnect API',
    version: '1.0.0',
    description: 'API documentation for MentorConnect platform',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@mentorconnect.com',
    },
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:5000/api',
      description: 'Development API Server',
    },
    {
      url: 'https://api.mentorconnect.com/api',
      description: 'Production API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'firstName', 'lastName', 'userType'],
        properties: {
          _id: {
            type: 'string',
            description: 'User ID',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
          },
          userType: {
            type: 'string',
            enum: ['candidate', 'professional', 'admin'],
            description: 'User type',
          },
          emailVerified: {
            type: 'boolean',
            description: 'Whether user email is verified',
          },
        },
      },
      ProfessionalProfile: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Profile ID',
          },
          user: {
            type: 'string',
            description: 'User ID',
          },
          title: {
            type: 'string',
            description: 'Professional title',
          },
          hourlyRate: {
            type: 'number',
            description: 'Hourly rate in USD',
          },
        },
      },
      Session: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Session ID',
          },
          professional: {
            type: 'string',
            description: 'Professional ID',
          },
          user: {
            type: 'string',
            description: 'User ID',
          },
          startTime: {
            type: 'string',
            format: 'date-time',
            description: 'Session start time',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            description: 'Session end time',
          },
          status: {
            type: 'string',
            enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
            description: 'Session status',
          },
        },
      },
      Referral: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Referral ID',
          },
          professional: {
            type: 'string',
            description: 'Professional ID',
          },
          candidate: {
            type: 'string',
            description: 'Candidate user ID',
          },
          status: {
            type: 'string',
            enum: ['pending', 'verified', 'rejected', 'rewarded'],
            description: 'Referral status',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                message: {
                  type: 'string',
                  example: 'Authentication required',
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js', './controllers/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
};