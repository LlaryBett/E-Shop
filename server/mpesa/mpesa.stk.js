import axios from 'axios';
import { getAuthToken } from './mpesa.auth.js';
import config from './mpesa.config.js';
import { generateTimestamp, generatePassword } from './mpesa.utils.js';

export const stkPush = async (phone, amount, reference, description) => {
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
    CallBackURL: config.callbackURL,
    AccountReference: reference,
    TransactionDesc: description
  };

  try {
    const response = await axios.post(config.endpoints.stkPush, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

// Alternative default export if preferred
export default { stkPush };