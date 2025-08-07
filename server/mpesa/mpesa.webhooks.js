import { validateIPN } from './mpesa.utils.js';

// STK Callback Handler
export const handleSTKCallback = (req, res) => {
  try {
    const callbackData = req.body;
    console.log('STK Callback Received:', callbackData);

    // Validate the callback signature if needed
    // if (!validateIPN(callbackData, req.headers['x-callback-signature'])) {
    //   return res.status(403).json({ error: 'Invalid signature' });
    // }

    // Process the callback (update database, send notifications, etc.)
    const result = callbackData.Body.stkCallback;
    
    if (result.ResultCode === 0) {
      console.log('Payment successful:', result);
      // Update your database here
    } else {
      console.log('Payment failed:', result.ResultDesc);
    }

    res.status(200).send();
  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(400).json({ error: error.message });
  }
};

// B2C Callback Handler
export const handleB2CCallback = (req, res) => {
  try {
    const result = req.body;
    console.log('B2C Callback Received:', result);

    // Process B2C result (update database)
    res.status(200).send();
  } catch (error) {
    console.error('B2C Callback Error:', error);
    res.status(400).json({ error: error.message });
  }
};

// C2B Validation Handler
export const handleC2BValidation = (req, res) => {
  try {
    const transaction = req.body;
    console.log('C2B Validation Request:', transaction);

    // Validate the transaction
    // Return appropriate response to accept/reject the transaction
    res.json({
      ResultCode: 0, // 0 to accept, non-zero to reject
      ResultDesc: 'Accepted'
    });
  } catch (error) {
    console.error('Validation Error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: 'Error validating transaction'
    });
  }
};

// Alternative export syntax if you prefer named exports at the bottom
export default {
  handleSTKCallback,
  handleB2CCallback,
  handleC2BValidation
};