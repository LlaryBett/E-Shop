import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Award, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import ProductService from '../services/productService';
import PromoModalManager from '../components/common/PromoModalManager';
import ExitIntentModal from '../components/common/ExitIntentModal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const heroSlides = [
    {
      id: 1,
      title: "Discover Amazing Products",
      subtitle: "Shop the latest trends with fast delivery, secure payments, and unbeatable prices.",
      image: "https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Shop Now",
      ctaLink: "/shop",
      badge: "New Collection"
    },
    {
      id: 2,
      title: "Tech Innovation Hub",
      subtitle: "Explore cutting-edge technology and gadgets that will transform your daily life.",
      image: "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Explore Tech",
      ctaLink: "/shop?category=Electronics",
      badge: "Latest Tech"
    },
    {
      id: 3,
      title: "Fashion Forward",
      subtitle: "Stay stylish with our curated collection of premium fashion and accessories.",
      image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Shop Fashion",
      ctaLink: "/shop?category=Clothing",
      badge: "Trending Now"
    },
    {
      id: 4,
      title: "Home & Lifestyle",
      subtitle: "Transform your living space with our premium home and kitchen essentials.",
      image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Shop Home",
      ctaLink: "/shop?category=Home",
      badge: "Best Sellers"
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Remove the type annotation from goToSlide
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      ProductService.getFeaturedProducts(),
      ProductService.getTrendingProducts()
    ])
      .then(([featured, trending]) => {
        setFeaturedProducts(Array.isArray(featured) ? featured : []);
        setTrendingProducts(Array.isArray(trending) ? trending : []);
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
    <div className="min-h-screen">
      {/* Promo Modals */}
      <PromoModalManager />
      <ExitIntentModal />

      {/* Hero Carousel Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">
            {/* Content Side */}
            <div className="space-y-8 z-10 relative">
              <div className="inline-block">
                <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                  {heroSlides[currentSlide].badge}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {heroSlides[currentSlide].title}
              </h1>
              
              <p className="text-xl text-blue-100 max-w-lg">
                {heroSlides[currentSlide].subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={heroSlides[currentSlide].ctaLink}
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 inline-flex items-center space-x-2 transform hover:scale-105"
                >
                  <span>{heroSlides[currentSlide].cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                >
                  {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                
                <div className="flex space-x-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Image Carousel Side */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {heroSlides.map((slide, index) => (
                    <div key={slide.id} className="w-full flex-shrink-0">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-[400px] lg:h-[500px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Slide Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  {currentSlide + 1} / {heroSlides.length}
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-pink-400 rounded-full opacity-20 animate-bounce"></div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose E-Shop?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the difference with our premium services and customer-first approach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Free Shipping</h3>
              <p className="text-gray-600 dark:text-gray-300">Free delivery on orders over $50 with tracking included</p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Learn More →</div>
            </div>

            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Secure Payment</h3>
              <p className="text-gray-600 dark:text-gray-300">256-bit SSL encryption for all transactions and data</p>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Security Details →</div>
            </div>

            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Headphones className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-300">Round-the-clock customer service via chat, email, and phone</p>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Contact Support →</div>
            </div>

            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Quality Guarantee</h3>
              <p className="text-gray-600 dark:text-gray-300">Premium quality products with 30-day money-back guarantee</p>
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Our Promise →</div>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 dark:bg-blue-900/20 rounded-full -translate-x-32 -translate-y-32 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full translate-x-48 translate-y-48 opacity-50"></div>
      </section>

      {/* Enhanced Featured Products */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Handpicked for You
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Featured Products</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover our most popular items, carefully selected for quality and customer satisfaction
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product._id || product.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                <Link to={`/product/${product._id || product.id}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.images?.[0]?.url || product.images?.[0] || ''}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.salePrice && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                        -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                  <div className="p-6">
                    <div className="mb-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                        {typeof product.brand === 'object' ? product.brand.name : product.brand}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({product.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-xl font-bold text-red-600">Ksh {product.salePrice}</span>
                            <span className="text-gray-500 line-through text-sm">Ksh {product.price}</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-900 dark:text-white">Ksh {product.price}</span>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>View All Products</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Products with Enhanced Design */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              🔥 Hot This Week
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Trending Now</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Stay ahead of the curve with the most popular products this week
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingProducts.map((product, index) => (
              <div key={product._id || product.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
                <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                  #{index + 1} Trending
                </div>
                <Link to={`/product/${product._id || product.id}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.images?.[0]?.url || product.images?.[0] || ''}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({product.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-red-600">Ksh {product.salePrice}</span>
                          <span className="text-gray-500 line-through">Ksh {product.price}</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Ksh {product.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stay in the Loop
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Subscribe to our newsletter for exclusive offers, new product launches, and insider tips
            </p>
            
            <div className="max-w-md mx-auto">
              <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-4 rounded-xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 text-gray-900 placeholder-gray-500"
                  disabled={newsletterLoading}
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  disabled={newsletterLoading}
                >
                  {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              <p className="text-blue-100 text-sm mt-4">
                Join 50,000+ subscribers. No spam, unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-36 -translate-y-36 animate-pulse"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 animate-bounce"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/10 rounded-full translate-y-32 animate-pulse"></div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Thousands
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">50K+</div>
                <div className="text-gray-600 dark:text-gray-400">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">1M+</div>
                <div className="text-gray-600 dark:text-gray-400">Products Sold</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">25+</div>
                <div className="text-gray-600 dark:text-gray-400">Countries Served</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">4.9★</div>
                <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;