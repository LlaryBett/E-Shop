import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // Required Fields
  transactionType: { 
    type: String, 
    enum: ['STK_PUSH', 'B2C', 'C2B', 'REVERSAL'], 
    required: true 
  },
  phoneNumber: { 
    type: String, 
    required: true,
    validate: {
      validator: (v) => /^(\+?254|0)[17]\d{8}$/.test(v), // Validate Kenyan phone format
      message: props => `${props.value} is not a valid Kenyan phone number!`
    }
  },
  amount: { 
    type: Number, 
    required: true,
    min: [1, 'Amount must be at least 1 KES'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'reversed'], 
    default: 'pending' 
  },

  // M-Pesa Metadata
  mpesaReference: { type: String, index: true }, // M-Pesa Transaction ID (e.g., "LGR1234ABC")
  merchantRequestID: { type: String, index: true }, // From STK Push request
  checkoutRequestID: { type: String, index: true }, // From STK Push request
  resultCode: { type: Number }, // 0 = success, non-zero = error
  resultDesc: String, // e.g., "The service request is processed successfully."

  // Business Context
  reference: { type: String, index: true }, // Your internal reference (e.g., order ID)
  description: String, // Human-readable description (e.g., "Payment for Order #123")

  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },

  // Raw Callback Data (for debugging)
  callbackMetadata: { type: mongoose.Schema.Types.Mixed }
});

// Add indexes for faster querying
transactionSchema.index({ phoneNumber: 1, status: 1 });
transactionSchema.index({ createdAt: -1 }); // Sort recent transactions first

/**
 * Check if transaction was successful
 */
transactionSchema.methods.isSuccessful = function() {
  return this.status === 'completed' && this.resultCode === 0;
};

/**
 * Update transaction status
 */
transactionSchema.methods.updateStatus = async function(newStatus, metadata = {}) {
  this.status = newStatus;

  // ✅ Store mpesaReference at top level (e.g. "TH78E7UTBW")
  if (metadata?.mpesaReference) {
    this.mpesaReference = metadata.mpesaReference;
  }

  // ✅ Also store full metadata object for reference/debugging
  if (metadata) {
    this.callbackMetadata = metadata;
  }

  this.updatedAt = new Date();
  await this.save();
  return this;
};


// Auto-update 'updatedAt' on save
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Transaction = mongoose.model('Transaction', transactionSchema);