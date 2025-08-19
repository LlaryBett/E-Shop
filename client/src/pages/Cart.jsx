import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useCart } from '../contexts/CartContext';
import { useCheckout } from '../contexts/CheckoutContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductService from '../services/productService';
import toast from 'react-hot-toast';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

const Cart = () => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart, loading, addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { taxRates = [] } = useCheckout() || {};

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      toast.success('Item removed from cart');
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  const subtotal = getTotalPrice();

  let tax = 0;
  if (taxRates && Array.isArray(taxRates)) {
    const taxRule = taxRates.find(
      rule => subtotal >= rule.min && subtotal <= rule.max
    );
    if (taxRule) {
      tax = subtotal * taxRule.rate;
    }
  }

  const total = subtotal + tax;

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!items.length) return;
      
      try {
        setLoadingRelated(true);
        
        // Try different ways to access category information
        const categoryIds = [];
        
        // Try to extract category from different possible structures
        items.forEach(item => {
          const product = item.product;
          
          // Try different ways the category ID might be stored
          if (product.category?._id) {
            categoryIds.push(product.category._id);
          } else if (product.category?.id) {
            categoryIds.push(product.category.id);
          } else if (product.categoryId) {
            categoryIds.push(product.categoryId);
          } else if (typeof product.category === 'string') {
            categoryIds.push(product.category);
          }
        });
        
        // Use the first category ID to fetch related products
        if (categoryIds.length > 0) {
          // Get the first product ID to exclude it from results
          const excludeProductId = items[0].product._id || items[0].product.id;
          
          // As a fallback, if we can't get related products by category, use a hardcoded category
          const products = await ProductService.getRelatedProducts(
            excludeProductId, 
            categoryIds[0] || "electronics" // Fallback to a default category
          );
          
          setRelatedProducts(products || []);
        } else {
          // Fallback to get some products using a default category
          const defaultCategory = "electronics";
          const excludeProductId = items[0].product._id || items[0].product.id;
          const products = await ProductService.getRelatedProducts(excludeProductId, defaultCategory);
          
          setRelatedProducts(products || []);
        }
      } catch (error) {
        // Silently handle errors
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedProducts();
  }, [items]);

  const handleAddRelatedToCart = (product) => {
    const item = {
      product,
      quantity: 1
    };
    addToCart(item);
    toast.success('Added to cart!');
  };
  
  const handleRelatedWishlistToggle = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-44 lg:pt-32">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-44 lg:pt-32">
        <div className="container mx-auto px-3 sm:px-4 py-4">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-400 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Your cart is empty</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-44 lg:pt-32">
      <div className="container mx-auto px-3 sm:px-4 py-4">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Shopping Cart ({getTotalItems()} items)
          </h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6"
              >
                <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                  <img
                    src={item.product.images[0]?.url}
                    alt={item.product.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.id}`}
                    className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Brand: {item.product.brand?.name || 'Unknown'}
                  </p>
                  {item.selectedVariant && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.selectedVariant}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    {item.product.salePrice ? (
                      <>
                        <span className="text-base sm:text-lg font-bold text-red-600">
                          Ksh {item.product.salePrice}
                        </span>
                        <span className="text-sm sm:text-base text-gray-500 line-through">
                          Ksh {item.product.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        Ksh {item.product.price}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <span className="px-3 py-1.5 sm:px-4 sm:py-2 text-center min-w-[2.5rem] sm:min-w-[3rem] text-sm sm:text-base text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right flex-1 sm:flex-none">
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Ksh {((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 sticky top-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">Ksh {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm">
                    To be decided during checkout
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white">Ksh {tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                  <div className="flex justify-between">
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Ksh {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <Link
                  to="/checkout"
                  className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/shop"
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center block text-sm sm:text-base"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Security Features */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure checkout guaranteed</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You might also like - Swiper Section */}
        <section className="py-4 sm:py-6 md:py-8 mt-12 sm:mt-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              You might also like
            </h2>
            <div className="flex space-x-2">
              <button
                className="related-products-swiper-prev rounded-full p-1.5 sm:p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="related-products-swiper-next rounded-full p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                aria-label="Next"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {loadingRelated ? (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : relatedProducts.length > 0 ? (
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: '.related-products-swiper-next',
                prevEl: '.related-products-swiper-prev',
              }}
              spaceBetween={12}
              slidesPerView={2}
              breakpoints={{
                480: { slidesPerView: 2.5, spaceBetween: 16 },
                640: { slidesPerView: 3, spaceBetween: 16 },
                768: { slidesPerView: 4, spaceBetween: 16 },
                1024: { slidesPerView: 5, spaceBetween: 16 },
                1280: { slidesPerView: 6, spaceBetween: 16 },
              }}
              className="pb-6 sm:pb-8"
            >
              {relatedProducts.map((product, index) => (
                <SwiperSlide key={product._id}>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900">
                    <Link to={`/product/${product._id}`}>
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                          alt={product.title}
                          className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                        />
                        {product.salePrice && (
                          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold">
                            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-2.5 sm:p-3 flex flex-col" style={{ minHeight: '140px' }}>
                      <Link to={`/product/${product._id}`} className="hover:text-blue-600 transition-colors">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base leading-tight h-8 sm:h-10 overflow-hidden">
                          <span className="line-clamp-2">
                            {product.title}
                          </span>
                        </h3>
                      </Link>

                      <div className="mt-1">
                        <div className="flex items-baseline">
                          <p className="text-red-600 font-bold text-sm sm:text-base">
                            KES {product.salePrice || product.price}
                          </p>
                          {product.salePrice && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 line-through ml-2">
                              KES {product.price}
                            </span>
                          )}
                        </div>
                        {product.salePrice && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            Save KES {Math.floor(product.price - product.salePrice)}
                          </p>
                        )}
                      </div>

                      <div className="flex-grow"></div>
                      <div className="flex items-center gap-1 mt-2 pt-1">
                        <button
                          onClick={() => handleAddRelatedToCart(product)}
                          className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="text-xs">Add to Cart</span>
                        </button>
                        <button
                          onClick={() => handleRelatedWishlistToggle(product)}
                          className={`flex-[0.15] p-1.5 rounded-lg border transition-colors ${
                            isInWishlist(product._id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8">
              <p className="text-sm sm:text-base">No related products found</p>
            </div>
          )}

          <div className="text-center mt-6 sm:mt-8">
                      <Link
                        to="/shop?sort=check-this-out"
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-colors max-w-xs mx-auto"
                      >
                        View All Products
                      </Link>
                    </div>
        </section>
      </div>
    </div>
  );
};

export default Cart;