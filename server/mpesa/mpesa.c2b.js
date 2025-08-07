import axios from 'axios';
import { getAuthToken } from './mpesa.auth.js';
import config from './mpesa.config.js';

/**
 * Registers C2B URLs with M-Pesa API
 * @returns {Promise<Object>} M-Pesa API response
 * @throws {Error} If registration fails
 */
export const registerURLs = async () => {
  const token = await getAuthToken();
  
  const payload = {
    ShortCode: config.shortCode,
    ResponseType: 'Completed',
    ConfirmationURL: `${config.callbackURL}/c2b/confirm`,
    ValidationURL: `${config.callbackURL}/c2b/validate`
  };

  try {
    const response = await axios.post(config.endpoints.c2bRegister, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.data) {
      throw new Error('No response data received from M-Pesa API');
    }

    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('C2B Registration Error:', errorDetails);
    throw new Error(`C2B registration failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

// Alternative default export if needed
// export default { registerURLs };