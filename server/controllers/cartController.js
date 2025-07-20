import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Get current user's cart
export const getCart = async (req, res) => {
  try {
    // Populate product and its brand
    const cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        populate: { path: 'brand', select: 'name logo' }
      });

    // Map items to include brand name directly in product
    const items = (cart?.items || []).map(item => {
      const product = item.product?.toObject ? item.product.toObject() : item.product;
      if (product && product.brand && typeof product.brand === 'object') {
        product.brandName = product.brand.name;
        product.brandLogo = product.brand.logo;
      }
      return { ...item.toObject(), product };
    });

    res.json({ items });
  } catch (err) {
    console.error('Get Cart Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant === variant
    );

    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, variant });
    }

    await cart.save();
    const updatedCart = await cart.populate('items.product');
    res.status(200).json({ items: updatedCart.items });
  } catch (err) {
    console.error('Add to Cart Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update quantity
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.id;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await cart.populate('items.product');
    res.json({ items: updatedCart.items });
  } catch (err) {
    console.error('Update Cart Item Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Remove single item
export const removeCartItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    const updatedCart = await cart.populate('items.product');
    res.json({ items: updatedCart.items });
  } catch (err) {
    console.error('Remove Cart Item Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear Cart Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
