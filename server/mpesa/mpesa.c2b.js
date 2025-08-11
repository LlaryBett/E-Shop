import axios from 'axios';
import { getAuthToken } from './mpesa.auth.js';
import config from './mpesa.config.js';
import { C2BURL } from '../models/c2b.model.js'; // New model for URL tracking

/**
 * Register C2B URLs
 * @returns {Promise<Object>} - API response + URL record
 * @throws {Error} - Registration errors
 */
export const registerURLs = async () => {
  try {
    const token = await getAuthToken();
    
    const payload = {
      ShortCode: config.shortCode,
      ResponseType: 'Completed',
      ConfirmationURL: `${config.callbackURL}/c2b/confirm`,
      ValidationURL: `${config.callbackURL}/c2b/validate`
    };

    // 1. Make API request
    const response = await axios.post(config.endpoints.c2bRegister, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // 2. Store registration record
    await C2BURL.create({
      shortCode: config.shortCode,
      confirmationURL: payload.ConfirmationURL,
      validationURL: payload.ValidationURL,
      response: response.data,
      registeredAt: new Date()
    });

    return response.data;

  } catch (error) {
    console.error('C2B Registration Error:', {
      error: error.response?.data || error.message,
      timestamp: new Date()
    });

    throw new Error(
      `C2B registration failed: ${error.response?.data?.errorMessage || error.message}`
    );
  }
};

/**
 * Simulate C2B Payment (Sandbox Only)
 * @param {string} phone - Customer phone
 * @param {number} amount - Transaction amount
 * @param {string} [billRef='TEST'] - Reference number
 * @returns {Promise<Object>} - Simulation response
 */
export const simulateC2BPayment = async (phone, amount, billRef = 'TEST') => {
  if (config.env !== 'sandbox') {
    throw new Error('Simulation only available in sandbox');
  }

  try {
    const token = await getAuthToken();

    const response = await axios.post(config.endpoints.c2bSimulate, {
      ShortCode: config.shortCode,
      CommandID: 'CustomerPayBillOnline',
      Amount: amount,
      Msisdn: phone,
      BillRefNumber: billRef
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(
      `C2B simulation failed: ${error.response?.data?.errorMessage || error.message}`
    );
  }
};

export default {
  registerURLs,
  simulateC2BPayment
};