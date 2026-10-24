import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// The identity for a request always comes from the verified JWT -- never from a
// client-supplied body field or query string. Every route that needs to know who
// is calling must go through this helper.
// _id is stringified because the existing documents store userId as a String.
export const identityOf = (req) => ({
  userId: req.user._id.toString(),
  username: req.user.username,
});

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
