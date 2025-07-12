import { useState, useEffect } from 'react';

/**
 * Custom hook for API calls with loading, error, and data state management
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Options object
 * @param {boolean} options.immediate - Whether to execute immediately on mount
 */
export function useApi(
  apiFunction,
  options = { immediate: true }
) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  };

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [options.immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

/**
 * Custom hook for mutation operations (POST, PUT, DELETE, etc.)
 * @param {Function} apiFunction - The API function to call with parameters
 */
export function useMutation(
  apiFunction
) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = async (params) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiFunction(params);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  };

  return {
    ...state,
    mutate,
  };
}