// import React, { createContext, useContext, useState, useCallback } from 'react';
// import OrderService from '../services/orderService';

// const CheckoutContext = createContext();

// export const CheckoutProvider = ({ children }) => {
//   const [orderSummary, setOrderSummary] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [summaryError, setSummaryError] = useState(null);

//   const fetchOrderSummary = useCallback(async (payload) => {
//     setLoading(true);
//     setSummaryError(null);
//     try {
//       const res = await OrderService.getOrderSummary(payload);
//       setOrderSummary(res);
//       return res;
//     } catch (err) {
//       setSummaryError(err.message || 'Failed to fetch order summary');
//       setOrderSummary(null);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return (
//     <CheckoutContext.Provider value={{
//       orderSummary,
//       loading,
//       summaryError,
//       fetchOrderSummary,
//       setOrderSummary
//     }}>
//       {children}
//     </CheckoutContext.Provider>
//   );
// };

// export const useCheckout = () => useContext(CheckoutContext);
