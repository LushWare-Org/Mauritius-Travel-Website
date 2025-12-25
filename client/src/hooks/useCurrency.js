// src/hooks/useCurrency.js for tour packges
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const useCurrency = (defaultCurrency = 'MUR') => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get currency from URL params first, then localStorage, then default
  const getInitialCurrency = () => {
    const urlCurrency = searchParams.get('currency');
    const savedCurrency = localStorage.getItem('preferredCurrency');
    
    // Normalize currency values
    if (urlCurrency) {
      return urlCurrency.toUpperCase() === 'EUR' ? 'EUR' : 'MUR';
    }
    
    if (savedCurrency) {
      if (savedCurrency.toLowerCase() === 'euro') return 'EUR';
      if (savedCurrency.toLowerCase() === 'rs') return 'MUR';
      if (savedCurrency === 'EUR') return 'EUR';
      if (savedCurrency === 'MUR') return 'MUR';
    }
    
    return defaultCurrency;
  };

  const [currency, setCurrency] = useState(getInitialCurrency());

  // Update URL and localStorage when currency changes
  useEffect(() => {
    const urlCurrency = searchParams.get('currency');
    
    if (urlCurrency !== currency) {
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('currency', currency);
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
    
    // Save to localStorage with normalized values
    const storageValue = currency === 'EUR' ? 'euro' : 'rs';
    localStorage.setItem('preferredCurrency', storageValue);
  }, [currency, location.search, navigate, searchParams]);

  // Convert between display formats
  const toDisplayFormat = useCallback((currencyCode) => {
    if (currencyCode === 'EUR' || currencyCode === 'euro') return 'euro';
    if (currencyCode === 'MUR' || currencyCode === 'rs') return 'rs';
    return currencyCode;
  }, []);

  const toCurrencyCode = useCallback((displayFormat) => {
    if (displayFormat === 'euro') return 'EUR';
    if (displayFormat === 'rs') return 'MUR';
    return displayFormat;
  }, []);

  // Currency change handler
  const handleCurrencyChange = useCallback((newCurrency) => {
    const normalizedCurrency = newCurrency.toUpperCase() === 'EUR' ? 'EUR' : 'MUR';
    if (normalizedCurrency !== currency) {
      setCurrency(normalizedCurrency);
    }
  }, [currency]);

  // Check if currency is available for a tour/activity
  const isCurrencyAvailable = useCallback((item, checkCurrency = null) => {
    const check = checkCurrency || currency;
    const supportsCurrency = item.supportsCurrency || item.currencyType || 'both';
    
    if (check === 'EUR') {
      const hasEuroPrice = (item.priceEur || item.priceEUR || item.priceEuro || 0) > 0;
      return supportsCurrency === 'both' || 
             supportsCurrency === 'eur-only' || 
             supportsCurrency === 'euro-only' || 
             hasEuroPrice;
    } else {
      const hasMurPrice = (item.price || item.priceRs || item.priceMUR || 0) > 0;
      return supportsCurrency === 'both' || 
             supportsCurrency === 'rs-only' || 
             supportsCurrency === 'mur-only' || 
             hasMurPrice;
    }
  }, [currency]);

  // Get display name
  const getCurrencyDisplayName = useCallback(() => {
    return currency === 'EUR' ? 'EUR (€)' : 'MUR (Rs)';
  }, [currency]);

  // Get symbol
  const getCurrencySymbol = useCallback(() => {
    return currency === 'EUR' ? '€' : 'Rs';
  }, [currency]);

  return {
    currency,
    setCurrency,
    handleCurrencyChange,
    isCurrencyAvailable,
    getCurrencyDisplayName,
    getCurrencySymbol,
    toDisplayFormat,
    toCurrencyCode
  };
};