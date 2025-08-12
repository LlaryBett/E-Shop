import React, { useEffect, useState } from 'react';
import { X, Gift, Percent, Star, ShoppingBag, Clock, ArrowRight } from 'lucide-react';

const PromoModal = ({ 
  type = 'sale', 
  delay = 5000, 
  showOnce = true,
  title,
  description,
  buttonText,
  buttonLink,
  discountCode,
  discountPercentage
}) => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storageKey = `promo-${type}-shown`;
    const alreadyShown = showOnce ? sessionStorage.getItem(storageKey) : null;
    
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        setShow(true);
        if (showOnce) {
          sessionStorage.setItem(storageKey, 'true');
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [type, delay, showOnce]);

  const handleClose = () => {
    setShow(false);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setShow(false);
    // Show success message
    alert('Thank you for subscribing!');
  };

  if (!show) return null;

  const renderSaleModal = () => (
    <div className="text-center">
      <div className="relative mb-4 sm:mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4 animate-pulse">
          <Percent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold animate-bounce">
          HOT!
        </div>
      </div>
      
      <h2 className="font-bold text-lg sm:text-xl lg:text-3xl text-gray-900 mb-2">
        {title || '🔥 Flash Sale Alert!'}
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
        {description || (
          <>
            Get up to <span className="text-red-600 font-bold text-base sm:text-lg">{discountPercentage ? `${discountPercentage}%` : '50%'} OFF</span> on selected items
          </>
        )}
      </p>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        Limited time offer - Don't miss out!
      </p>
      
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-4 sm:mb-6 text-red-600">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm font-medium">Ends in 24 hours</span>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        <a
          href={buttonLink || "/shop?sale=true"}
          className="block w-full bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          onClick={handleClose}
        >
          {buttonText || "Shop Sale Items"}
        </a>
        <button
          onClick={handleClose}
          className="block w-full text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );

  const renderNewsletterModal = () => (
    <div className="text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4">
        <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
      </div>
      
      <h2 className="font-bold text-lg sm:text-xl lg:text-3xl text-gray-900 mb-2">
        {title || "Get 10% Off Your First Order!"}
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        {description || "Subscribe to our newsletter and receive exclusive offers, new product updates, and style tips."}
      </p>
      
      <form onSubmit={handleNewsletterSubmit} className="space-y-3 sm:space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-1 sm:space-x-2"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <span>{buttonText || "Get My 10% Off"}</span>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </>
          )}
        </button>
      </form>
      
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        {discountCode ? `Use code: ${discountCode}` : null}
      </p>
      <p className="text-xs text-gray-500 mt-3 sm:mt-4">
        No spam, unsubscribe anytime. By subscribing, you agree to our Privacy Policy.
      </p>
    </div>
  );

  const renderWelcomeModal = () => (
    <div className="text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4">
        <Star className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
      </div>
      
      <h2 className="font-bold text-lg sm:text-xl lg:text-3xl text-gray-900 mb-2">
        {title || "Welcome to E-Shop! 👋"}
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        {description || "Discover amazing products with fast shipping, secure payments, and unbeatable prices."}
      </p>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
        <div className="text-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center">
            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <p className="text-gray-600">50K+ Products</p>
        </div>
        <div className="text-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <p className="text-gray-600">4.9★ Rating</p>
        </div>
        <div className="text-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center">
            <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </div>
          <p className="text-gray-600">Free Shipping</p>
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        <a
          href={buttonLink || "/shop"}
          className="block w-full bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
          onClick={handleClose}
        >
          {buttonText || "Start Shopping"}
        </a>
        <button
          onClick={handleClose}
          className="block w-full text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );

  const renderExitIntentModal = () => (
    <div className="text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4">
        <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
      </div>
      
      <h2 className="font-bold text-lg sm:text-xl lg:text-3xl text-gray-900 mb-2">
        Wait! Don't Leave Empty Handed
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
        Get <span className="text-orange-600 font-bold text-base sm:text-lg">15% OFF</span> your first purchase
      </p>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        Use code: <span className="bg-gray-100 px-2 py-1 rounded font-mono">SAVE15</span>
      </p>
      
      <div className="space-y-2 sm:space-y-3">
        <a
          href="/shop"
          className="block w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300"
          onClick={handleClose}
        >
          Claim My Discount
        </a>
        <button
          onClick={handleClose}
          className="block w-full text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          No thanks, I'll pay full price
        </button>
      </div>
    </div>
  );

  const renderModalContent = () => {
    switch (type) {
      case 'newsletter':
        return renderNewsletterModal();
      case 'welcome':
        return renderWelcomeModal();
      case 'exit-intent':
        return renderExitIntentModal();
      default:
        return renderSaleModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4 lg:px-6 animate-in fade-in duration-300 pt-32 sm:pt-44">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-4 sm:p-8 lg:p-10 relative transform animate-in zoom-in-95 duration-300">
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {renderModalContent()}
      </div>
    </div>
  );
};

export default PromoModal;