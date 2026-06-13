import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database and attach to request object
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User associated with this token not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message);
      res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
