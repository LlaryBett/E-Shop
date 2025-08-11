import axios from 'axios';
import { getAuthToken } from './mpesa.auth.js';
import config from './mpesa.config.js';
import { generateTimestamp, generatePassword } from './mpesa.utils.js';
import { Transaction } from '../models/Transaction.js'; // Import your Transaction model

/**
 * Initiate STK Push Payment
 * @param {string} phone - Customer phone number (2547... format)
 * @param {number} amount - Payment amount
 * @param {string} reference - Your internal reference (e.g., order ID)
 * @param {string} description - Payment description
 * @returns {Promise<Object>} - M-Pesa response + transaction record
 * @throws {Error} - Detailed error message
 */
export const stkPush = async (phone, amount, reference, description) => {
  // 1. Input Validation
  if (!phone || !/^(\+?254|0)[17]\d{8}$/.test(phone)) {
    throw new Error('Invalid Kenyan phone number format');
  }

  if (amount <= 0 || amount > 150000) { // M-Pesa B2C limit
    throw new Error('Amount must be between 1 and 150,000 KES');
  }

  // 2. Create initial transaction record
  const transaction = new Transaction({
    transactionType: 'STK_PUSH',
    phoneNumber: phone.replace(/^0/, '254'), // Normalize to 254 format
    amount,
    reference,
    description,
    status: 'pending'
  });

  try {
    // 3. Get auth token and prepare payload
    const token = await getAuthToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(config.shortCode, config.passKey, timestamp);

    const payload = {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: config.shortCode,
      PhoneNumber: phone,
      CallBackURL: `${config.callbackURL}/stk-callback`, // Explicit endpoint
      AccountReference: reference,
      TransactionDesc: description || `Payment for ${reference}`
    };

    // 4. Make API request
    const response = await axios.post(config.endpoints.stkPush, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15s timeout
    });

    // 5. Update transaction with M-Pesa references
    transaction.merchantRequestID = response.data.MerchantRequestID;
    transaction.checkoutRequestID = response.data.CheckoutRequestID;
    await transaction.save();

    // 6. Return combined response
    return {
      ...response.data,
      transactionId: transaction._id, // Your internal reference
      timestamp
    };

  } catch (error) {
    // 7. Handle errors and update transaction
    transaction.status = 'failed';
    transaction.resultDesc = error.response?.data?.errorMessage || error.message;
    await transaction.save();

    // 8. Throw formatted error
    const apiError = error.response?.data || {};
    throw new Error(
      `STK Push failed: ${apiError.errorMessage || error.message}` + 
      (apiError.requestId ? ` (RequestID: ${apiError.requestId})` : '')
    );
  }
};

/**
 * Query STK Push Status
 * @param {string} checkoutRequestID - From initial STK response
 * @returns {Promise<Object>} - Transaction status
 */
export const querySTKStatus = async (checkoutRequestID) => {
  try {
    const token = await getAuthToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(config.shortCode, config.passKey, timestamp);

    const response = await axios.post(config.endpoints.stkQuery, {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`STK Query failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

export default { 
  stkPush,
  querySTKStatus 
};