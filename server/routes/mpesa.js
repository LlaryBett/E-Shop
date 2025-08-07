import express from 'express';
const router = express.Router();

// Import all M-Pesa services
import { stkPush } from '../mpesa/mpesa.stk.js';
import { sendB2CPayment } from '../mpesa/mpesa.b2c.js';
import { registerURLs } from '../mpesa/mpesa.c2b.js';
import { 
  handleSTKCallback, 
  handleB2CCallback, 
  handleC2BValidation 
} from '../mpesa/mpesa.webhooks.js';

/**
 * @route POST /stk-push
 * @desc Initiate STK Push payment request
 */
router.post('/stk-push', async (req, res) => {
  try {
    const { phone, amount, reference = 'EShop', description = 'Online purchase' } = req.body;
    
    // Validate inputs
    if (!phone || !amount) {
      return res.status(400).json({ error: 'Phone and amount are required' });
    }

    const response = await stkPush(
      phone, 
      amount, 
      reference, 
      description
    );
    
    res.json({
      success: true,
      message: 'STK push initiated successfully',
      data: response
    });
  } catch (error) {
    console.error('STK Push Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route POST /b2c-payment
 * @desc Send B2C payment (payouts)
 */
router.post('/b2c-payment', async (req, res) => {
  try {
    const { phone, amount, commandID = 'BusinessPayment', remarks = 'Payment' } = req.body;
    
    const response = await sendB2CPayment(
      phone,
      amount,
      commandID,
      remarks
    );
    
    res.json({
      success: true,
      message: 'B2C payment initiated',
      data: response
    });
  } catch (error) {
    console.error('B2C Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route POST /mpesa-callback
 * @desc Handle STK Push callback
 */
router.post('/mpesa-callback', handleSTKCallback);

/**
 * @route POST /mpesa-b2c-callback
 * @desc Handle B2C transaction results
 */
router.post('/mpesa-b2c-callback', handleB2CCallback);

/**
 * @route POST /mpesa-c2b-validate
 * @desc Validate C2B transaction
 */
router.post('/mpesa-c2b-validate', handleC2BValidation);

/**
 * @route POST /register-urls
 * @desc Register C2B URLs
 */
router.post('/register-urls', async (req, res) => {
  try {
    const response = await registerURLs();
    res.json({
      success: true,
      message: 'URLs registered successfully',
      data: response
    });
  } catch (error) {
    console.error('URL Registration Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;