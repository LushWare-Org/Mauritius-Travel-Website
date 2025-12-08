// utils/priceCalculator.js
export const calculateTourPackagePrice = (basePrice, guests, selectedActivities = []) => {
  const packageTotal = basePrice * guests;
  const activitiesTotal = selectedActivities.reduce(
    (sum, activity) => sum + (activity.price || 0) * guests,
    0
  );
  const totalPrice = packageTotal + activitiesTotal;
  
  return {
    packageTotal,
    activitiesTotal,
    totalPrice,
    breakdown: {
      package: {
        perPerson: basePrice,
        guests: guests,
        total: packageTotal
      },
      activities: selectedActivities.map(activity => ({
        id: activity._id,
        title: activity.title,
        perPerson: activity.price,
        guests: guests,
        total: activity.price * guests
      }))
    }
  };
};

export const formatPrice = (amount) => {
  // Format as Mauritian Rupees (Rs)
  return new Intl.NumberFormat('en-MU', {
    style: 'currency',
    currency: 'MUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};