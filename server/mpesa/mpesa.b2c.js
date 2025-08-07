import axios from 'axios';
import { getAuthToken } from './mpesa.auth.js';
import config from './mpesa.config.js';

export const sendB2CPayment = async (phone, amount, commandID = 'BusinessPayment', remarks = 'Payment') => {
  const token = await getAuthToken();
  
  const payload = {
    InitiatorName: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: commandID, // Can be 'SalaryPayment', 'BusinessPayment', 'PromotionPayment'
    Amount: amount,
    PartyA: config.shortCode,
    PartyB: phone,
    Remarks: remarks,
    QueueTimeOutURL: `${config.callbackURL}/b2c/timeout`,
    ResultURL: `${config.callbackURL}/b2c/result`,
    Occasion: 'Payment'
  };

  try {
    const response = await axios.post(config.endpoints.b2c, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`B2C payment failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

// Default export for backward compatibility
export default { sendB2CPayment };