import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  Plus,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Menu,
  X,
  Home,
  LogOut // Add this import
} from 'lucide-react';
import OrdersManagement from './OrdersManagement';
import CustomersManagement from './CustomersManagement';
import CategoryManagement from './CategoryManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SettingsPage from './SettingsPage';
import ProductsManagement from './ProductsManagement';
import adminService from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const KshIcon = ({ className = "w-4 h-4" }) => (
  <span className={`inline-flex items-center justify-center font-bold text-sm ${className}`}>
    KSh
  </span>
);

const RevenueChart = ({ data }) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentYear = new Date().getFullYear();
  const fullYearData = Array(12).fill(0);
  
  data.forEach(item => {
    if (item._id.year === currentYear) {
      fullYearData[item._id.month - 1] = item.revenue;
    }
  });

  const currentMonth = new Date().getMonth();
  const displayedMonths = months.slice(0, currentMonth + 1);
  const displayedData = fullYearData.slice(0, currentMonth + 1);

  const chartData = {
    labels: displayedMonths,
    datasets: [
      {
        label: 'Revenue ($)',
        data: displayedData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#6b7280',
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          callback: function(value) {
            return '$' + value;
          },
        },
      },
    },
    elements: {
      bar: {
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
    },
  };

  return (
    <div className="relative h-full">
      <Bar data={chartData} options={options} />
      <style jsx global>{`
        .dark .chartjs-render-monitor {
          filter: brightness(0.8);
        }
        .dark .chartjs-grid line {
          stroke: #374151 !important;
        }
      `}</style>
    </div>
  );
};

const AdminDashboard = () => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const { logout } = useAuth(); // <-- Add this

  useEffect(() => {
    adminService.getDashboardStats().then(res => {
      const stats = res.data.stats;
      setDashboardStats(stats);
      setRecentOrders(stats.recentOrders || []);
      setTopProducts(stats.topProducts || []);
    });
  }, []);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/admin/customers' },
    { id: 'categories', label: 'Categories', icon: Package, path: '/admin/categories' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleLogout = () => {
    logout();
    // Navigate home is handled by the logout function in AuthContext
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Ksh {dashboardStats?.totalRevenue?.toLocaleString() ?? '...'}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <KshIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 md:mt-4 flex items-center">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
            <span className="text-xs md:text-sm text-green-600">+{dashboardStats?.revenueGrowth ?? '...'}%</span>
            <span className="text-xs md:text-sm text-gray-500 ml-1 md:ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardStats?.totalOrders?.toLocaleString() ?? '...'}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 md:mt-4 flex items-center">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
            <span className="text-xs md:text-sm text-green-600">+{dashboardStats?.orderGrowth ?? '...'}%</span>
            <span className="text-xs md:text-sm text-gray-500 ml-1 md:ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardStats?.totalUsers?.toLocaleString() ?? '...'}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 md:mt-4 flex items-center">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
            <span className="text-xs md:text-sm text-green-600">+{dashboardStats?.userGrowth ?? '...'}%</span>
            <span className="text-xs md:text-sm text-gray-500 ml-1 md:ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardStats?.totalProducts?.toLocaleString() ?? '...'}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 md:mt-4 flex items-center">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1" />
            <span className="text-xs md:text-sm text-green-600">+{dashboardStats?.productGrowth ?? '...'}%</span>
            <span className="text-xs md:text-sm text-gray-500 ml-1 md:ml-2">vs last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {recentOrders.map(order => (
                <div key={order._id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="truncate">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">{order.orderNumber}</p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{order.user?.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Ksh {order.pricing?.total?.toFixed(2)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
              <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {topProducts.map(tp => (
                <div key={tp._id} className="flex items-center space-x-2 md:space-x-4">
                  <img
                    src={tp.product?.images?.[0]?.url}
                    alt={tp.product?.title}
                    className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">{tp.product?.title}</p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{tp.totalSold} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Ksh {tp.totalRevenue?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">Revenue Overview</h3>
        <div className="h-64">
          {!dashboardStats ? (
            <div className="min-h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : dashboardStats?.monthlyRevenue ? (
            <RevenueChart data={dashboardStats.monthlyRevenue} />
          ) : (
            <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Loading revenue data...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header - remove logout button */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {mobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile Sidebar - Updated structure */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileSidebarOpen(false)}></div>
            <div className="relative flex flex-col w-64 max-w-xs h-full bg-white dark:bg-gray-800 shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
              </div>
              
              {/* Main Navigation */}
              <nav className="flex-1 overflow-y-auto">
                <Link to="/" onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center space-x-3 px-6 py-3 text-left w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                >
                  <Home className="h-5 w-5" />
                  <span>Go to Home</span>
                </Link>
                {sidebarItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                                 (item.id === 'dashboard' && location.pathname === '/admin');
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-6 py-3 text-left w-full transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button at Bottom */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar - Updated structure */}
        <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-md min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1">
            <Link to="/"
              className="flex items-center space-x-3 px-6 py-3 text-left w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
            >
              <Home className="h-5 w-5" />
              <span>Go to Home</span>
            </Link>
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                             (item.id === 'dashboard' && location.pathname === '/admin');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-3 px-6 py-3 text-left w-full transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button at Bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="settings" element={<SettingsPage/>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;