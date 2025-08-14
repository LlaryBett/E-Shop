import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - require authentication (cookie-only version)
export const protect = async (req, res, next) => {
  console.log("🛡 [protect] Middleware running...");
  
  // Only check cookies now (removed header check)
  const token = req.cookies.token;
  
  if (!token) {
    console.log("❌ No token cookie provided");
    return res.status(401).json({
      success: false,
      message: 'Not authorized - please login',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log("🔴 No user found for token");
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      console.log("⚠️ User account is deactivated");
      return res.status(401).json({
        success: false,
        message: 'Account deactivated',
      });
    }

    console.log(`👤 Authenticated as ${user.email}`);
    req.user = user;
    next();
    
  } catch (error) {
    console.error("💥 Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token - please login again',
    });
  }
};

// Role authorization remains the same
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} unauthorized for this route`,
      });
    }
    next();
  };
};

// Optional auth (cookie-only version)
export const optionalAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next();
};