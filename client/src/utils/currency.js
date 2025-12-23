export const currencyConfig = {
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
  return `${symbol}${parseFloat(price).toFixed(2)}`;
};

export const getCurrencyName = (currencyCode = 'MUR') => {
  return currencyConfig[currencyCode]?.name || 'Mauritian Rupees';
};