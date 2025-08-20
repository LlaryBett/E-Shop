import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star, Share2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import ProductService from '../services/productService';
import toast from 'react-hot-toast';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

const Wishlist = () => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  const { items, removeFromWishlist, clearWishlist, addToWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!items?.length) {
      
        return;
      }
      
      try {
        setLoadingRelated(true);
       // Debug: Log full items array
        
        // Find first valid product
        const validItem = items.find(item => item?.product && (item.product?._id || item.product?.id));
        if (!validItem) {
          
          return;
        }

        const firstProduct = validItem.product;
     

        // Safely get category ID
        let categoryId;
        if (firstProduct.category) {
          if (typeof firstProduct.category === 'object') {
            categoryId = firstProduct.category._id || firstProduct.category.id;
          } else {
            categoryId = firstProduct.category;
          }
        } else {
          categoryId = firstProduct.categoryId;
        }

         // Debug: Log found category ID

        if (!categoryId) {
          
          return;
        }

        const response = await ProductService.getRelatedProducts(
          firstProduct._id || firstProduct.id, 
          categoryId
        );
        
        
        // Handle various response structures
        let products;
        if (Array.isArray(response)) {
          products = response;
        } else if (Array.isArray(response?.data)) {
          products = response.data;
        } else if (Array.isArray(response?.data?.products)) {
          products = response.data.products;
        } else {
          products = [];
        }

        // Debug: Log final products array
        setRelatedProducts(products);

      } catch (error) {
        console.error('Detailed error in fetchRelatedProducts:', {
          error,
          errorMessage: error.message,
          errorStack: error.stack
        });
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedProducts();
  }, [items]);

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (product) => {
    if (isInWishlist(product._id || product.id)) {
      removeFromWishlist(product._id || product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  const handleRemoveFromWishlist = (id) => {
    removeFromWishlist(id);
    toast.success('Removed from wishlist');
  };

  const handleClearWishlist = () => {
    clearWishlist();
    toast.success('Wishlist cleared');
  };

  const handleShare = (product) => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: `${window.location.origin}/product/${product.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleAddRelatedToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart!');
  };
  
  const handleRelatedWishlistToggle = (product) => {
    if (isInWishlist(product._id || product.id)) {
      removeFromWishlist(product._id || product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
          <div className="text-center">
            <Heart className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-400 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
              Your wishlist is empty
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
              Save items you love to your wishlist and never lose track of them.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
            >
              <span>Start Shopping</span>
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            My Wishlist ({items.length} items)
          </h1>
          <button
            onClick={handleClearWishlist}
            className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {items.filter(item => item?.product).map((item) => {
            const product = item.product;
            const productId = product?._id || product?.id;
            
            if (!productId) return null; // Skip invalid products
            
            return (
              <div
                key={productId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900"
              >
                <div className="h-36 sm:h-40 overflow-hidden relative">
                  <Link to={`/product/${productId}`}>
                    <img 
                      src={product.images?.[0]?.url || product.images?.[0] || ''}
                      alt={product.title || 'Product'}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </Link>
                  {/* Discount Badge */}
                  {product.salePrice && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 fill-current" />
                  </button>
                </div>

                <div className="px-3 pb-3 flex flex-col" style={{ minHeight: '120px' }}>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base leading-tight h-7 sm:h-8 overflow-hidden">
                    <Link to={`/product/${productId}`} className="hover:text-blue-600 transition-colors">
                      <span className="line-clamp-2">
                        {product.title}
                      </span>
                    </Link>
                  </h3>

                  {/* Price Section */}
                  <div className="mt-1">
                    <div className="flex items-baseline">
                      <p className="text-xs sm:text-sm font-bold text-red-600">
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
                  
                  {/* Buttons Container */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1 pt-1">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors text-xs sm:text-sm ${
                        isInWishlist(product._id || product.id)
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      } flex items-center justify-center`}
                    >
                      <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist(product._id || product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wishlist Actions */}
        <div className="mt-8 sm:mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">Wishlist Actions</h2>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => {
                items.forEach(item => addToCart(item.product));
                toast.success('All items added to cart!');
              }}
              className="flex-1 basis-[45%] px-3 py-2 sm:px-4 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Add All to Cart</span>
            </button>
            <button
              onClick={() =>
                handleShare({
                  title: 'My Wishlist',
                  description: 'Check out my wishlist!',
                })
              }
              className="flex-1 basis-[45%] px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Share Wishlist</span>
            </button>
          </div>
        </div>

        {/* You might also like - Swiper Section */}
        <section className="py-2 sm:py-4 md:py-6 mt-8 sm:mt-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              You might also like
            </h2>
            <div className="flex space-x-2">
              <button
                className="related-products-swiper-prev rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="related-products-swiper-next rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                aria-label="Next"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {loadingRelated ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : relatedProducts.length > 0 ? (
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: '.related-products-swiper-next',
                prevEl: '.related-products-swiper-prev',
              }}
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                480: { slidesPerView: 2.5 },
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
              }}
              className="pb-8"
            >
              {relatedProducts.map((product) => (
                <SwiperSlide key={product._id || product.id}>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900">
                    <Link to={`/product/${product._id || product.id}`}>
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                          alt={product.title}
                          className="w-full h-36 sm:h-48 object-cover rounded-t-lg hover:scale-105 transition-transform duration-300"
                        />
                        {product.salePrice && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-3 flex flex-col" style={{ minHeight: '140px' }}>
                      <Link to={`/product/${product._id || product.id}`} className="hover:text-blue-600 transition-colors">
                        <h3 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm leading-tight h-8 overflow-hidden">
                          <span className="line-clamp-2">
                            {product.title}
                          </span>
                        </h3>
                      </Link>

                      <div className="mt-1">
                        <div className="flex items-baseline">
                          <p className="text-xs font-bold text-red-600">
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
                      <div className="flex items-center gap-0.5 sm:gap-1 mt-1 pt-1">
                        <button
                          onClick={() => handleAddRelatedToCart(product)}
                          className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                        >
                          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={() => handleRelatedWishlistToggle(product)}
                          className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors text-xs sm:text-sm ${
                            isInWishlist(product._id || product.id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist(product._id || product.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-8">
              <p>No related products found</p>
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

export default Wishlist;