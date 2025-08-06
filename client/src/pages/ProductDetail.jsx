import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Minus, Plus, Share2, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductService from '../services/productService';
import toast from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const swiperRef = useRef(null);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await ProductService.getProduct(id);
        
        const transformedProduct = {
          ...productData,
          brand: productData.brand?.name || 'Unknown Brand',
          images: productData.images || [],
          tags: productData.tags || [],
          variants: productData.variants || [],
          reviews: productData.reviews || [],
          specifications: productData.specifications || {}
        };
        
        setProduct(transformedProduct);
        
        if (productData.category) {
          const related = await ProductService.getRelatedProducts(productData.id, productData.category);
          setRelatedProducts(related || []);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 lg:pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-36 lg:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error}</h2>
          <Link to="/shop" className="text-blue-600 hover:text-blue-700">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-36 lg:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product not found</h2>
          <Link to="/shop" className="text-blue-600 hover:text-blue-700">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    const variantString = Object.entries(selectedVariants)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    addToCart(product, quantity, variantString || undefined);
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  const handleVariantChange = (variantName, value) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: value
    }));
  };

  const currentPrice = product.salePrice || product.price;
  const discountPercentage = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const groupedVariants = product.variants.reduce((acc, variant) => {
    if (!acc[variant.name]) {
      acc[variant.name] = [];
    }
    acc[variant.name].push(variant.value);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-4">
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li><Link to="/shop" className="text-gray-500 hover:text-gray-700">Shop</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li><span className="text-gray-900 dark:text-white">{product.title}</span></li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] xl:grid-cols-[1fr_1.5fr] gap-4 lg:gap-6">
  {/* Image Gallery Section - Made more compact */}
  <div className="space-y-3 md:space-y-4">
    {/* Main Image - Pure containment */}
    <div className="relative aspect-square rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
      <img
        src={product.images[selectedImage]?.url}
        alt={product.title}
        className="w-full h-full object-cover"
      />
      {product.salePrice && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs md:text-sm font-semibold">
          -{discountPercentage}%
        </div>
      )}
      {product.images.length > 1 && (
        <>
          <button
            onClick={() =>
              setSelectedImage((prev) =>
                prev > 0 ? prev - 1 : product.images.length - 1
              )
            }
            className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 bg-gray-100/80 hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-sm"
          >
            <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
          </button>
          <button
            onClick={() =>
              setSelectedImage((prev) =>
                prev < product.images.length - 1 ? prev + 1 : 0
              )
            }
            className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 bg-gray-100/80 hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-sm"
          >
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
          </button>
        </>
      )}
    </div>

    {/* Thumbnails - Clean presentation */}
    {product.images.length > 1 && (
      <div className="flex space-x-2 md:space-x-3 overflow-x-auto py-1">
        {product.images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 ${
              selectedImage === index ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <img
              src={image.url}
              alt={`${product.title} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    )}
  </div>

  {/* Product Info Section - Balanced */}
  <div className="space-y-3 md:space-y-5">
    <div>
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {product.title}
      </h1>
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
        Brand: {product.brand}
      </p>
    </div>

    {/* Rating - Made more compact */}
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 md:h-5 md:w-5 ${
              i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs md:text-sm text-gray-600 dark:text-gray-300">
          {product.rating} ({product.reviewCount || 0} reviews)
        </span>
      </div>
    </div>

    {/* Price - Adjusted spacing */}
    <div className="flex items-center space-x-2">
      <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
        Ksh {currentPrice}
      </span>
      {product.salePrice && (
        <span className="text-base md:text-lg lg:text-xl text-gray-500 line-through">
          Ksh {product.price}
        </span>
      )}
      {discountPercentage > 0 && (
        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs md:text-sm font-semibold">
          Save {discountPercentage}%
        </span>
      )}
    </div>

    {/* Stock status - Made more compact */}
    <div className="flex items-center space-x-1.5">
      <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
      </span>
    </div>

    {/* Variants - Compact */}
    {Object.keys(groupedVariants).length > 0 && (
      <div className="space-y-2">
        {Object.entries(groupedVariants).map(([variantName, values]) => (
          <div key={variantName}>
            <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
              {variantName}: {selectedVariants[variantName] && (
                <span className="font-normal text-gray-600 dark:text-gray-400">
                  {selectedVariants[variantName]}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-1">
              {values.map(value => (
                <button
                  key={value}
                  onClick={() => handleVariantChange(variantName, value)}
                  className={`px-2 py-1 text-xs border rounded-md font-medium transition-colors ${
                    selectedVariants[variantName] === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Quantity - Compact */}
    <div>
      <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
        Quantity
      </h3>
      <div className="flex items-center space-x-2">
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="px-3 py-1 text-center text-sm min-w-[2rem]">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <span className="text-xs text-gray-500">
          Total: Ksh {(currentPrice * quantity).toFixed(2)}
        </span>
      </div>
    </div>

    {/* Action Buttons - Compact */}
    <div className="flex space-x-2">
      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className="bg-blue-600 text-white px-3 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5 text-sm"
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Add to Cart</span>
      </button>
      <button
        onClick={handleWishlistToggle}
        className={`px-3 py-2 rounded-md border transition-colors flex items-center space-x-1 ${
          isInWishlist(product.id)
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        <span className="text-sm">{isInWishlist(product.id) ? 'Saved' : 'Save'}</span>
      </button>
      <button className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
        <Share2 className="h-4 w-4" />
      </button>
    </div>

    {/* Features - Compact */}
    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-1.5">
        <Truck className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">Free Shipping</p>
          <p className="text-xs text-gray-500">Over Ksh 50</p>
        </div>
      </div>
      <div className="flex items-center space-x-1.5">
        <Shield className="h-4 w-4 text-green-600" />
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">Secure Payment</p>
          <p className="text-xs text-gray-500">100% secure</p>
        </div>
      </div>
      <div className="flex items-center space-x-1.5">
        <RotateCcw className="h-4 w-4 text-purple-600" />
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">Easy Returns</p>
          <p className="text-xs text-gray-500">30-day policy</p>
        </div>
      </div>
    </div>
  </div>
</div>

        <div className="mt-16">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { id: 'description', label: 'Description' },
                { id: 'specifications', label: 'Specifications' },
                { id: 'reviews', label: 'Reviews' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
                {product.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(product.specifications).length > 0 ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-900 dark:text-white">{key}</span>
                      <span className="text-gray-600 dark:text-gray-400">{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Customer Reviews ({product.reviewCount || 0})
                  </h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Write a Review
                  </button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{product.rating}</div>
                    <div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Based on {product.reviewCount || 0} reviews
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {product.reviews.length > 0 ? (
                    product.reviews.map(review => (
                      <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">{review.user?.name || 'Anonymous'}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{review.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
  <div className="mt-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Related Products</h2>
      <div className="flex space-x-2">
        <button
          className="related-products-swiper-prev rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Previous"
        >
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="related-products-swiper-next rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
          aria-label="Next"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

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
                  src={product.images?.[0]?.url || product.images?.[0] || 'https://via.placeholder.com/300'}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-t-lg hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
            <div className="p-3 flex flex-col" style={{ minHeight: '160px' }}>
              <Link to={`/product/${product._id || product.id}`}>
                <h3 className="font-medium text-gray-900 dark:text-white text-base leading-tight h-10 overflow-hidden hover:text-blue-600 transition-colors">
                  <span className="line-clamp-2">
                    {product.title}
                  </span>
                </h3>
              </Link>
              <div className="mt-1">
                <div className="flex items-baseline">
                  <p className="text-red-600 font-bold text-base">
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
                  onClick={() => addToCart(product, 1)}
                  className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2"
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Add to Cart</span>
                </button>
                <button
                  onClick={() => {
                    if (isInWishlist(product._id || product.id)) {
                      removeFromWishlist(product._id || product.id);
                      toast.success('Removed from wishlist');
                    } else {
                      addToWishlist(product);
                      toast.success('Added to wishlist!');
                    }
                  }}
                  className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors ${
                    isInWishlist(product._id || product.id)
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  } flex items-center justify-center`}
                >
                  <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isInWishlist(product._id || product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)}
      </div>
    </div>
  );
};

export default ProductDetail;