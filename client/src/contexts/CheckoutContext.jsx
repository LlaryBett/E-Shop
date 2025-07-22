import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as checkoutService from '../services/checkoutService';
import toast from 'react-hot-toast';

const CheckoutContext = createContext();

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
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

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(prev => ({ ...prev, coupons: true }));
    try {
      const data = await checkoutService.getCoupons();
      setCoupons(data || []);
    } catch (err) {
      setError('Failed to fetch coupons');
      toast.error('Failed to load coupons');
    } finally {
      setLoading(prev => ({ ...prev, coupons: false }));
    }
  }, []);

  // Fetch Fees & Rates
  const fetchFees = useCallback(async () => {
    setLoading(prev => ({ ...prev, fees: true }));
    try {
      const data = await checkoutService.getFeesAndRates();
      setFees(data || null);
    } catch (err) {
      setError('Failed to fetch fees and rates');
      toast.error('Failed to load fees');
    } finally {
      setLoading(prev => ({ ...prev, fees: false }));
    }
  }, []);

  // Fetch Tax Rates
  const fetchTaxRates = useCallback(async () => {
    setLoading(prev => ({ ...prev, taxRates: true }));
    try {
      const data = await checkoutService.getTaxRates();
      setTaxRates(data || []);
    } catch (err) {
      setError('Failed to fetch tax rates');
      toast.error('Failed to load tax rates');
    } finally {
      setLoading(prev => ({ ...prev, taxRates: false }));
    }
  }, []);

  // Fetch Shipping Methods
  const fetchShippingMethods = useCallback(async () => {
    setLoading(prev => ({ ...prev, shippingMethods: true }));
    try {
      const data = await checkoutService.getShippingMethods();
      setShippingMethods(data || []);
    } catch (err) {
      setError('Failed to fetch shipping methods');
      toast.error('Failed to load shipping methods');
    } finally {
      setLoading(prev => ({ ...prev, shippingMethods: false }));
    }
  }, []);

  // Fetch all on mount
  useEffect(() => {
    fetchCoupons();
    fetchFees();
    fetchTaxRates();
    fetchShippingMethods();
  }, [fetchCoupons, fetchFees, fetchTaxRates, fetchShippingMethods]);

  const value = {
    coupons,
    fees,
    taxRates,
    shippingMethods,
    loading,
    error,
    fetchCoupons,
    fetchFees,
    fetchTaxRates,
    fetchShippingMethods,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
