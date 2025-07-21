import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import FeesAndRates from '../models/FeesAndRates.js';

class CheckoutController {
  // --- User Checkout Info ---
  async getUserCheckoutInfo(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .select('name email addresses')
        .populate('addresses');

      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({
        user: {
          name: user.name,
          email: user.email,
          addresses: user.addresses || [],
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Cart Verification ---
  async verifyCartItems(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const verifiedItems = cart.items.map(item => {
        const product = item.product;
        const valid = product && product.stock >= item.quantity;
        return {
          productId: product?._id,
          name: product?.title,
          image: product?.images?.[0],
          quantity: item.quantity,
          price: product?.price,
          valid,
          error: !valid ? 'Out of stock or missing product' : null
        };
      });

      const invalidItems = verifiedItems.filter(item => !item.valid);
      if (invalidItems.length > 0) {
        return res.status(400).json({ error: 'Cart contains invalid items', invalidItems });
      }

      res.json({ verifiedItems });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Shipping Fees ---
  async getShippingOptions(req, res) {
    try {
      const { location } = req.body;
      if (!location) return res.status(400).json({ error: 'Location required' });

      const rates = await FeesAndRates.findOne({ location });
      if (!rates) return res.status(404).json({ error: 'No shipping rates found for location' });

      res.json({ shippingFees: rates.shippingFees });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Tax Calculation ---
  async calculateTaxes(req, res) {
    try {
      const { location, subtotal } = req.body;
      if (!location || subtotal == null) {
        return res.status(400).json({ error: 'Location and subtotal required' });
      }

      const feesData = await FeesAndRates.findOne({ location });
      if (!feesData) return res.status(404).json({ error: 'Tax config not found' });

      const tier = feesData.taxTiers.find(t => subtotal >= t.min && (t.max == null || subtotal <= t.max));
      const taxRate = tier?.rate || 0;
      const tax = +(subtotal * taxRate).toFixed(2);

      res.json({ tax, taxRate });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Coupon Validation ---
  async validateCoupon(req, res) {
    try {
      const { code, cartTotal } = req.body;
      if (!code) return res.status(400).json({ error: 'Coupon code required' });

      const coupon = await Coupon.findOne({
        code,
        active: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon' });

      if (coupon.minAmount && cartTotal < coupon.minAmount) {
        return res.status(400).json({ error: `Minimum order of ${coupon.minAmount} required` });
      }

      const discountAmount = coupon.discountType === 'percentage'
        ? Math.min((coupon.discountValue / 100) * cartTotal, coupon.maxDiscount || Infinity)
        : coupon.discountValue;

      res.json({
        valid: true,
        discountAmount,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          type: coupon.discountType,
          value: coupon.discountValue,
          description: coupon.description
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Payment Options ---
  async getPaymentConfig(req, res) {
    try {
      res.json({
        acceptedMethods: ['card', 'cod', 'mpesa'],
        simulation: true
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Final Checkout ---
  async completeCheckout(req, res) {
    try {
      const userId = req.user._id;
      const {
        shippingAddress,
        shippingMethod,
        paymentMethod,
        coupon,
        discount = 0,
        location,
        subtotal,
        tax,
        shipping,
        paymentFee,
        total
      } = req.body;

      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const order = new Order({
        user: userId,
        items: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        shippingAddress,
        shippingMethod,
        paymentMethod,
        coupon: coupon ? { code: coupon.code, discountAmount: discount } : null,
        subtotal,
        tax,
        shippingCost: shipping,
        paymentFee,
        discount,
        total,
        status: 'processing',
        resolvedLocation: location,
        paymentStatus: 'paid'
      });

      await order.save();
      await Cart.updateOne({ user: userId }, { $set: { items: [] } });
      await Promise.all(cart.items.map(item =>
        Product.updateOne({ _id: item.product._id }, { $inc: { stock: -item.quantity } })
      ));

      res.json({ success: true, orderId: order._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // =============== ADMIN METHODS (FeesAndRates) ===============

  async upsertFees(req, res) {
    try {
      const { location, shippingFees, taxTiers, paymentFees } = req.body;

      const updated = await FeesAndRates.findOneAndUpdate(
        { location },
        { location, shippingFees, taxTiers, paymentFees },
        { new: true, upsert: true, runValidators: true }
      );

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Error saving fees:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getAllFees(req, res) {
    try {
      const data = await FeesAndRates.find();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getFeesByLocation(req, res) {
    try {
      const { location } = req.params;
      const config = await FeesAndRates.findOne({ location });

      if (!config) {
        return res.status(404).json({ success: false, message: 'No config found for this location' });
      }

      res.status(200).json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

export default new CheckoutController();
