// utils/currency.js
export const currencyConfig = {
  EUR: {
    symbol: '€',
    name: 'Euro',
    code: 'EUR'
  },
  MUR: {
    symbol: 'Rs',
    name: 'Mauritian Rupees',
    code: 'MUR'
  }
};

export const getCurrencySymbol = (currencyCode = 'MUR') => {
  return currencyConfig[currencyCode]?.symbol || 'Rs';
};

export const formatPrice = (price, currencyCode = 'MUR') => {
  const symbol = getCurrencySymbol(currencyCode);
  const numericPrice = parseFloat(price);
  
  if (currencyCode === 'EUR') {
    return `${symbol}${numericPrice.toFixed(2)}`;
  } else {
    return `${symbol} ${Math.round(numericPrice)}`;
  }
};

export const getBookingCurrency = (booking) => {
  // First check for booking.currency (direct field)
  if (booking && booking.currency) {
    return booking.currency;
  }
  
  // Check airport transfer currency
  if (booking && booking.airportTransfer?.currency) {
    return booking.airportTransfer.currency;
  }
  
  // Default fallback
  return 'MUR';
};

export const formatBookingPrice = (price, booking) => {
  if (!price && price !== 0) return 'N/A';
  
  console.log('🔧 formatBookingPrice called:', { price, booking });
  
  // Handle both booking object and currency string
  let currency, symbol;
  
  if (typeof booking === 'object') {
    currency = getBookingCurrency(booking);
    symbol = booking.currencySymbol || getCurrencySymbol(currency);
  } else {
    // If booking is actually a currency string
    currency = booking || 'MUR';
    symbol = getCurrencySymbol(currency);
  }
  
  console.log('🔧 Formatting with:', { currency, symbol, price });
  
  const numericPrice = parseFloat(price);
  
  if (currency === 'EUR') {
    return `€${numericPrice.toFixed(2)}`;
  } else {
    return `Rs ${Math.round(numericPrice)}`;
  }
};

export const getCurrencyName = (currencyCode = 'MUR') => {
  return currencyConfig[currencyCode]?.name || 'Mauritian Rupees';
};