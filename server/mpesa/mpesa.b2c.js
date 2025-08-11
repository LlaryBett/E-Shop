import axios from 'axios';
import { getAuthToken } from './mpesa.auth.js';
import config from './mpesa.config.js';
import { Transaction } from '../models/Transaction.js';

/**
 * Send B2C Payment
 * @param {string} phone - Recipient phone number (2547... format)
 * @param {number} amount - Payment amount (1-150000 KES)
 * @param {string} [commandID='BusinessPayment'] - Payment type
 * @param {string} [remarks='Payment'] - Payment remarks
 * @returns {Promise<Object>} - API response + transaction record
 * @throws {Error} - Detailed validation/API errors
 */
export const sendB2CPayment = async (phone, amount, commandID = 'BusinessPayment', remarks = 'Payment') => {
  // 1. Input Validation
  if (!phone || !/^(\+?254|0)[17]\d{8}$/.test(phone)) {
    throw new Error('Invalid Kenyan phone number format');
  }

  if (amount < 10 || amount > 150000) {
    throw new Error('Amount must be between 10 and 150,000 KES');
  }

  const validCommands = ['BusinessPayment', 'SalaryPayment', 'PromotionPayment'];
  if (!validCommands.includes(commandID)) {
    throw new Error(`Invalid CommandID. Use one of: ${validCommands.join(', ')}`);
  }

  // 2. Create transaction record
  const transaction = new Transaction({
    transactionType: 'B2C',
    phoneNumber: phone.replace(/^0/, '254'),
    amount,
    reference: `B2C-${Date.now()}`,
    description: remarks,
    status: 'pending'
  });

  try {
    const token = await getAuthToken();
    
    const payload = {
      InitiatorName: config.initiatorName,
      SecurityCredential: config.securityCredential,
      CommandID: commandID,
      Amount: amount,
      PartyA: config.shortCode,
      PartyB: phone,
      Remarks: remarks,
      QueueTimeOutURL: `${config.callbackURL}/b2c/timeout`,
      ResultURL: `${config.callbackURL}/b2c/result`,
      Occasion: 'Payment'
    };

    // 3. Make API request
    const response = await axios.post(config.endpoints.b2c, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20s timeout
    });

    // 4. Update transaction
    transaction.merchantRequestID = response.data.OriginatorConversationID;
    transaction.mpesaReference = response.data.ConversationID;
    await transaction.save();

    return {
      ...response.data,
      transactionId: transaction._id
    };

  } catch (error) {
    // 5. Handle errors
    transaction.status = 'failed';
    transaction.resultDesc = error.response?.data?.errorMessage || error.message;
    await transaction.save();

    const apiError = error.response?.data || {};
    throw new Error(
      `B2C payment failed: ${apiError.errorMessage || error.message}` +
      (apiError.requestId ? ` (RequestID: ${apiError.requestId})` : '')
    );
  }
};

/**
 * Query B2C Transaction Status
 * @param {string} conversationId - From B2C response
 * @returns {Promise<Object>} - Transaction status
 */
export const queryB2CStatus = async (conversationId) => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(`${config.endpoints.b2c}/query/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`B2C status query failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

export default { 
  sendB2CPayment,
  queryB2CStatus 
};