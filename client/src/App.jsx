import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { CheckoutProvider } from './contexts/CheckoutContext'; // ✅ <-- Add this line

// Layout Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/Admin/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import FAQ from './pages/FAQ';
import VerifyEmailPrompt from './pages/VerifyEmailPrompt';
import VerifyEmail from './pages/VerifyEmail';
import NotificationsPage from './pages/NotificationsPage';
import PromoModalManager from './components/common/PromoModalManager';
import ExitIntentModal from './components/common/ExitIntentModal';
import Categories from './pages/Categories';
import Shipping from './pages/Shipping';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CheckoutProvider> {/* ✅ Wrap here to provide checkout data */}
          <CartProvider>
            <WishlistProvider>
              <NotificationsProvider>
                <CategoryProvider>
                  <Router>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                      <PromoModalManager />
                      <ExitIntentModal />
                      <Header />
                      <main className="pt-16">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/shop/:category" element={<Shop />} />
                          <Route path="/product/:id" element={<ProductDetail />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/admin/*" element={<AdminDashboard />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/blog" element={<Blog />} />
                          <Route path="/faq" element={<FAQ />} />
                          <Route path="/verify-email-prompt" element={<VerifyEmailPrompt />} />
                          <Route path="/verify-email/:token" element={<VerifyEmail />} />
                          <Route path="/notifications" element={<NotificationsPage />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/shipping" element={<Shipping />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  </Router>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: '#333',
                        color: '#fff',
                      },
                    }}
                  />
                </CategoryProvider>
              </NotificationsProvider>
            </WishlistProvider>
          </CartProvider>
        </CheckoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
