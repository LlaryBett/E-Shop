import crypto from 'crypto';
import { Transaction } from '../models/Transaction.js';

// M-Pesa Utility Functions
export const generateTimestamp = () => {
  return new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
};

export const generatePassword = (shortCode, passKey, timestamp) => {
  return Buffer.from(shortCode + passKey + timestamp).toString('base64');
};

export const validateIPN = (data, signature) => {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  return hash === signature;
};

/**
 * Check transaction status by ID
 * @param {string} transactionId - MongoDB transaction ID
 * @returns {Promise<Object>} Transaction document
 * @throws {Error} If transaction not found
 */
export const checkTransactionStatus = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  return transaction;
};

// Default export for backward compatibility
export default {
  generateTimestamp,
  generatePassword,
  validateIPN,
  checkTransactionStatus
};