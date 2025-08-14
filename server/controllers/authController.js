import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE || '7', 10);

  const options = {
  expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None', // allow cross-site
  path: '/'
};


  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
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
      // Optional: Keep the token for retry or remove it
      // user.emailVerificationToken = undefined;
      // user.emailVerificationExpire = undefined;
      // await user.save({ validateBeforeSave: false });
    }

    // Always respond with success if user was created, regardless of email status
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    // Single check for both "not found" and "wrong password"
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Update last login without triggering validation
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};


// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  const options = {
    expires: new Date(Date.now()), // Immediately expire the cookie
    httpOnly: true, // Prevent client-side JS access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'None', // Required for cross-site cookies (matches login)
    path: '/', // Available on all paths
    // Removed domain - let browser handle it automatically
  };

  res.cookie('token', '', options);
  
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
      // Security best practice: Don't reveal if a user exists or not
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }

    // Check for reset request frequency to prevent abuse
    if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
      const timeLeft = Math.ceil((user.resetPasswordExpire - Date.now()) / (60 * 1000));
      if (timeLeft > 55) { // If more than 55 minutes left on a 60-minute token
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
      // Use the email utility's template generation instead of custom HTML
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

      // Log this for monitoring and debugging purposes
      console.log(`✅ Password reset email sent to ${user.email}`);

      // Return the same response regardless of whether the user exists
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

    // Find user with valid token
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

    // Update password and clear reset fields
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Add a flag to indicate the password was reset
    user.passwordLastChanged = Date.now();
    
    await user.save();

    // Send notification email that password was changed
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
      // Don't fail the request if the confirmation email fails
      console.error('Error sending password change confirmation:', error);
    }

    // Return success response with new token
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