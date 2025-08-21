import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Shield,
  Truck
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white w-full mt-auto">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">E</span>
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold">E-Shop</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
              Your trusted online marketplace for quality products with fast delivery and excellent customer service.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link to="/shop" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/about" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/faq" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6">Customer Service</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link to="/orders" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Track Orders</Link></li>
              <li>
                <Link
                  to={{
                    pathname: "/shop",
                    search: "?quality=true"
                  }}
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Returns
                </Link>
              </li>
              <li><Link to="/shipping" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link to="/size-guide" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Size Guide</Link></li>
              <li><Link to="/contact" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6">Contact Info</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-400">123 Business St, City, State 12345</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-400">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-400">support@eshop.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs sm:text-sm text-gray-400">
            © 2024 E-Shop. All rights reserved.
          </p>
          <div className="flex space-x-4 sm:space-x-6 mt-3 md:mt-0">
            <Link to="/privacy" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;