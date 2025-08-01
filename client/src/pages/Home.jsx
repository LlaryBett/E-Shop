import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Award, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProductService from '../services/productService';
import PromoModalManager from '../components/common/PromoModalManager';
import ExitIntentModal from '../components/common/ExitIntentModal';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import toast from 'react-hot-toast';

// Updated Visa Promo Banner component with better spacing and visibility
const VisaPromoBanner = () => {
  return (
    <section className="relative overflow-hidden">
  <div className="container mx-auto px-4">
    <div className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center border-b border-blue-800 shadow-sm rounded-b-2xl mt-6 sm:mt-8 px-3 py-2 sm:py-3 overflow-hidden">
      <p className="text-xs sm:text-sm md:text-base font-medium animate-pulse leading-snug">
        🎉 Use code <span className="font-bold text-yellow-300">VISA500</span> to save 500 KES with Visa.
        <a href="/terms" className="underline ml-1 hover:opacity-80 whitespace-nowrap">T&Cs Apply</a>
      </p>
    </div>
  </div>
</section>

  );
};

// comments
const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [brands, setBrands] = useState([]); // <-- Add brands state
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);
  const { categories } = useCategories();
  const [newArrivalProducts, setNewArrivalProducts] = useState([]);
  const newArrivalsSwiperRef = useRef(null);
  const [checkThisOutProducts, setCheckThisOutProducts] = useState([]);
  const checkThisOutSwiperRef = useRef(null);

  // Banner data (replace heroSlides)
  const banners = [
    {
      id: 1,
     
      image: "/assets/Gray and Black Minimalist Fashion Style Banner (1).jpg",
      
      ctaLink: "/shop/new-arrivals"
    },
    {
      id: 2,

      image: "/assets/Black White Minimalist Gaming Banner Landscape.jpg",
     
      ctaLink: "/shop/audio"
    },
    {
      id: 3,
      
      image: "/assets/Yellow and Green Modern Food Delivery Service Banner Landscape.jpg",
      
      ctaLink: "/shop/organic"
    },
    {
      id: 4,
     
      image: "/assets/Purple Green  Colorful Organic Illustrative Online Shop Banner.jpg",
     
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
      ProductService.getProducts(1, 100) // Always pass all params, even if undefined
    ])
      .then(([featured, trending, productsData]) => {
        setFeaturedProducts(Array.isArray(featured) ? featured : []);
        setTrendingProducts(Array.isArray(trending) ? trending : []);
        // Defensive: productsData may be undefined if API fails
        const products = productsData && productsData.products ? productsData.products : [];
        const brandMap = new Map();
        products.forEach((p) => {
          if (p.brand && p.brand._id) {
            brandMap.set(p.brand._id, p.brand);
          }
        });
        const brandsList = Array.from(brandMap.values());
        setBrands(brandsList);

        // Sort products by createdAt descending for new arrivals
        const sortedNewArrivals = [...products]
          .filter(p => p.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNewArrivalProducts(sortedNewArrivals);

        // Example: "Check This Out" products - pick top 10 by rating (customize as needed)
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
      setNewsletterEmail('');
    } catch (err) {
      // Error toast handled in context
    }
    setNewsletterLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VisaPromoBanner />

      {/* Promo Modals */}
      <PromoModalManager />
      <ExitIntentModal />

      {/* Banner Display Section - Replaces the Hero Carousel */}
      <section className="relative overflow-hidden">
  <div className="container mx-auto px-4 py-2">
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-700"
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
            className="w-full h-full flex-shrink-0 relative bg-gray-300 dark:bg-gray-600"
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />

            {/* Content overlay (no gradient) */}
            <div className="absolute inset-0 flex items-end p-4 md:p-8">
              <div className="text-white max-w-2xl">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold mb-1 md:mb-2 drop-shadow-lg">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-2 md:mb-4 text-gray-100 drop-shadow-md">
                  {banner.subtitle}
                </p>
              </div>
            </div>
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



  
  <div className="container mx-auto px-2 pb-4 overflow-x-auto">
  <div className="grid grid-cols-3 gap-2 sm:gap-4 -mt-2 min-w-full">
    
    {/* CLUB Card */}
    <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] sm:text-xs">
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
    </div>

    {/* Leaflet Card */}
    <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] sm:text-xs">
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
    </div>

    {/* Hurry Card */}
    <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] sm:text-xs">
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
    </div>

  </div>
</div>

{/* Shop by Brand Section */}
<div className="container mx-auto px-4 pb-8">
  <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6">
    Shop by Brand
  </h2>
     
  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
    {brands.map((brand) => (
      <div
        key={brand._id}
        className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200 cursor-pointer group"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-2 border border-gray-300 dark:border-gray-600 group-hover:scale-105 transition-transform duration-200">
          <img
            src={brand.logo}
            alt={brand.name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-200 truncate w-full">
          {brand.name}
        </span>
      </div>
    ))}
  </div>
</div>




     

      {/* Enhanced Featured Products */}
    <section className="py-12 sm:py-14 md:py-18">
  <div className="container mx-auto px-4">
    {/* Header + Navigation */}
    <div className="flex items-center justify-between gap-5 sm:gap-6 md:gap-7 mb-10 sm:mb-12 md:mb-14">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Featured Products
      </h2>
      <div className="flex space-x-2">
        <button
          className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => swiperRef.current?.slidePrev()}
          type="button"
        >
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="rounded-full p-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => swiperRef.current?.slideNext()}
          type="button"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    {/* Swiper Carousel */}
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
      pagination={{ clickable: true }}
      className="px-1 pb-10"
    >
      {featuredProducts.map((product) => (
        <SwiperSlide key={product._id || product.id} className="h-full">
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1.5">
            <Link to={`/product/${product._id || product.id}`} className="flex flex-col h-full">
              {/* Image */}
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.images?.[0]?.url || product.images?.[0] || ''}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.salePrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 uppercase font-medium tracking-wide">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </span>

                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-1">
                        {product.rating}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      ({product.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Price + Arrow */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-red-600">Ksh {product.salePrice}</span>
                        <span className="text-xs text-gray-500 line-through">Ksh {product.price}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Ksh {product.price}</span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>

    {/* View All Button */}
    <div className="text-center mt-12">
      <Link
        to="/shop"
        className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
      >
        <span>View All</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
</section>

<section className="py-1">
  <div className="container mx-auto px-4">
    {/* Header + Navigation */}
    <div className="flex items-center justify-between gap-5 sm:gap-6 md:gap-7 lg:gap-8 mb-10 sm:mb-12 md:mb-14 lg:mb-16">
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
        Shop by Category
      </h2>
      <div className="flex space-x-2">
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

    {/* Swiper Carousel */}
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
            {/* Circular Image */}
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

            {/* Name */}
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

<section className="py-12 sm:py-14 md:py-18">
  <div className="container mx-auto px-4">
    {/* Header + Navigation */}
    <div className="flex items-center justify-between gap-5 sm:gap-6 md:gap-7 mb-10 sm:mb-12 md:mb-14">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        New Arrivals
      </h2>
      <div className="flex space-x-2">
        <button
          className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => newArrivalsSwiperRef.current?.slidePrev()}
          type="button"
        >
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="rounded-full p-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => newArrivalsSwiperRef.current?.slideNext()}
          type="button"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    {/* Swiper Carousel */}
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
      pagination={{ clickable: true }}
      className="px-1 pb-10"
    >
      {newArrivalProducts.map((product) => (
        <SwiperSlide key={product._id || product.id} className="h-full">
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1.5">
            <Link to={`/product/${product._id || product.id}`} className="flex flex-col h-full">
              {/* Image */}
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.images?.[0]?.url || product.images?.[0] || ''}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.salePrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 uppercase font-medium tracking-wide">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </span>

                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-1">
                        {product.rating}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      ({product.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Price + Arrow */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-red-600">Ksh {product.salePrice}</span>
                        <span className="text-xs text-gray-500 line-through">Ksh {product.price}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Ksh {product.price}</span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>

    {/* View All Button */}
    <div className="text-center mt-12">
      <Link
        to="/shop?sort=newest"
        className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
      >
        <span>View All</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
</section>






      {/* Trending Products with Enhanced Design */}
     <section className="py-12 sm:py-14 md:py-18">
  <div className="container mx-auto px-4">
    {/* Header + Navigation */}
    <div className="flex items-center justify-between gap-5 sm:gap-6 md:gap-7 mb-10 sm:mb-12 md:mb-14">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Trending Now
      </h2>
      <div className="flex space-x-2">
        <button
          className="trending-swiper-prev rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          aria-label="Previous"
        >
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="trending-swiper-next rounded-full p-2 bg-blue-600 hover:bg-blue-700"
          aria-label="Next"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    {/* Swiper Carousel */}
    <Swiper
      modules={[Navigation]}
      navigation={{
        nextEl: '.trending-swiper-next',
        prevEl: '.trending-swiper-prev',
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
      className="px-1 pb-10"
    >
      {trendingProducts.map((product, index) => (
        <SwiperSlide key={product._id || product.id} className="h-full">
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1.5 relative">
            {/* Badge */}
            <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold z-10">
              #{index + 1} Trending
            </div>

            <Link to={`/product/${product._id || product.id}`} className="flex flex-col h-full">
              {/* Image */}
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.images?.[0]?.url || product.images?.[0] || ''}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 uppercase font-medium tracking-wide">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </span>

                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-1">
                        {product.rating}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      ({product.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Price + Arrow */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-red-600">Ksh {product.salePrice}</span>
                        <span className="text-xs text-gray-500 line-through">Ksh {product.price}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Ksh {product.price}</span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>


<section className="py-12 sm:py-14 md:py-18">
  <div className="container mx-auto px-4">
    {/* Header + Navigation */}
    <div className="flex items-center justify-between gap-5 sm:gap-6 md:gap-7 mb-10 sm:mb-12 md:mb-14">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Check This Out
      </h2>
      <div className="flex space-x-2">
        <button
          className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => checkThisOutSwiperRef.current?.slidePrev()}
          type="button"
        >
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="rounded-full p-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => checkThisOutSwiperRef.current?.slideNext()}
          type="button"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    {/* Swiper Carousel */}
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
      pagination={{ clickable: true }}
      className="px-1 pb-10"
    >
      {checkThisOutProducts.map((product) => (
        <SwiperSlide key={product._id || product.id} className="h-full">
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1.5">
            <Link to={`/product/${product._id || product.id}`} className="flex flex-col h-full">
              {/* Image */}
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.images?.[0]?.url || product.images?.[0] || ''}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.salePrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 uppercase font-medium tracking-wide">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </span>

                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  <div className="flex items-center space-x-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-1">
                        {product.rating}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      ({product.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Price + Arrow */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-red-600">Ksh {product.salePrice}</span>
                        <span className="text-xs text-gray-500 line-through">Ksh {product.price}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Ksh {product.price}</span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>

    {/* View All Button */}
    <div className="text-center mt-12">
      <Link
        to="/shop?sort=check-this-out"
        className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
      >
        <span>View All</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
</section>

      {/* Enhanced Newsletter Section */}
      <section className="py-12 bg-blue-600">
  <div className="container mx-auto px-4 text-center">
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-3">
        Stay Updated
      </h2>
      <p className="text-blue-100 mb-6">
        Get exclusive offers and new arrivals
      </p>
      
      <form className="flex gap-2" onSubmit={handleNewsletterSubmit}>
        <input
          type="email"
          value={newsletterEmail}
          onChange={e => setNewsletterEmail(e.target.value)}
          placeholder="Your email"
          className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
          disabled={newsletterLoading}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          disabled={newsletterLoading}
        >
          {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    </div>
  </div>
</section>

      {/* Social Proof Section */}
      
    </div>
  );
};

export default Home;