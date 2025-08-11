import { Transaction } from '../models/Transaction.js';
import Order from '../models/Order.js'; // Import Order model
import User from '../models/User.js'; // Import User model
import { validateIPN } from './mpesa.utils.js';

/**
 * STK Callback Handler (for Lipa Na M-Pesa Online)
 */


export const handleSTKCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('STK Callback Received:', callbackData);

    // Validate callback signature (security)
    if (process.env.NODE_ENV === 'production' && 
        !validateIPN(callbackData, req.headers['x-callback-signature'])) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const result = callbackData.Body.stkCallback;
    const merchantRequestID = result.MerchantRequestID;
    const checkoutRequestID = result.CheckoutRequestID;

    // Find the pending transaction record
    const transaction = await Transaction.findOne({ 
      merchantRequestID,
      checkoutRequestID,
      status: 'pending'
    });

    if (!transaction) {
      console.error('Transaction not found:', { merchantRequestID, checkoutRequestID });
      return res.status(404).send();
    }

    // Process based on result
    if (result.ResultCode === 0) {
      // Success case - payment completed
      const metadata = result.CallbackMetadata?.Item?.reduce((acc, item) => {
        acc[item.Name] = item.Value;
        return acc;
      }, {});

      // Update the transaction record
      await transaction.updateStatus('completed', {
        mpesaReference: metadata?.MpesaReceiptNumber,
        resultCode: 0,
        resultDesc: 'Payment completed successfully',
        callbackMetadata: result
      });

      console.log(`Payment completed for ${transaction.phoneNumber}: ${metadata?.MpesaReceiptNumber}`);
      
      // Find and update the associated order
      const order = await Order.findOneAndUpdate(
        { 
          'paymentInfo.checkoutRequestID': checkoutRequestID,
          'paymentInfo.merchantRequestID': merchantRequestID 
        },
        {
          'paymentInfo.status': 'paid',
          'paymentInfo.mpesaReceiptNumber': metadata?.MpesaReceiptNumber,
          'status': 'processing',
          'paymentInfo.paidAt': new Date()
        },
        { new: true }
      );

      if (!order) {
        console.error('Order not found for completed payment:', { checkoutRequestID, merchantRequestID });
      }
    } else {
      // Failure case - payment failed
      await transaction.updateStatus('failed', {
        resultCode: result.ResultCode,
        resultDesc: result.ResultDesc,
        callbackMetadata: result
      });

      // Update the associated order if exists
      await Order.findOneAndUpdate(
        { 
          'paymentInfo.checkoutRequestID': checkoutRequestID,
          'paymentInfo.merchantRequestID': merchantRequestID 
        },
        {
          'paymentInfo.status': 'failed',
          'status': 'payment_failed',
          'paymentInfo.failureReason': result.ResultDesc
        }
      );

      console.warn(`Payment failed for ${transaction.phoneNumber}: ${result.ResultDesc}`);
    }

    res.status(200).send();
  } catch (error) {
    console.error('STK Callback Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



/**
 * B2C Payment Result Handler
 */
export const handleB2CCallback = async (req, res) => {
  try {
    const result = req.body.Result;
    console.log('B2C Callback Received:', result);

    // 1. Find transaction by M-Pesa reference
    const transaction = await Transaction.findOne({
      mpesaReference: result.TransactionID,
      transactionType: 'B2C'
    });

    if (!transaction) {
      console.error('B2C Transaction not found:', result.TransactionID);
      return res.status(404).send();
    }

    // 2. Update status
    const newStatus = result.ResultCode === 0 ? 'completed' : 'failed';
    await transaction.updateStatus(newStatus, {
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
      callbackMetadata: result
    });

    console.log(`B2C payment ${newStatus} for ${result.ReceiverParty}`);

    res.status(200).send();
  } catch (error) {
    console.error('B2C Callback Error:', error);
    res.status(500).json({ 
      error: 'Failed to process B2C callback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * C2B Validation Handler
 */
export const handleC2BValidation = async (req, res) => {
  try {
    const payload = req.body;
    console.log('C2B Validation Request:', payload);

    // 1. Validate transaction (add your business logic)
    const isValid = await validateC2BPayment(payload);
    
    // 2. Log the validation attempt
    await Transaction.create({
      transactionType: 'C2B',
      phoneNumber: payload.MSISDN,
      amount: payload.TransAmount,
      reference: payload.BillRefNumber,
      status: isValid ? 'completed' : 'failed',
      callbackMetadata: payload
    });

    // 3. Respond to M-Pesa
    res.json({
      ResultCode: isValid ? 0 : 1,
      ResultDesc: isValid ? 'Accepted' : 'Invalid transaction'
    });

  } catch (error) {
    console.error('C2B Validation Error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: 'Internal validation error'
    });
  }
};

// Helper function (customize with your business logic)
async function validateC2BPayment(payload) {
  // Implement your validation logic:
  // - Check if phone number is whitelisted
  // - Verify amount matches expected value
  // - Validate BillRefNumber format
  return true; // Default accept all for demo
}

export default {
  handleSTKCallback,
  handleB2CCallback,
  handleC2BValidation
};