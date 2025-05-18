/**
 * Passport.js authentication strategies configuration
 */
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const UserModel = require('../models/user');
const logger = require('../utils/logger');

module.exports = (passport) => {
  // Configure JWT Strategy for token-based authentication
  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
        algorithms: ['HS256']
      },
      async (jwtPayload, done) => {
        try {
          // Find the user by ID from the JWT payload
          const user = await UserModel.findById(jwtPayload.sub);
          
          if (!user) {
            return done(null, false, { message: 'User not found' });
          }

          // Don't include sensitive data in the user object
          delete user.password_hash;
          
          return done(null, user);
        } catch (error) {
          logger.error('JWT strategy error:', error);
          return done(error);
        }
      }
    )
  );

  // Configure Local Strategy for username/password login
  passport.use(
    'local',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await UserModel.findByEmail(email);

          if (!user) {
            return done(null, false, { message: 'Incorrect email or password' });
          }

          // Compare passwords
          const isMatch = await bcrypt.compare(password, user.password_hash);

          if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password' });
          }

          // Don't include sensitive data in the user object
          delete user.password_hash;
          
          return done(null, user);
        } catch (error) {
          logger.error('Local strategy error:', error);
          return done(error);
        }
      }
    )
  );
};
