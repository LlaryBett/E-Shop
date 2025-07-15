import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star, Share2 } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart!');
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your wishlist is empty</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Save items you love to your wishlist and never lose track of them.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Start Shopping</span>
              <ShoppingCart className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Wishlist ({items.length} items)
          </h1>
          <button
            onClick={handleClearWishlist}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product;
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative">
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.images[0]?.url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  
                  {product.salePrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                      -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  </button>
                </div>

                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Brand: {product.brand}
                  </p>

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

                  <div className="flex items-center space-x-2 mb-4">
                    {product.salePrice ? (
                      <>
                        <span className="text-lg font-bold text-red-600">${product.salePrice}</span>
                        <span className="text-gray-500 line-through">${product.price}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => handleShare(product)}
                      className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wishlist Actions */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Wishlist Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                items.forEach(item => addToCart(item.product));
                toast.success('All items added to cart!');
              }}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add All to Cart</span>
            </button>
            <button
              onClick={() => handleShare({ title: 'My Wishlist', description: 'Check out my wishlist!' })}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="h-5 w-5" />
              <span>Share Wishlist</span>
            </button>
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">You might also like</h2>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>Recommended products based on your wishlist would appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;