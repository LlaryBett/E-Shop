import React, { useState } from 'react';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  AreaChart,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar, 
  Line, 
  Pie, 
  Area,
  Cell,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

const KshIcon = ({ className = "w-4 h-4" }) => (
  <span className={`inline-flex items-center justify-center font-bold text-sm ${className}`}>
    KSh
  </span>
);

const AnalyticsDashboard = () => {
  // Date range selection
  const [dateRange, setDateRange] = useState('month');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for charts
  const salesData = [
    { name: 'Jan', revenue: 4000, orders: 2400, customers: 1800 },
    { name: 'Feb', revenue: 3000, orders: 1398, customers: 1200 },
    { name: 'Mar', revenue: 2000, orders: 9800, customers: 800 },
    { name: 'Apr', revenue: 2780, orders: 3908, customers: 1500 },
    { name: 'May', revenue: 1890, orders: 4800, customers: 1200 },
    { name: 'Jun', revenue: 2390, orders: 3800, customers: 1600 },
    { name: 'Jul', revenue: 3490, orders: 4300, customers: 2100 },
  ];

  const revenueData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ];

  const productPerformance = [
    { name: 'Headphones', value: 35 },
    { name: 'Smartwatch', value: 25 },
    { name: 'T-Shirts', value: 20 },
    { name: 'Camera Lens', value: 10 },
    { name: 'Yoga Mat', value: 10 },
  ];

  const trafficSources = [
    { name: 'Direct', value: 40 },
    { name: 'Social', value: 30 },
    { name: 'Email', value: 15 },
    { name: 'Referral', value: 15 },
  ];

  const customerAcquisition = [
    { name: 'New', value: 65 },
    { name: 'Returning', value: 35 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Stats cards data
  const stats = [
    { 
      title: 'Total Revenue', 
      value: 'KSh 48,568', 
      change: '+12.5%', 
      icon: <KshIcon className="h-6 w-6 text-green-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={revenueData}>
            <Area type="monotone" dataKey="value" stroke="#10B981" fill="#D1FAE5" />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    { 
      title: 'Total Orders', 
      value: '2,856', 
      change: '+8.3%', 
      icon: <ShoppingCart className="h-6 w-6 text-blue-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={revenueData}>
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    { 
      title: 'New Customers', 
      value: '1,234', 
      change: '+15.2%', 
      icon: <Users className="h-6 w-6 text-purple-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={revenueData}>
            <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    { 
      title: 'Avg. Order Value', 
      value: '$89.54', 
      change: '+5.7%', 
      icon: <Package className="h-6 w-6 text-yellow-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={revenueData}>
            <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )
    },
  ];

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Key metrics and insights about your business performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="quarter">This quarter</option>
              <option value="year">This year</option>
              <option value="custom">Custom range</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <button 
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
          <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stat.change}</span>
                  <span className="text-sm text-gray-500 ml-2">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 h-[60px]">
              {stat.chart}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Orders Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Revenue & Orders Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                  name="Revenue ($)"
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Sales by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="customers" fill="#82ca9d" name="Customers" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Product Performance Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Product Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {productPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Donut Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Traffic Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Acquisition Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Customer Acquisition</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerAcquisition}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {customerAcquisition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Conversion Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Visitors', value: 10000 },
                  { name: 'Added to Cart', value: 5000 },
                  { name: 'Initiated Checkout', value: 3000 },
                  { name: 'Completed Purchase', value: 1500 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Revenue by Channel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Website', value: 4000 },
                  { name: 'Mobile App', value: 3000 },
                  { name: 'Physical Store', value: 2000 },
                  { name: 'Marketplace', value: 2780 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;