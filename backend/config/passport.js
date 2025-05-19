const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/user');
const logger = require('../utils/logger');

/**
 * Configure passport for JWT authentication
 */
const configurePassport = () => {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };
  
  passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
      try {
        // Find user by ID from JWT payload
        const user = await User.findById(jwtPayload.id).select('-password');
        
        if (!user) {
          return done(null, false);
        }
        
        // Check if user is active
        if (!user.isActive) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        logger.error(`Passport authentication error: ${error.message}`, { error });
        return done(error, false);
      }
    })
  );
  
  return passport;
};

module.exports = configurePassport;