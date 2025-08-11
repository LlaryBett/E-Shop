import express from 'express';
const router = express.Router();

// Import M-Pesa services
import { stkPush } from '../mpesa/mpesa.stk.js';
import { sendB2CPayment } from '../mpesa/mpesa.b2c.js';
import { registerURLs } from '../mpesa/mpesa.c2b.js';
import { 
  handleSTKCallback, 
  handleB2CCallback, 
  handleC2BValidation 
} from '../mpesa/mpesa.webhooks.js';
import { Transaction } from '../models/Transaction.js';
import { checkTransactionStatus } from '../mpesa/mpesa.utils.js';

/**
 * STK Push Payment
 */
router.post('/stk-push', async (req, res) => {
  try {
    const { phone, amount, reference = 'EShop', description = 'Online purchase' } = req.body;
    
    if (!phone || !amount) {
      return res.status(400).json({ error: 'Phone and amount are required' });
    }

    const response = await stkPush(phone, amount, reference, description);
    
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
 * B2C Payment
 */
router.post('/b2c-payment', async (req, res) => {
  try {
    const { phone, amount, commandID = 'BusinessPayment', remarks = 'Payment' } = req.body;
    
    const response = await sendB2CPayment(phone, amount, commandID, remarks);
    
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
 * Transaction Endpoints
 */
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await checkTransactionStatus(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const { status, type, phone, startDate, endDate } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.transactionType = type;
    if (phone) query.phoneNumber = phone;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Webhook Endpoints
 */
/**
 * Webhook Endpoints (Updated to match Safaricom)
 */
router.post('/callback/stk-callback', handleSTKCallback);        // ✅ STK Push Callback
router.post('/callback/b2c-callback', handleB2CCallback);        // ✅ B2C Payment Result Callback
router.post('/callback/c2b/validation', handleC2BValidation);    // ✅ C2B Validation Callback


/**
 * C2B URL Registration
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