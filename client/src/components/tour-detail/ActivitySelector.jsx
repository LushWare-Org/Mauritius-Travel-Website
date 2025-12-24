import React, { useState, useEffect } from 'react';
import { activitiesAPI } from '../../utils/api';
import { FaClock, FaCheck, FaSearch, FaTag, FaUserFriends, FaCalendarAlt } from 'react-icons/fa';
import { FiX, FiRefreshCw } from 'react-icons/fi';

const ActivitySelector = ({ 
  selectedActivities = [], 
  onActivitiesChange, 
  guests = 1, 
  filter = '', 
  activityDurations = {}, 
  onDurationChange, 
  userCurrency = 'rs'
}) => {
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(filter);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    setSearchTerm(filter);
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await activitiesAPI.getAll();
      if (response.data.success) {
        setAllActivities(response.data.data || []);
      } else {
        setError('Failed to load activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    return userCurrency === 'euro' ? '€' : 'Rs';
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    const symbol = getCurrencySymbol();
    if (userCurrency === 'euro') {
      return `${symbol}${num.toFixed(2)}`;
    }
    return `${symbol}${Math.round(num).toLocaleString()}`;
  };

  const getActivityPrice = (activity) => {
    let price = 0;
    const supportsDuration = activity.halfDayPrice || activity.fullDayPrice;
    
    if (supportsDuration) {
      const duration = activityDurations[activity._id] || 'halfDay';
      const isEuro = userCurrency === 'euro';
      const priceField = duration === 'halfDay' 
        ? (isEuro ? 'halfDayPriceEUR' : 'halfDayPriceMUR')
        : (isEuro ? 'fullDayPriceEUR' : 'fullDayPriceMUR');
      
      price = activity[priceField] !== undefined 
        ? Number(activity[priceField]) 
        : Number(duration === 'halfDay' ? activity.halfDayPrice : activity.fullDayPrice || 0);
    } else {
      const priceField = userCurrency === 'euro' ? 'priceEUR' : 'priceMUR';
      price = activity[priceField] !== undefined 
        ? Number(activity[priceField]) 
        : Number(activity.price || 0);
    }
    
    return price;
  };

  const getDurationPrice = (activity, durationType) => {
    const isEuro = userCurrency === 'euro';
    const priceField = durationType === 'halfDay'
      ? (isEuro ? 'halfDayPriceEUR' : 'halfDayPriceMUR')
      : (isEuro ? 'fullDayPriceEUR' : 'fullDayPriceMUR');
    const regularField = durationType === 'halfDay' ? 'halfDayPrice' : 'fullDayPrice';
    
    return activity[priceField] !== undefined 
      ? Number(activity[priceField]) 
      : Number(activity[regularField] || 0);
  };

  const showDurationSelection = (activity) => {
    return activity.halfDayPrice || activity.fullDayPrice;
  };

  const handleActivityToggle = (activityId) => {
    const newSelection = selectedActivities.includes(activityId)
      ? selectedActivities.filter(id => id !== activityId)
      : [...selectedActivities, activityId];
    
    onActivitiesChange(newSelection);
  };

  const filteredActivities = allActivities.filter(activity =>
    activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedActivitiesDetails = () => {
    return allActivities.filter(activity => selectedActivities.includes(activity._id));
  };

  const totalPrice = getSelectedActivitiesDetails().reduce((sum, activity) => {
    return sum + (getActivityPrice(activity) * guests);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Header - Minimal */}
      <div className="border-b pb-3">
        <h2 className="text-xl font-semibold text-gray-800">Select Activities</h2>
        <p className="text-sm text-gray-500 mt-1">Choose from available options</p>
      </div>

      {/* Search & Summary Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Summary - Only show when selected */}
        {selectedActivities.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 min-w-[200px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Selected</p>
                <p className="font-medium text-gray-800">
                  {selectedActivities.length} {selectedActivities.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="font-semibold text-blue-600 text-lg">
                  {formatPrice(totalPrice)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities Grid - Mobile: 1 column, Desktop: 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredActivities.map(activity => {
          const isSelected = selectedActivities.includes(activity._id);
          const price = getActivityPrice(activity);
          const total = price * guests;
          const supportsDuration = showDurationSelection(activity);

          return (
            <div
              key={activity._id}
              className={`rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="p-4">
                {/* Activity Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800 truncate">{activity.title}</h3>
                      {activity.type && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap">
                          <FaTag className="text-xs" />
                          {activity.type}
                        </span>
                      )}
                    </div>
                    {activity.duration && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FaClock className="text-gray-400" />
                        <span>{activity.duration}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleActivityToggle(activity._id)}
                    className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <FaCheck className={isSelected ? "text-sm" : "text-sm opacity-50"} />
                  </button>
                </div>

                {/* Description - Truncated */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {activity.shortDescription || activity.description}
                </p>

                {/* Duration Selection - Compact */}
                {supportsDuration && isSelected && (
                  <div className="mb-3 p-3 bg-white border border-gray-100 rounded-md">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Duration:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['halfDay', 'fullDay'].map((type) => (
                        <button
                          key={type}
                          onClick={() => onDurationChange(activity._id, type)}
                          className={`p-2 rounded border transition-colors text-xs ${
                            activityDurations[activity._id] === type
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{type === 'halfDay' ? 'Half Day' : 'Full Day'}</div>
                          <div className="text-xs mt-0.5">
                            {formatPrice(getDurationPrice(activity, type))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration Preview - Even more compact */}
                {supportsDuration && !isSelected && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <FaCalendarAlt className="text-xs" />
                      <span>Available:</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-700">
                        Half: <span className="font-medium">{formatPrice(getDurationPrice(activity, 'halfDay'))}</span>
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700">
                        Full: <span className="font-medium">{formatPrice(getDurationPrice(activity, 'fullDay'))}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Pricing - Compact */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Price per person</p>
                      <p className="font-semibold text-gray-800">{formatPrice(price)}</p>
                    </div>
                    {isSelected && guests > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Total for {guests}</p>
                        <p className="font-semibold text-blue-600">{formatPrice(total)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && !error && (
        <div className="text-center py-8">
          <div className="text-gray-300 mb-3">
            <FaSearch className="text-3xl mx-auto" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">No activities found</h3>
          <p className="text-xs text-gray-500 mb-4">
            {searchTerm ? `No results for "${searchTerm}"` : 'No activities available'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-red-500">
              <FiRefreshCw className="text-lg" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">Error loading activities</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchActivities}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitySelector;