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
  
  if (isNaN(numericPrice)) {
    return `${symbol} 0`;
  }
  
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
  
  const numericPrice = parseFloat(price);
  
  if (isNaN(numericPrice)) {
    return `${symbol} 0`;
  }
  
  if (currency === 'EUR') {
    return `${symbol}${numericPrice.toFixed(2)}`;
  } else {
    return `${symbol} ${Math.round(numericPrice)}`;
  }
};

export const getCurrencyName = (currencyCode = 'MUR') => {
  return currencyConfig[currencyCode]?.name || 'Mauritian Rupees';
};

// New: Calculate price based on trip type and currency
export const calculateTransferPrice = (transfer, tripType, currency = 'MUR') => {
  if (!transfer) return 0;
  
  let price = 0;
  
  if (currency === 'MUR') {
    price = tripType === 'one-way' 
      ? transfer.oneWayPriceMUR 
      : transfer.roundTripPriceMUR;
  } else {
    price = tripType === 'one-way'
      ? transfer.oneWayPriceEUR
      : transfer.roundTripPriceEUR;
  }
  
  return parseFloat(price) || 0;
};

// New: Get alternative currency price
export const getAlternativePrice = (transfer, tripType, currentCurrency) => {
  if (!transfer) return { price: 0, currencySymbol: '' };
  
  const altCurrency = currentCurrency === 'MUR' ? 'EUR' : 'MUR';
  const price = calculateTransferPrice(transfer, tripType, altCurrency);
  const currencySymbol = getCurrencySymbol(altCurrency);
  
  return { price, currencySymbol };
};