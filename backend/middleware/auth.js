const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Development mode: Create a consistent development user
    req.user = { 
      userId: 'dev_user_123',
      email: 'dev@example.com',
      name: 'Development User',
      isPro: true
    };
    next();
  } catch (error) {
    console.warn('Auth middleware error:', error);
    // Even on error, allow the request in development
    req.user = { 
      userId: 'dev_user_123',
      email: 'dev@example.com',
      name: 'Development User',
      isPro: true
    };
    next();
  }
};