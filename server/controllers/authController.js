import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token, // Send token in response body
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({ name, email, password });

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message: `Please click on the following link to verify your email: ${verificationUrl}`,
      });

      console.log('✅ Verification email sent to', user.email);
    } catch (error) {
      console.warn('⚠️ Email sending error (possibly still sent):', error.message);
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// @desc    Login user (modern flow - allows login but tracks verification status)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user with password (explicitly selected)
    const user = await User.findOne({ email })
      .select('+password +loginAttempts +lockUntil +status +isActive');

    // Account lock check (brute force protection)
    if (user?.lockUntil && user.lockUntil > Date.now()) {
      const retryIn = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${retryIn} seconds.`
      });
    }

    // Credential check
    if (!user || !(await user.comparePassword(password))) {
      // Increment failed attempts
      if (user) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = Date.now() + 15 * 60 * 1000; // 15min lock
        }
        await user.save({ validateBeforeSave: false });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        remainingAttempts: user ? 5 - user.loginAttempts : undefined
      });
    }

    // Account status checks - unified message for all non-active states
    if (user.status === 'banned' || user.status === 'inactive' || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account banned or deactivated. Contact support.',
      });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Modern response - always return token but include verification status
    sendTokenResponse(user, 200, res);

    // Optional: Log security event
    console.log(`🔒 User ${user.email} logged in from ${req.ip}`);
  } catch (error) {
    // Security: Never leak error details
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }

    if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
      const timeLeft = Math.ceil((user.resetPasswordExpire - Date.now()) / (60 * 1000));
      if (timeLeft > 55) {
        return res.status(429).json({
          success: false,
          message: `Please wait before requesting another reset. You can request again in ${timeLeft} minutes.`,
        });
      }
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'E-Shop Password Reset',
        greeting: 'Hello',
        name: user.name,
        message: 'You are receiving this email because a password reset was requested for your account. This link will expire in 60 minutes.\n\nIf you did not request this password reset, please ignore this email and your password will remain unchanged.',
        actionUrl: resetUrl,
        actionText: 'Reset Password',
        footerText: 'This email was sent because a password reset was requested for your account.',
        showContactSupport: true
      });

      console.log(`✅ Password reset email sent to ${user.email}`);

      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Error sending password reset email:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not send reset email. Please try again later.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordLastChanged = Date.now();
    
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Has Been Changed',
        greeting: 'Hello',
        name: user.name,
        message: 'Your password has been successfully reset.\n\nIf you did not make this change, please contact our support team immediately.',
        footerText: 'This is a security notification regarding your E-Shop account.',
        showContactSupport: true
      });
    } catch (error) {
      console.error('Error sending password change confirmation:', error);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        greeting: 'Hello',
        name: user.name,
        message: 'Thank you for registering with E-Shop. Please verify your email address to complete your registration.',
        actionUrl: verificationUrl,
        actionText: 'Verify Email',
        footerText: 'If you did not create an account, please ignore this email.',
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent',
      });
    } catch (error) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    next(error);
  }
};