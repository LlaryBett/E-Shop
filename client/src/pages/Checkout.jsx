import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Truck, MapPin, User, Mail, Phone, Lock, Shield, CheckCircle, Eye, Fingerprint, X, Tag, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../contexts/CheckoutContext';
import OrderService from '../services/orderService';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { coupons = [], taxRates = [], shippingMethods = [] } = useCheckout() || {};

  // For shipping options, use shippingMethods
  const shippingOptions = shippingMethods;

  // Debug: log what is received from context
  console.log('coupons:', coupons);
  console.log('taxRates:', taxRates);
  console.log('shippingOptions:', shippingOptions);

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
      country: 'United States',
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Coupon related state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

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
    country: 'United States',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
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
        return shippingAddress.firstName && shippingAddress.lastName && 
               shippingAddress.email && shippingAddress.address && 
               shippingAddress.city && shippingAddress.state && shippingAddress.zipCode;
      case 2:
        return shippingMethod;
      case 3:
        if (paymentMethod === 'card') {
          return paymentInfo.cardNumber && paymentInfo.expiryDate && 
                 paymentInfo.cvv && paymentInfo.cardholderName;
        }
        return true;
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
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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
        paymentMethod,
        shippingMethod,
        appliedCoupon,
        discountAmount,
        totalAmount: total
      };
      
      await OrderService.createOrder(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Allow viewing security details even without items
  if (items.length === 0 && !location.state?.showSecurityDetails) {
    navigate('/cart');
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
      <div className="max-w-[1450px] mx-auto px-4 lg:px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-6 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">SSL Encryption</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      All data transmitted between your browser and our servers is protected with 256-bit SSL encryption, the same level used by banks.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">PCI Compliance</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      We are PCI DSS Level 1 compliant, meeting the highest standards for payment card data security.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                      <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Protection</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Your personal information is never stored on our servers and is immediately encrypted upon entry.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                      <Fingerprint className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fraud Prevention</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Advanced fraud detection systems monitor all transactions for suspicious activity in real-time.
                    </p>
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
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
                  <span className={`ml-2 text-sm font-medium ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Shipping Address
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) => handleShippingAddressChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) => handleShippingAddressChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => handleShippingAddressChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => handleShippingAddressChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => handleShippingAddressChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => handleShippingAddressChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country *
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => handleShippingAddressChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Shipping Method
                </h2>
                
                <div className="space-y-4">
                  {shippingOptions.map((option) => (
                    <label
                      key={option._id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        shippingMethod === option._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="shipping"
                          value={option._id}
                          checked={shippingMethod === option._id}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-white">{option.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {option.cost === 0 ? 'Free' : `Ksh ${option.cost.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Error Message */}
                {shippingError && (
                  <div className="text-red-600 text-sm mb-2">{shippingError}</div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Payment Information
                </h2>
                
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-900 dark:text-white">Credit/Debit Card</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-900 dark:text-white">PayPal</span>
                    </label>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cardholderName}
                        onChange={(e) => handlePaymentInfoChange('cardholderName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cvv}
                        onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You will be redirected to PayPal to complete your payment.
                    </p>
                  </div>
                )}

                {/* Billing Address */}
                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Review Your Order
                </h2>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 dark:border-gray-700">
                      <img
                        src={item.product.images[0]?.url}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.product.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        {item.selectedVariant && (
                          <p className="text-sm text-gray-500">{item.selectedVariant}</p>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
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
                      {paymentMethod === 'card' ? (
                        <p>Credit Card ending in {paymentInfo.cardNumber.slice(-4)}</p>
                      ) : (
                        <p>PayPal</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">Ksh {subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Section */}
                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
                  {!appliedCoupon ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Coupon Code
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm font-medium flex items-center space-x-1 min-w-[80px] justify-center"
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
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white">
                    {shippingCost === 0 ? 'Free' : `Ksh ${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white">Ksh {tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
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
    </div>
  );
};

export default Checkout;