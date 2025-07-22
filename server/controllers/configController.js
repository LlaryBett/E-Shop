import Coupon from '../models/Coupon.js';
import FeesAndRates from '../models/FeesAndRates.js';
import TaxRate from '../models/TaxRate.js';
import ShippingMethod from '../models/ShippingMethod.js';

// --- Coupons ---
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

// --- Fees and Rates ---
export const setFeesAndRates = async (req, res) => {
  try {
    const existing = await FeesAndRates.findOne();
    const data = existing
      ? await FeesAndRates.findByIdAndUpdate(existing._id, req.body, { new: true })
      : await FeesAndRates.create(req.body);

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFeesAndRates = async (req, res) => {
  try {
    const config = await FeesAndRates.findOne();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fees and rates' });
  }
};

// --- Tax Rates ---
export const createTaxRate = async (req, res) => {
  try {
    const tax = await TaxRate.create(req.body);
    res.status(201).json(tax);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getTaxRates = async (req, res) => {
  try {
    const rates = await TaxRate.find();
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
};

// --- Dynamic Tax Rate Lookup ---
export const calculateTax = async (req, res) => {
  try {
    const { total } = req.body;

    if (!total || typeof total !== 'number') {
      return res.status(400).json({ error: 'Invalid or missing total amount.' });
    }

    const taxRate = await TaxRate.findOne({
      min: { $lte: total },
      max: { $gte: total }
    });

    if (!taxRate) {
      return res.status(404).json({ error: 'No tax rate found for this amount' });
    }

    const taxAmount = parseFloat((total * taxRate.rate).toFixed(2));

    res.json({
      rate: taxRate.rate,
      percentage: taxRate.rate * 100,
      taxAmount
    });
  } catch (err) {
    res.status(500).json({ error: 'Tax calculation failed' });
  }
};

// --- Shipping Methods ---
export const createShippingMethod = async (req, res) => {
  try {
    const shipping = await ShippingMethod.create(req.body);
    res.status(201).json(shipping);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find();
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shipping methods' });
  }
};

// At the end, export all functions as a single object for ES module default import
export default {
  createCoupon,
  getCoupons,
  setFeesAndRates,
  getFeesAndRates,
  createTaxRate,
  getTaxRates,
  calculateTax,
  createShippingMethod,
  getShippingMethods
};
