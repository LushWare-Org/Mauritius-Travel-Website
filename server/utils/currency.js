// server/utils/currency.js
const calculateTransferPrice = (transfer, tripType, currency = 'MUR') => {
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

const getAlternativePrice = (transfer, tripType, currentCurrency) => {
  if (!transfer) return 0;
  
  const altCurrency = currentCurrency === 'MUR' ? 'EUR' : 'MUR';
  return calculateTransferPrice(transfer, tripType, altCurrency);
};

export default {
  calculateTransferPrice,
  getAlternativePrice
};