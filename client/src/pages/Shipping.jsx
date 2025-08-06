import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Clock, 
  Shield, 
  Globe, 
  Package, 
  CheckCircle, 
  MapPin, 
  Calendar,
  Zap,
  Heart,
  ArrowLeft,
  Store
} from 'lucide-react';

const Shipping = () => {
  const shippingOptions = [
    {
      id: 'free-shipping',
      name: 'Free Shipping',
      price: 'Free',
      minOrder: 'Ksh 2,000+',
      duration: '5 business days',
      description: 'Available on orders above 2000 KES',
      icon: <Package className="h-6 w-6" />,
      features: ['Free on orders over Ksh 2,000', 'Tracking included', 'Signature required'],
      cost: 0,
      estimatedDays: 5
    },
    {
      id: 'flat-rate',
      name: 'Flat Rate',
      price: 'Ksh 250',
      minOrder: 'Any order',
      duration: '3 business days',
      description: 'Standard delivery within Kenya',
      icon: <Truck className="h-6 w-6" />,
      features: ['Standard delivery', 'Nationwide coverage', 'SMS notifications'],
      cost: 250,
      estimatedDays: 3
    },
    {
      id: 'pickup-station',
      name: 'Pickup Station',
      price: 'Ksh 88',
      minOrder: 'Any order',
      duration: '2 business days',
      description: 'Collect your order from the nearest station',
      icon: <Store className="h-6 w-6" />,
      features: ['Convenient pickup locations', 'Extended pickup hours', 'Secure storage'],
      cost: 88,
      estimatedDays: 2
    },
    {
      id: 'express-delivery',
      name: 'Express Delivery',
      price: 'Ksh 600',
      minOrder: 'Any order',
      duration: '1 business day',
      description: 'Fast delivery within 24 hours in Nairobi',
      icon: <Zap className="h-6 w-6" />,
      features: ['Next day delivery', 'Priority handling', 'Real-time tracking'],
      cost: 600,
      estimatedDays: 1
    }
  ];

  const serviceAreas = [
    { city: 'Nairobi', areas: ['CBD', 'Westlands', 'Karen', 'Kileleshwa', 'Kilimani'] },
    { city: 'Mombasa', areas: ['Old Town', 'Nyali', 'Bamburi', 'Kisauni'] },
    { city: 'Kisumu', areas: ['Central', 'Milimani', 'Kondele', 'Mamboleo'] },
    { city: 'Nakuru', areas: ['CBD', 'Milimani', 'Section 58', 'Pipeline'] }
  ];

  const faqs = [
    {
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email and SMS. You can also track your order from your account dashboard.'
    },
    {
      question: 'What if I\'m not home for delivery?',
      answer: 'Our delivery partners will attempt delivery up to 3 times. If unsuccessful, your package will be held at the nearest pickup point for 5 days.'
    },
    {
      question: 'Do you deliver to rural areas?',
      answer: 'We deliver nationwide! Rural deliveries may take an additional 1-2 days and might require pickup from the nearest town center.'
    },
    {
      question: 'Can I change my delivery address?',
      answer: 'You can change your delivery address within 2 hours of placing your order. After that, please contact our support team.'
    },
    {
      question: 'What about pickup stations?',
      answer: 'Our pickup stations are located in major shopping centers and business districts. You\'ll receive an SMS when your order is ready for collection.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-8" style={{ aspectRatio: '4.6875 / 1' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                Fast & Reliable Shipping
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
                We deliver your orders quickly and safely across Kenya with multiple shipping options to suit your needs.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Free shipping on orders over Ksh 2,000
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Real-time tracking included
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Secure packaging guaranteed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-4">
        {/* Shipping Options */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Choose Your Shipping Speed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingOptions.map((option, index) => (
              <div 
                key={option.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  index === 0 ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {index === 0 && (
                  <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full inline-block mb-3">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {option.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{option.duration}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {option.price}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {option.minOrder}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {option.description}
                </p>
                <ul className="space-y-1">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Service Areas */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Delivery Coverage
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-lg">
              We deliver to all major cities and towns across Kenya
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {serviceAreas.map((area) => (
                <div key={area.city} className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                    {area.city}
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {area.areas.map((location) => (
                      <li key={location}>{location}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't see your area? <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact us</Link> - we're expanding daily!
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            How Our Shipping Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Order Placed', description: 'Complete your purchase and payment', icon: <Heart className="h-6 w-6" /> },
              { step: 2, title: 'Processing', description: 'We carefully package your items', icon: <Package className="h-6 w-6" /> },
              { step: 3, title: 'Shipped', description: 'Your order is on its way with tracking', icon: <Truck className="h-6 w-6" /> },
              { step: 4, title: 'Delivered', description: 'Enjoy your purchase!', icon: <CheckCircle className="h-6 w-6" /> }
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Guarantee */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-xl p-8 text-center border border-green-200 dark:border-green-800">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Our Shipping Guarantee
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              We're committed to getting your order to you safely and on time. If something goes wrong, we'll make it right.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Damage Protection</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items damaged in transit will be replaced at no cost</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Lost Package</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">We'll track down lost packages or send a replacement</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Late Delivery</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get a refund on shipping if we're late on express orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Still have questions about shipping?
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gray-900 dark:bg-black py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Browse our collection and enjoy fast, reliable shipping on all your favorite items.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Start Shopping
            <Truck className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Shipping;