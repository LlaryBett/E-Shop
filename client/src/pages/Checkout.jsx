import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Truck, MapPin, User, Mail, Phone, Lock, Shield, CheckCircle, Eye, Fingerprint, X, Tag, Check, ChevronDown } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../contexts/CheckoutContext';
import OrderService from '../services/orderService';
import authService from '../services/authService'; // <-- Add this import
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { coupons = [], taxRates = [], shippingMethods = [] } = useCheckout() || {};

  // For shipping options, use shippingMethods
  const shippingOptions = shippingMethods;

  // Autofill shipping address from user profile (me payload)
  const getDefaultShippingAddress = () => {
    const defaultAddress = user?.addresses?.find(addr => addr.isDefault && addr.type === 'shipping');
    if (defaultAddress) {
      return {
        firstName: defaultAddress.firstName || user?.name?.split(' ')[0] || '',
        lastName: defaultAddress.lastName || user?.name?.split(' ')[1] || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: defaultAddress.address || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        zipCode: defaultAddress.zipCode || '',
        country: defaultAddress.country || '',
      };
    }
    return {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kenya',
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('');

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLL_ATTEMPTS = 24; // 2 minutes (24 * 5 seconds)

  // Coupon related state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  
// Add this state at the top of your component
const [showMobileSummary, setShowMobileSummary] = useState(false);

  const [shippingAddress, setShippingAddress] = useState(getDefaultShippingAddress());

  const [_billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Kenya',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    mpesaPhone: user?.phone
      ? user.phone.replace(/^(\+?254|254|0)?/, '') // Remove country code or leading 0 for local format
      : '',
  });

  const [shippingError, setShippingError] = useState('');

  const subtotal = getTotalPrice();

  // Calculate shipping cost based on selected method
  let shippingCost = 0;
  const selectedShipping = shippingOptions.find(opt => opt._id === shippingMethod);
  if (selectedShipping) {
    // Use backend minFree value for free shipping logic
    if (
      selectedShipping.name === 'Free Shipping' &&
      selectedShipping.minFree &&
      subtotal >= selectedShipping.minFree
    ) {
      shippingCost = 0;
    } else {
      shippingCost = selectedShipping.cost;
    }
  }

  // Fix: set shippingError in useEffect, not in render
  useEffect(() => {
    // Use backend minFree value for error logic
    if (
      currentStep === 2 &&
      selectedShipping &&
      selectedShipping.name === 'Free Shipping' &&
      selectedShipping.minFree &&
      subtotal < selectedShipping.minFree
    ) {
      setShippingError(`This shipping method requires a minimum order of Ksh ${selectedShipping.minFree}.`);
    } else {
      setShippingError('');
    }
  }, [selectedShipping, subtotal, currentStep]);

  // Calculate discount amount
  let discountAmount = 0;
  if (appliedCoupon) {
    // Use 'amount' property from backend coupon object
    if (appliedCoupon.type === 'percentage' && typeof appliedCoupon.amount === 'number') {
      discountAmount = subtotal * (appliedCoupon.amount / 100);
    } else if (typeof appliedCoupon.amount === 'number') {
      discountAmount = appliedCoupon.amount;
    } else {
      discountAmount = 0;
    }
  }

  const discountedSubtotal = subtotal - discountAmount;

  // Calculate tax using taxRates array (range-based)
  let tax = 0;
  if (taxRates && Array.isArray(taxRates)) {
    const taxRule = taxRates.find(
      rule => discountedSubtotal >= rule.min && discountedSubtotal <= rule.max
    );
    if (taxRule) {
      tax = discountedSubtotal * taxRule.rate;
    }
  }

  const total = discountedSubtotal + shippingCost + tax;

  // Check if redirected for security details
  useEffect(() => {
    if (location.state?.showSecurityDetails) {
      setShowSecurityDetails(true);
    }
  }, [location.state]);

  const handleShippingAddressChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    if (sameAsBilling) {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const _handleBillingAddressChange = (field, value) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentInfoChange = (field, value) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  // Coupon handling functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use coupons from context (object or array)
      // Coupons must be fetched and available in context before applying
      let coupon;
      if (Array.isArray(coupons)) {
        coupon = coupons.find(c => c.code?.toUpperCase() === couponCode.toUpperCase());
      } else {
        coupon = coupons[couponCode.toUpperCase()];
      }

      if (!coupon) {
        toast.error('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      if (subtotal < coupon.minAmount) {
        toast.error(`Minimum order amount of Ksh ${coupon.minAmount} required for this coupon`);
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        type: coupon.type,
        amount: coupon.amount,
        minAmount: coupon.minAmount,
        // ...other coupon fields if needed
      });
      toast.success('Coupon applied successfully!');
      setCouponCode('');
    } catch (error) {
      toast.error('Failed to apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        // All required shipping fields must be filled
        return (
          shippingAddress.firstName &&
          shippingAddress.lastName &&
          shippingAddress.email &&
          shippingAddress.address &&
          shippingAddress.city &&
          shippingAddress.state &&
          shippingAddress.zipCode &&
          shippingAddress.country
        );
      case 2:
        // Must select a shipping method
        return !!shippingMethod;
      case 3:
        // Always require a phone number for checkout
        return (
          paymentInfo.mpesaPhone &&
          /^(7\d{8}|1\d{8})$/.test(paymentInfo.mpesaPhone)
        );
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    // Use backend minFree value for step validation
    if (
      currentStep === 2 &&
      selectedShipping &&
      selectedShipping.name === 'Free Shipping' &&
      selectedShipping.minFree &&
      subtotal < selectedShipping.minFree
    ) {
      toast.error(`Free Shipping is only available for orders above Ksh ${selectedShipping.minFree}.`);
      return;
    }
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields or make a selection before continuing.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const formatPhoneNumber = (phone) => {
    // Always return in 2547XXXXXXXX format (no +)
    let p = phone.trim();
    if (p.startsWith('+254')) return p.slice(1); // remove +
    if (p.startsWith('254')) return p;
    if (p.startsWith('0')) return '254' + p.slice(1);
    // If user enters 7XXXXXXXX or 1XXXXXXXX, prepend 254
    if (/^[17]\d{8}$/.test(p)) return '254' + p;
    return p; // fallback
  };

  const pollPaymentStatus = async (pendingOrderId) => {
  setIsPolling(true);
  setPollCount(0);

  const pollInterval = setInterval(async () => {
    try {
      // Prevent infinite polling
      if (pollCount >= MAX_POLL_ATTEMPTS) {
        clearInterval(pollInterval);
        setIsPolling(false);
        setIsProcessing(false);
        toast.error('Payment confirmation timed out. Please check your order status.');
        navigate('/orders');
        return;
      }

      const response = await OrderService.checkPaymentStatus(pendingOrderId);
      console.log('Poll response:', response);

      // Handle network / DNS error
      if (
        response?.message?.includes('getaddrinfo ENOTFOUND') ||
        response?.message?.includes('Network Error')
      ) {
        clearInterval(pollInterval);
        setIsPolling(false);
        setIsProcessing(false);
        toast.error('Network error: Unable to reach the server. Please try again.', { duration: 10000 });
        return;
      }

      // Handle failed payment immediately
      if (response.paymentStatus === 'failed') {
        clearInterval(pollInterval);
        setIsPolling(false);
        setIsProcessing(false);
        
        // Display detailed error message
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">{response.message}</p>
            <p>{response.details}</p>
            {response.nextSteps?.length > 0 && (
              <ul className="list-disc pl-5">
                {response.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            )}
          </div>,
          { duration: 10000 }
        );
        
        navigate('/cart');
        return;
      }

      // Handle successful payment
      if (response.paymentStatus === 'completed') {
        clearInterval(pollInterval);
        setIsPolling(false);
        setIsProcessing(false);
        clearCart();
        toast.success(response.message);
        setTimeout(() => {
          navigate(response.action?.destination || '/orders');
        }, 100);
        return;
      }

      // Continue polling for pending status
      if (response.paymentStatus === 'pending') {
        setPollCount(prev => prev + 1);
        return;
      }

      // Handle unexpected status
      clearInterval(pollInterval);
      setIsPolling(false);
      setIsProcessing(false);
      toast.error(response.message || 'Unexpected payment status');
      navigate('/orders');

    } catch (error) {
      console.error('Polling error:', error);

      // Detect network/DNS errors in catch as well
      if (error?.message?.includes('getaddrinfo ENOTFOUND') || error?.message?.includes('Network Error')) {
        clearInterval(pollInterval);
        setIsPolling(false);
        setIsProcessing(false);
        toast.error('Network error: Unable to reach the server. Please try again.', { duration: 10000 });
        return;
      }

      setPollCount(prev => prev + 1);
    }
  }, 5000);

  // Cleanup on unmount
  return () => {
    clearInterval(pollInterval);
    setIsPolling(false);
    setIsProcessing(false);
  };
};


 const handlePlaceOrder = async () => {
  if (!validateStep(3)) {
    toast.error('Please complete all required fields');
    return;
  }

  setIsProcessing(true);

  try {
    const orderData = {
      items,
      shippingAddress,
      paymentMethod: 'mpesa',
      shippingMethod,
      appliedCoupon,
      discountAmount,
      totalAmount: total,
      phoneNumber: formatPhoneNumber(paymentInfo.mpesaPhone)
    };
    
    const result = await OrderService.createOrder(orderData);
    console.log('Order Result:', result);

    if (result.success) {
      toast.success(result.message);
      const pendingOrderId = result.pollUrl.split('/').pop();
      pollPaymentStatus(pendingOrderId);
    } else {
      setIsProcessing(false);
      toast.error(result.message);
    }
  } catch (err) {
    console.error('Order error:', err);
    setIsProcessing(false);
    toast.error('Failed to create order. Please try again.');
  }
};

  // Check for empty cart and email verification on mount
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setIsCheckingAuth(true);
    
    if (items.length === 0 && !location.state?.showSecurityDetails) {
      toast.error('Your cart is empty', {
        duration: 3000,
        position: 'top-center'
      });
      navigate('/cart');
      return;
    }

    if (user && !user.isEmailVerified) { // Changed from emailVerified to isEmailVerified
      toast.error('Please verify your email before placing an order', {
        duration: 3000,
        position: 'top-center'
      });
      
      // Use Promise and setTimeout to handle the redirect smoothly
      const redirect = () => new Promise(resolve => setTimeout(resolve, 2000));
      redirect().then(() => {
        navigate('/verify-email-prompt', {
          state: {
            returnTo: '/checkout',
            message: 'Please verify your email before placing an order'
          }
        });
      });
      return;
    }
    
    setIsCheckingAuth(false);
  }, [items.length, location.state, user, navigate]);

  // Early return with loading state or redirect conditions
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
        <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
          {/* Keep consistent height during loading */}
          <div className="h-[80vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  // Remove the previous early return and keep the rest
  if ((items.length === 0 && !location.state?.showSecurityDetails) || (user && !user.isEmailVerified)) { // Changed here too
    return null;
  }

  const steps = [
    { id: 1, name: 'Shipping', icon: MapPin },
    { id: 2, name: 'Delivery', icon: Truck },
    { id: 3, name: 'Payment', icon: CreditCard },
    { id: 4, name: 'Review', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          Checkout
        </h1>

        {/* Security Details Modal */}
        {showSecurityDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Details</h2>
                <button
                  onClick={() => setShowSecurityDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-2 xs:p-3 sm:p-4 md:p-6 rounded-lg xs:rounded-xl border border-green-200 dark:border-green-800 flex items-start gap-2 xs:gap-3">
                    <Lock className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 xs:mb-2 leading-tight">
                        SSL Encryption
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-sm leading-snug xs:leading-relaxed">
                        All data transmitted between your browser and our servers is protected with 256-bit SSL encryption, the same level used by banks.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-2 xs:p-3 sm:p-4 md:p-6 rounded-lg xs:rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-2 xs:gap-3">
                    <Shield className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 xs:mb-2 leading-tight">PCI Compliance</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-sm leading-snug xs:leading-relaxed">
                        We are PCI DSS Level 1 compliant, meeting the highest standards for payment card data security.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 p-2 xs:p-3 sm:p-4 md:p-6 rounded-lg xs:rounded-xl border border-purple-200 dark:border-purple-800 flex items-start gap-2 xs:gap-3">
                    <Eye className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 xs:mb-2 leading-tight">Data Protection</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-sm leading-snug xs:leading-relaxed">
                        Your personal information is never stored on our servers and is immediately encrypted upon entry.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 p-2 xs:p-3 sm:p-4 md:p-6 rounded-lg xs:rounded-xl border border-orange-200 dark:border-orange-800 flex items-start gap-2 xs:gap-3">
                    <Fingerprint className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 xs:mb-2 leading-tight">Fraud Prevention</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-sm leading-snug xs:leading-relaxed">
                        Advanced fraud detection systems monitor all transactions for suspicious activity in real-time.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trust Badges & Certifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'SSL Secured', icon: <Lock className="h-5 w-5" /> },
                      { name: 'PCI Compliant', icon: <Shield className="h-5 w-5" /> },
                      { name: 'GDPR Ready', icon: <Eye className="h-5 w-5" /> },
                      { name: 'Fraud Protected', icon: <Fingerprint className="h-5 w-5" /> }
                    ].map((badge) => (
                      <div key={badge.name} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {badge.icon}
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowSecurityDetails(false);
                      navigate('/shop');
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Continue Shopping Securely
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6">
          {/* Progress Steps - Mobile Friendly (No Horizontal Scroll) */}
          <div className="mb-6 lg:hidden">
            <div className="grid grid-cols-4 gap-2 px-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-600 text-white' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`mt-1 text-xs text-center font-medium ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 
                      isCompleted ? 'text-green-600 dark:text-green-400' : 
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                    {isActive && (
                      <div className="w-full h-0.5 bg-blue-600 dark:bg-blue-400 mt-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Steps (with connecting lines) */}
          <div className="hidden lg:flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-blue-600 border-blue-600 text-white' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium lg:text-lg ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) => handleShippingAddressChange('firstName', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) => handleShippingAddressChange('lastName', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* Contact Fields - Side by side on mobile */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => handleShippingAddressChange('email', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* Address - Full width on all screens */}
                  <div className="col-span-2 sm:col-span-1 md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => handleShippingAddressChange('address', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* Location Fields - Side by side on mobile */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleShippingAddressChange('state', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* ZIP and Country - Side by side on mobile */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => handleShippingAddressChange('zipCode', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Country *
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => handleShippingAddressChange('country', e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Kenya">Kenya</option>
                      
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 lg:mb-6">
                  Shipping Method
                </h2>
                
                <div className="space-y-2 sm:space-y-4">
                  {shippingOptions.map((option) => (
                    <label
                      key={option._id}
                      className={`block p-3 xs:p-4 border rounded-lg cursor-pointer transition-colors ${
                        shippingMethod === option._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={option._id}
                          checked={shippingMethod === option._id}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm leading-tight">
                                {option.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                {option.description}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                                {option.cost === 0 ? 'Free' : `Ksh ${option.cost.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Error Message */}
                {shippingError && (
                  <div className="text-red-600 text-xs xs:text-sm mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    {shippingError}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Payment Information
                </h2>
                
                {/* M-Pesa Payment Section */}
                <div className="space-y-4">
                  <div className="flex items-center mb-4">
                    <svg className="h-6 w-6 text-green-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-lg font-medium text-gray-900 dark:text-white">M-Pesa Payment</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      M-Pesa Phone Number *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                        +254
                      </span>
                      <input
                        type="tel"
                        value={paymentInfo.mpesaPhone}
                        onChange={(e) => handlePaymentInfoChange('mpesaPhone', e.target.value)}
                        placeholder="7XXXXXXXX"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter your M-Pesa registered phone number
                    </p>
                  </div>
                  


                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                          How M-Pesa Payment Works
                        </h3>
                        <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Click "Complete Payment" to proceed</li>
                            <li>You'll receive an M-Pesa STK push notification on your phone</li>
                            <li>Enter your M-Pesa PIN to confirm the payment</li>
                            <li>You'll receive a confirmation SMS once payment is successful</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-gray-900 dark:text-white">
                      Billing address same as shipping address
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Review Your Order
                </h2>
                
                {/* Order Items */}
                <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 sm:space-x-4 py-2 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                      <img
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                        src={item.product.images[0]?.url}
                        alt={item.product.title}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-base sm:text-lg text-gray-900 dark:text-white">{item.product.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        {item.selectedVariant && (
                          <p className="text-xs sm:text-sm text-gray-500">{item.selectedVariant}</p>
                        )}
                      </div>
                      <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                        Ksh {((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                      <p>{shippingAddress.address}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Payment Method</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {/* Always show M-Pesa for payment method */}
                      <p>M-Pesa</p>
                    </div>
                  </div>
                </div>

                {/* Polling Indicator - Shown only during polling */}
                {isPolling && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                      <span className="text-blue-700 dark:text-blue-300">
                        Waiting for M-Pesa payment confirmation...
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      Please check your phone and enter your M-Pesa PIN to complete the payment
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-4 sm:mt-6">
              {currentStep > 1 && (
                <button
                  onClick={handlePreviousStep}
                  className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="ml-auto px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="ml-auto px-3 py-2 sm:px-4 sm:py-3 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Place Order</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            {/* Mobile Collapsible Summary */}
            <div className="lg:hidden mb-4 sm:mb-6">
              <button
                onClick={() => setShowMobileSummary(!showMobileSummary)}
                className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Order Total</h3>
                    <p className="text-base font-bold sm:text-lg text-gray-900 dark:text-white">
                      Ksh {total.toFixed(2)}
                    </p>
                    {appliedCoupon && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Saved Ksh {Number(discountAmount).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {showMobileSummary ? 'Hide' : 'Details'}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                    showMobileSummary ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {/* Collapsible Content */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showMobileSummary ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mt-2 p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white">Ksh {subtotal.toFixed(2)}</span>
                    </div>

                    {/* Coupon Section */}
                    <div className="border-t border-b border-gray-200 dark:border-gray-700 py-2 sm:py-4">
                      {!appliedCoupon ? (
                        <div className="space-y-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Coupon Code
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              placeholder="Enter coupon code"
                              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                            <button
                              onClick={handleApplyCoupon}
                              disabled={couponLoading}
                              className="px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-xs sm:text-sm font-medium flex items-center space-x-1 min-w-[80px] justify-center"
                            >
                              {couponLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Tag className="h-4 w-4" />
                                  <span>Apply</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p>Try: SAVE10, WELCOME20, FIXED15</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                {appliedCoupon.code}
                              </span>
                            </div>
                            <button
                              onClick={handleRemoveCoupon}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-sm text-green-700 dark:text-green-400">Discount</span>
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                              -Ksh {Number(discountAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                        {shippingCost === 0 ? 'Free' : `Ksh ${shippingCost.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white">Ksh {tax.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Compact Security Badge for Mobile */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>SSL Secured Checkout</span>
                      <button
                        onClick={() => setShowSecurityDetails(true)}
                        className="text-green-600 dark:text-green-400 font-medium hover:underline ml-2"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Sticky Summary */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 sticky top-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Order Summary
              </h2>

              <div className="space-y-2 sm:space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white">Ksh {subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Section */}
                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-2 sm:py-4">
                  {!appliedCoupon ? (
                    <div className="space-y-3">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Coupon Code
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-xs sm:text-sm font-medium flex items-center space-x-1 min-w-[80px] justify-center"
                        >
                          {couponLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Tag className="h-4 w-4" />
                              <span>Apply</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Try these codes: SAVE10, WELCOME20, FIXED15</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-300">
                            {appliedCoupon.code}
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-green-700 dark:text-green-400">Discount</span>
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          -Ksh {Number(discountAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                    {shippingCost === 0 ? 'Free' : `Ksh ${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white">Ksh {tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Ksh {total.toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      You saved Ksh {Number(discountAmount).toFixed(2)}!
                    </p>
                  )}
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>Secure SSL encrypted checkout</span>
                </div>

                {/* Security Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-center space-y-4 group">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Secure Payment</h3>
                    <p className="text-gray-600 dark:text-gray-300">256-bit SSL encryption for all transactions and data</p>
                    <button
                      onClick={() => setShowSecurityDetails(true)}
                      className="text-sm text-green-600 dark:text-green-400 font-medium hover:underline"
                    >
                      Security Details →
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { name: 'PCI Compliant', icon: <Shield className="h-3 w-3" /> },
                        { name: 'Data Protected', icon: <Eye className="h-3 w-3" /> },
                        { name: 'Fraud Prevention', icon: <Fingerprint className="h-3 w-3" /> },
                        { name: 'SSL Secured', icon: <Lock className="h-3 w-3" /> }
                      ].map((badge) => (
                        <div key={badge.name} className="flex items-center space-x-1 text-green-700 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          {badge.icon}
                          <span>{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add VerificationPrompt at the end */}
    </div>
  );
};

export default Checkout;