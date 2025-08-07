import axios from 'axios';
import config from './mpesa.config.js';

/**
 * Retrieves an access token from M-Pesa API
 * @returns {Promise<string>} The access token
 * @throws {Error} If authentication fails
 */
export const getAuthToken = async () => {
  // Create Basic Auth credentials
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(config.endpoints.auth, {
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Cache-Control': 'no-cache' // Recommended for auth requests
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data?.access_token) {
      throw new Error('No access token received in response');
    }
    
    return response.data.access_token;
  } catch (error) {
    const errorMessage = error.response?.data?.errorMessage || 
                        error.response?.statusText || 
                        error.message;
    throw new Error(`M-Pesa authentication failed: ${errorMessage}`);
  }
};

// Default export for backward compatibility
export default { getAuthToken };