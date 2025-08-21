import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Award, ChevronLeft, ChevronRight, Play, Pause, ShoppingCart, Heart } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProductService from '../services/productService';

;
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import toast from 'react-hot-toast';

// Updated Visa Promo Banner component with minimal top margin
const VisaPromoBanner = () => {
  return (
    <section className="relative overflow-hidden mt-4 sm:mt-1">
  <div className="max-w-[1320px] mx-auto px-4 lg:px-6">
    <div className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center border border-blue-800 shadow-sm rounded-2xl px-2 py-2 sm:px-3 sm:py-3 overflow-hidden">
      <p className="text-[11px] xs:text-xs sm:text-sm md:text-base font-medium animate-pulse leading-snug">
        ⚡ Get <span className="font-bold text-yellow-300">FREE delivery</span> on orders above 2,000 KES.
      </p>
    </div>
  </div>
</section>

  );
};

// Home component
const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);
  const { categories } = useCategories();
  const [newArrivalProducts, setNewArrivalProducts] = useState([]);
  const newArrivalsSwiperRef = useRef(null);
  const [checkThisOutProducts, setCheckThisOutProducts] = useState([]);
  const checkThisOutSwiperRef = useRef(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Banner data
  const banners = [
    {
      id: 1,
      image: "/assets/Banner ecommerce smartwatch electronics store product promotion dropshipping offer instagram stories (1).mp4",
      ctaLink: "/shop/new-arrivals"
    },
    {
      id: 2,
      image: "/assets/22af748c6ba4975c1ba122c769ba8ed99f3ade899c16be44a3c4e849924d9a08.jpg",
      ctaLink: "/shop/audio"
    },
    {
      id: 3,
      image: "/assets/Blue Photo Beauty Skincare Blog Banner (2).jpg",
      ctaLink: "/shop/organic"
    },
    {
      id: 4,
      image: "/assets/Purple Green  Colorful Organic Illustrative Online Shop Banner.png",
      ctaLink: "/shop/outdoor"
    }
  ];

  // Banner carousel state
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play banner carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToBanner = (index) => {
    setCurrentBanner(index);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      ProductService.getFeaturedProducts(),
      ProductService.getTrendingProducts(),
      ProductService.getProducts(1, 100)
    ])
      .then(([featured, trending, productsData]) => {
        setFeaturedProducts(Array.isArray(featured) ? featured : []);
        setTrendingProducts(Array.isArray(trending) ? trending : []);
        const products = productsData && productsData.products ? productsData.products : [];
        const brandMap = new Map();
        products.forEach((p) => {
          if (p.brand && p.brand._id) {
            brandMap.set(p.brand._id, p.brand);
          }
        });
        const brandsList = Array.from(brandMap.values());
        setBrands(brandsList);

        const sortedNewArrivals = [...products]
          .filter(p => p.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNewArrivalProducts(sortedNewArrivals);

        const sortedCheckThisOut = [...products]
          .filter(p => typeof p.rating === 'number')
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10);
        setCheckThisOutProducts(sortedCheckThisOut);
      })
      .finally(() => setLoading(false));
  }, []);

  const { subscribeNewsletter } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Newsletter submit handler
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error('Please enter your email');
      return;
    }
    setNewsletterLoading(true);
    try {
      await subscribeNewsletter(newsletterEmail);
      toast.success('Successfully subscribed to newsletter!');
      setNewsletterEmail('');
    } catch (err) {
      // Show the error message from backend
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    }
    setNewsletterLoading(false);
  };

  // Update the handlers to prevent event bubbling
  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product._id || product.id)) {
      removeFromWishlist(product._id || product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 lg:pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <VisaPromoBanner />

      {/* Banner Display Section */}
      <section className="relative overflow-hidden mt-4">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-6">
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: '4.6875/1' }}
          >
            {/* Banner Images */}
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="w-full h-full flex-shrink-0 relative"
                >
                  {banner.image.endsWith('.mp4') ? (
                    <video
                      src={banner.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <img
                      src={banner.image}
                      alt={`Banner ${banner.id}`}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {/* Shop Now button removed */}
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevBanner}
              aria-label="Previous banner"
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 p-1 md:p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-white/20"
            >
              <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
            </button>
            <button
              onClick={nextBanner}
              aria-label="Next banner"
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 p-1 md:p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-white/20"
            >
              <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
            </button>

            {/* Indicators */}
            <div
              className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 md:space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1"
              role="group"
              aria-label="Banner indicators"
            >
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToBanner(index)}
                  aria-label={`Go to banner ${index + 1}`}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                    index === currentBanner
                      ? 'bg-white scale-125 shadow-sm'
                      : 'bg-white/50 hover:bg-white/75 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 pb-4 mt-6 overflow-x-auto">
  <div className="grid grid-cols-3 gap-2 sm:gap-4 min-w-full">
    {/* CLUB Card */}
    <Link
      to="/wallet"
      className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] sm:text-xs hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200"
    >
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <div className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] sm:text-sm">CLUB</div>
          <div className="flex items-center text-gray-900 dark:text-white text-[10px] sm:text-xs">
            Earn more 
            <ArrowRight className="h-3 w-3 ml-1 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    </Link>

    {/* Leaflet Card */}
    <Link
      to="/promotions?type=leaflet"
      className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] sm:text-xs hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200"
    >
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
        <div>
          <div className="text-green-600 dark:text-green-400 font-semibold text-[11px] sm:text-sm">Leaflet</div>
          <div className="flex items-center text-gray-900 dark:text-white text-[10px] sm:text-xs">
            Leaflet store 
            <ArrowRight className="h-3 w-3 ml-1 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
    </Link>

    {/* Hurry Card */}
    <Link
      to="/orders"
      state={{ fromQuickLink: true }}
      className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] sm:text-xs hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200"
    >
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
        <div>
          <div className="text-orange-600 dark:text-orange-400 font-semibold text-[11px] sm:text-sm">In a hurry?</div>
          <div className="flex items-center text-gray-900 dark:text-white text-[10px] sm:text-xs">
            Buy again 
            <ArrowRight className="h-3 w-3 ml-1 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </Link>
  </div>
</div>


      {/* Shop by Brand Section */}
      <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-6">
          Shop by Brand
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-4">
          {brands.map((brand) => (
            <Link
              key={brand._id}
              to={`/shop?brand=${encodeURIComponent(brand._id)}`}
              className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-2 border border-gray-300 dark:border-gray-600 group-hover:scale-105 transition-transform duration-200">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-200 truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
      


      {/* Enhanced Featured Products */}
      <section className="py-3 sm:py-4 md:py-6">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => swiperRef.current?.slidePrev()}
                type="button"
              >
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => swiperRef.current?.slideNext()}
                type="button"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              480: { slidesPerView: 2.5 },
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="pb-8"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product._id || product.id}>
                <Link to={`/product/${product._id || product.id}`} className="block">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900">
                    <div className="aspect-square overflow-hidden relative">
                      <img 
                        src={product.images?.[0]?.url || product.images?.[0] || ''}
                        alt={product.title}
                        className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                      />
                      {product.salePrice && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col" style={{ minHeight: '140px' }}>
                      <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white leading-tight h-8 sm:h-10 overflow-hidden">
                        <span className="line-clamp-2">
                          {product.title}
                        </span>
                      </h3>
                      <div className="mt-1">
                        <div className="flex items-baseline">
                          <p className="text-base font-bold sm:text-lg text-red-600">
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
                          onClick={(e) => handleAddToCart(e, product)}
                          className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                        >
                          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={(e) => handleWishlistToggle(e, product)}
                          className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors ${
                            isInWishlist(product._id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="text-center mt-6 sm:mt-8">
            <Link
              to="/shop?sort=check-this-out"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-colors max-w-xs mx-auto"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-1">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-3 sm:gap-6 md:gap-7 mb-3 sm:mb-5 md:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Shop by Category
            </h2>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={() => swiperRef.current?.slidePrev()}
                type="button"
                aria-label="Previous categories"
              >
                <svg
                  className="w-4 h-4 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                onClick={() => swiperRef.current?.slideNext()}
                type="button"
                aria-label="Next categories"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              480: { slidesPerView: 2.5 },
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="px-1"
          >
            {categories.map((category) => (
              <SwiperSlide key={category._id} className="h-full">
                <Link
                  to={`/category/${category.slug}`}
                  className="block h-52 bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="pt-5 flex justify-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden relative shadow-md">
                      <img
                        src={category.image?.url || ''}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-full" />
                    </div>
                  </div>
                  <div className="px-4 pb-5 pt-4 text-center">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-200">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      

      {/* New Arrivals */}
      <section className="py-3 sm:py-4 md:py-6">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              New Arrivals
            </h2>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => newArrivalsSwiperRef.current?.slidePrev()}
                type="button"
              >
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => newArrivalsSwiperRef.current?.slideNext()}
                type="button"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              480: { slidesPerView: 2.5 },
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            onSwiper={(swiper) => {
              newArrivalsSwiperRef.current = swiper;
            }}
            className="pb-8"
          >
            {newArrivalProducts.map((product) => (
              <SwiperSlide key={product._id || product.id}>
                <Link to={`/product/${product._id || product.id}`} className="block">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900">
                    <div className="aspect-square overflow-hidden relative">
                      <img 
                        src={product.images?.[0]?.url || product.images?.[0] || ''}
                        alt={product.title}
                        className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                      />
                      {product.salePrice && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col" style={{ minHeight: '140px' }}>
                      <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white leading-tight h-8 sm:h-10 overflow-hidden">
                        <span className="line-clamp-2">
                          {product.title}
                        </span>
                      </h3>
                      <div className="mt-1">
                        <div className="flex items-baseline">
                          <p className="text-base font-bold sm:text-lg text-red-600">
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
                          onClick={(e) => handleAddToCart(e, product)}
                          className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                        >
                          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={(e) => handleWishlistToggle(e, product)}
                          className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors ${
                            isInWishlist(product._id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="text-center mt-6 sm:mt-8">
            <Link
              to="/shop?sort=check-this-out"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-colors max-w-xs mx-auto"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

    

<section className="relative overflow-hidden mt-4">
  <div className="max-w-[1320px] mx-auto px-4 lg:px-6">
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: '4.6875/1' }}
    >
      <Link to="/shop">
        <img
          src="/assets/E-SHOP BRAND.jpg"
          alt="E-Shop Brand Banner"
          className="w-full h-full object-cover object-center cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
          loading="lazy"
        />
      </Link>
    </div>
  </div>
</section>


      {/* Just for you */}
      <section className="py-3 sm:py-4 md:py-6">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Just For You
            </h2>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                className="just-for-you-swiper-prev rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="just-for-you-swiper-next rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
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
              nextEl: '.just-for-you-swiper-next',
              prevEl: '.just-for-you-swiper-prev',
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
            {trendingProducts.map((product, index) => (
              <SwiperSlide key={product._id || product.id}>
                <Link to={`/product/${product._id || product.id}`} className="block">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900">
                    <div className="aspect-square overflow-hidden relative">
                      <img 
                        src={product.images?.[0]?.url || product.images?.[0] || ''}
                        alt={product.title}
                        className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{index + 1} Trending
                      </div>
                    </div>
                    <div className="p-3 flex flex-col" style={{ minHeight: '140px' }}>
                      <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white leading-tight h-8 sm:h-10 overflow-hidden">
                        <span className="line-clamp-2">
                          {product.title}
                        </span>
                      </h3>
                      <div className="mt-1">
                        <div className="flex items-baseline">
                          <p className="text-base font-bold sm:text-lg text-red-600">
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
                          onClick={(e) => handleAddToCart(e, product)}
                          className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                        >
                          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={(e) => handleWishlistToggle(e, product)}
                          className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors ${
                            isInWishlist(product._id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="text-center mt-6 sm:mt-8">
            <Link
              to="/shop?sort=check-this-out"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-colors max-w-xs mx-auto"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Check This Out */}
      <section className="py-3 sm:py-4 md:py-6">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Check This Out
            </h2>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => checkThisOutSwiperRef.current?.slidePrev()}
                type="button"
              >
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="rounded-full p-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => checkThisOutSwiperRef.current?.slideNext()}
                type="button"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              480: { slidesPerView: 2.5 },
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
            }}
            onSwiper={(swiper) => {
              checkThisOutSwiperRef.current = swiper;
            }}
            className="pb-8"
          >
            {checkThisOutProducts.map((product) => {
             
              return (
                <SwiperSlide key={product._id || product.id}>
                  <Link to={`/product/${product._id || product.id}`} className="block">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900">
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={product.images?.[0]?.url || product.images?.[0] || ''}
                          alt={product.title}
                          className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                        />
                        {product.salePrice && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col" style={{ minHeight: '140px' }}>
                        <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white leading-tight h-8 sm:h-10 overflow-hidden">
                          <span className="line-clamp-2">
                            {product.title}
                          </span>
                        </h3>
                        <div className="mt-1">
                          <div className="flex items-baseline">
                            <p className="text-base font-bold sm:text-lg text-red-600">
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
                            onClick={(e) => handleAddToCart(e, product)}
                            className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                          >
                            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Add to Cart</span>
                          </button>
                          <button
                            onClick={(e) => handleWishlistToggle(e, product)}
                            className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors ${
                              isInWishlist(product._id)
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            } flex items-center justify-center`}
                          >
                            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>

          <div className="text-center mt-6 sm:mt-8">
            <Link
              to="/shop?sort=check-this-out"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-colors max-w-xs mx-auto"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-8 sm:py-12 bg-blue-600">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 text-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
              Stay Updated
            </h2>
            <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6">
              Get exclusive offers and new arrivals
            </p>
            <form
              className="flex gap-1 sm:gap-2 w-full"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email"
                className="flex-grow min-w-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base"
                disabled={newsletterLoading}
              />
              <button
                type="submit"
                className="shrink-0 px-3 sm:px-4 py-2 sm:py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-xs sm:text-sm"
                disabled={newsletterLoading}
              >
                {newsletterLoading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home;