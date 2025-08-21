import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  avatar: {
    public_id: String,
    url: String,
  },
  phone: {
    type: String,
    trim: true,
  },
  orderCount: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  loyalty: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  notes: {
    type: String,
    default: ''
  },
  addresses: [{
    type: {
      type: String,
      enum: ['shipping', 'billing'],
      default: 'shipping',
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'Kenya',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sync status with isActive before saving
userSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.isActive = this.status === 'active';
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// The User schema now has orderCount, totalSpent, and loyalty fields.
// These fields are for reporting/analytics and should be updated based on the user's orders.
// There is no direct reference to the Order schema here, but you should update these fields in your order-related backend logic.

// For example, after an order is completed/paid, you should:
// 1. Increment user.orderCount
// 2. Add the order total to user.totalSpent
// 3. Optionally, update user.loyalty based on totalSpent or orderCount

// This logic should be handled in your order creation/completion controller, not in the User schema itself.

export default mongoose.model('User', userSchema);