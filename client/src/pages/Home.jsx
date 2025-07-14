import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Award } from 'lucide-react';
import ProductService from '../services/productService';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both in parallel
      const [featured, trending] = await Promise.all([
        ProductService.getFeaturedProducts(),
        ProductService.getTrendingProducts()
      ]);

      // Handle direct array response
      setFeaturedProducts(Array.isArray(featured) ? featured : []);
      setTrendingProducts(Array.isArray(trending) ? trending : []);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, []);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Discover Amazing Products
              </h1>
              <p className="text-xl text-blue-100">
                Shop the latest trends with fast delivery, secure payments, and unbeatable prices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Shopping"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

     {/* Featured Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Products</h2>
            <p className="text-gray-600 dark:text-gray-300">Discover our most popular items</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product._id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${product._id}`}>
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                          {product.rating || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-red-600">${product.salePrice}</span>
                          <span className="text-gray-500 line-through">${product.price}</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>View All Products</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Trending Now</h2>
            <p className="text-gray-600 dark:text-gray-300">What's hot this week</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product) => (
              <div key={product._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${product._id}`}>
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                          {product.rating || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-red-600">${product.salePrice}</span>
                          <span className="text-gray-500 line-through">${product.price}</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-8">Subscribe to our newsletter for exclusive offers and updates</p>
          <div className="max-w-md mx-auto">
            <form className="flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;