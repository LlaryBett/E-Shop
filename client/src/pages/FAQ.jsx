import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState([]);

  const faqData = [
    {
      id: '1',
      question: 'How do I place an order?',
      answer: 'To place an order, browse our products, add items to your cart, and proceed to checkout. You\'ll need to provide shipping information and payment details to complete your purchase.',
      category: 'Ordering & Payment',
    },
    {
      id: '2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through encrypted connections.',
      category: 'Ordering & Payment',
    },
    {
      id: '3',
      question: 'Can I modify or cancel my order?',
      answer: 'Orders can be modified or cancelled within 1 hour of placement. After this time, orders enter our fulfillment process and cannot be changed. Contact our support team immediately if you need to make changes.',
      category: 'Ordering & Payment',
    },
    {
      id: '4',
      question: 'Do you offer guest checkout?',
      answer: 'Yes, you can checkout as a guest without creating an account. However, creating an account allows you to track orders, save addresses, and access your order history.',
      category: 'Ordering & Payment',
    },
    {
      id: '5',
      question: 'What are your shipping options?',
      answer: 'We offer Standard (5-7 business days), Express (2-3 business days), and Overnight shipping. Free standard shipping is available on orders over $50.',
      category: 'Shipping & Delivery',
    },
    {
      id: '6',
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to over 25 countries worldwide. International shipping costs and delivery times vary by destination. Customs duties and taxes may apply.',
      category: 'Shipping & Delivery',
    },
    {
      id: '7',
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and visiting the Orders section.',
      category: 'Shipping & Delivery',
    },
    {
      id: '8',
      question: 'What if my package is lost or damaged?',
      answer: 'If your package is lost or arrives damaged, contact us immediately. We\'ll work with the shipping carrier to resolve the issue and ensure you receive your order in perfect condition.',
      category: 'Shipping & Delivery',
    },
    {
      id: '9',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Some items like personalized products or perishables cannot be returned.',
      category: 'Returns & Refunds',
    },
    {
      id: '10',
      question: 'How do I return an item?',
      answer: 'To return an item, log into your account, go to Orders, and select "Return Item" next to the product. Print the prepaid return label and drop off the package at any authorized location.',
      category: 'Returns & Refunds',
    },
    {
      id: '11',
      question: 'When will I receive my refund?',
      answer: 'Refunds are processed within 3-5 business days after we receive your returned item. The refund will appear on your original payment method within 5-10 business days.',
      category: 'Returns & Refunds',
    },
    {
      id: '12',
      question: 'Can I exchange an item instead of returning it?',
      answer: 'Yes, you can exchange items for a different size or color if available. The exchange process is similar to returns, and we\'ll ship the new item once we receive the original.',
      category: 'Returns & Refunds',
    },
    {
      id: '13',
      question: 'How do I create an account?',
      answer: 'Click "Sign Up" in the top right corner, enter your email and create a password. You\'ll receive a verification email to activate your account.',
      category: 'Account & Security',
    },
    {
      id: '14',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
      category: 'Account & Security',
    },
    {
      id: '15',
      question: 'How do I update my account information?',
      answer: 'Log into your account and go to "Profile" to update your personal information, addresses, and preferences. Changes are saved automatically.',
      category: 'Account & Security',
    },
    {
      id: '16',
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your consent.',
      category: 'Account & Security',
    },
    {
      id: '17',
      question: 'How do I know if an item is in stock?',
      answer: 'Stock availability is shown on each product page. If an item is out of stock, you can sign up for notifications to be alerted when it\'s back in stock.',
      category: 'Products & Inventory',
    },
    {
      id: '18',
      question: 'Do you restock sold-out items?',
      answer: 'We regularly restock popular items, but availability depends on manufacturer supply. Sign up for restock notifications on product pages to be notified when items return.',
      category: 'Products & Inventory',
    },
    {
      id: '19',
      question: 'Can I get product recommendations?',
      answer: 'Yes! Our website shows personalized recommendations based on your browsing history and purchases. You can also contact our customer service for personalized assistance.',
      category: 'Products & Inventory',
    },
    {
      id: '20',
      question: 'How do I leave a product review?',
      answer: 'After receiving your order, you can leave a review by going to the product page and clicking "Write a Review" or through the link in your order confirmation email.',
      category: 'Products & Inventory',
    },
  ];

  const categories = ['all', ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us at +1 (555) 123-4567',
      action: 'Call Now',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email',
      action: 'Send Email',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      {/* Hero Section - Updated to match banner styling */}
      <section className="relative overflow-hidden my-0 sm:my-1 md:my-2">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-6">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-600 to-purple-700 text-white" style={{ aspectRatio: '4.6875 / 1' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <HelpCircle className="h-16 w-16 mx-auto mb-4 text-blue-200" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">Frequently Asked Questions</h1>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                Find quick answers to common questions about our products, services, and policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-4">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {filteredFAQs.length === 0 ? (
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-44 lg:pt-32">
                <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-4">
                  <div className="text-center py-12">
                    <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No FAQs found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your search terms or browse different categories.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {item.question}
                        </h3>
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {item.category}
                        </span>
                      </div>
                      {openItems.includes(item.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {openItems.includes(item.id) && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
  <div className="flex flex-row sm:flex-col gap-2 sm:gap-6">
    <div className="flex-1 sm:flex-none text-center">
      <div className="text-lg sm:text-2xl font-bold text-blue-600">{faqData.length}</div>
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total FAQs</div>
    </div>
    <div className="flex-1 sm:flex-none text-center">
      <div className="text-lg sm:text-2xl font-bold text-green-600">{categories.length - 1}</div>
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Categories</div>
    </div>
    <div className="flex-1 sm:flex-none text-center">
      <div className="text-lg sm:text-2xl font-bold text-purple-600">24/7</div>
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Support Available</div>
    </div>
  </div>
</div>

            {/* Contact Support */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Still Need Help?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="space-y-3">
                {supportOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{option.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{option.description}</p>
                        </div>
                      </div>
                      <button className={`w-full py-2 px-3 text-white rounded-lg transition-colors text-sm ${option.color}`}>
                        {option.action}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Categories</h3>
              <div className="space-y-2">
                {categories.slice(1).map(category => {
                  const count = faqData.filter(item => item.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{category}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Improve Our FAQs</h3>
              <p className="text-blue-100 text-sm mb-4">
                Help us improve by suggesting new questions or reporting issues.
              </p>
              <button className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;