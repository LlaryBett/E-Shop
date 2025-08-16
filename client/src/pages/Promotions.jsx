import { Tag, Timer, Gift, Percent, ShoppingCart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Promotions = () => {
  // For now promotions list is empty until you fetch them from API later
  const promotions = [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-44 lg:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                to="/"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Home
              </Link>
            </li>
            <li className="text-gray-400 dark:text-gray-600">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li className="font-medium text-gray-800 dark:text-gray-200">
              Promotions
            </li>
          </ol>
        </nav>

        {/* Left-Aligned Heading */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Big On Savings, For Your Convenience
          </h2>
        </div>

        {/* Active Deals Section */}
        <section className="mb-16">
          {promotions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                No Leaflets found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  {/* Promo Image */}
                  <div className="relative h-48">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600">
                      <div className="h-full w-full flex items-center justify-center">
                        <Gift className="h-16 w-16 text-white/80" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 text-gray-800">
                        <Tag className="h-3.5 w-3.5 mr-1" />
                        {promo.type}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Timer className="h-3.5 w-3.5 mr-1" />
                        Ends in {promo.expiresIn}
                      </span>
                    </div>
                  </div>

                  {/* Promo Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {promo.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {promo.description}
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <Percent className="h-4 w-4 mr-2" />
                          <span>Discount</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {promo.discount}% OFF
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          <span>Min. Spend</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          KES {promo.minSpend}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Use Code:
                          </span>
                          <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono font-medium text-blue-600 dark:text-blue-400">
                            {promo.code}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-6 pb-6">
                    <Link
                      to="/shop"
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Promotions;
