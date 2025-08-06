import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as checkoutService from '../services/checkoutService';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext'; // Import your auth context

const CheckoutContext = createContext();

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [fees, setFees] = useState(null);
  const [taxRates, setTaxRates] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loading, setLoading] = useState({
    coupons: false,
    fees: false,
    taxRates: false,
    shippingMethods: false,
  });
  const [error, setError] = useState(null);

  // Fetch Shipping Methods (public endpoint)
  const fetchShippingMethods = useCallback(async () => {
    setLoading(prev => ({ ...prev, shippingMethods: true }));
    setError(null);
    try {
      const data = await checkoutService.getShippingMethods();
      setShippingMethods(data || []);
    } catch (err) {
      setError('Failed to fetch shipping methods');
      console.error('Shipping methods error:', err);
    } finally {
      setLoading(prev => ({ ...prev, shippingMethods: false }));
    }
  }, []);

  // Fetch Protected Data (only when authenticated)
  const fetchProtectedData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(prev => ({
        ...prev,
        coupons: true,
        fees: true,
        taxRates: true
      }));
      setError(null);
      
      const [couponsData, feesData, taxData] = await Promise.all([
        checkoutService.getCoupons(),
        checkoutService.getFeesAndRates(),
        checkoutService.getTaxRates()
      ]);
      
      setCoupons(couponsData || []);
      setFees(feesData || null);
      setTaxRates(taxData || []);
    } catch (err) {
      setError('Failed to load checkout data');
      console.error('Protected data error:', err);
    } finally {
      setLoading(prev => ({
        ...prev,
        coupons: false,
        fees: false,
        taxRates: false
      }));
    }
  }, [isAuthenticated]);

  // Initial data loading
  useEffect(() => {
    // Always load public data
    fetchShippingMethods();
    
    // Only load protected data if authenticated
    if (isAuthenticated) {
      fetchProtectedData();
    } else {
      // Clear protected data when logged out
      setCoupons([]);
      setFees(null);
      setTaxRates([]);
    }
  }, [isAuthenticated, fetchShippingMethods, fetchProtectedData]);

  const value = {
    coupons,
    fees,
    taxRates,
    shippingMethods,
    loading,
    error,
    refetch: fetchProtectedData,
    fetchShippingMethods
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};