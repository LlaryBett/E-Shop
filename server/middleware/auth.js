import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  console.log("🛡 [protect] Middleware running...");
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log("🔑 Token found in Authorization header");
  } else if (req.cookies.token) {
    token = req.cookies.token;
    console.log("🍪 Token found in cookies");
  } else {
    console.log("❌ No token provided");
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const user = await User.findById(decoded.id).select('-password');
    console.log("👤 User found:", user ? `${user._id} (${user.email})` : "No user found");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token',
      });
    }

    if (!user.isActive) {
      console.log("⚠ User account is deactivated");
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("💥 Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};


// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Optional authentication - doesn't require login but adds user if logged in
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid, but continue without user
    }
  }

  next();
};