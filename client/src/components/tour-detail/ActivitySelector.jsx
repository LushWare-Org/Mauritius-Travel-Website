import React, { useState, useEffect } from 'react';
import { activitiesAPI } from '../../utils/api';

const ActivitySelector = ({ selectedActivities = [], onActivitiesChange, guests = 1 }) => {
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll();
      
      if (response.data.success) {
        const activities = response.data.data || [];
        console.log('ActivitySelector - All activities loaded:', activities.length);
        setAllActivities(activities);
      } else {
        setError('Failed to load activities: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('ActivitySelector - Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleActivityToggle = (activityId) => {
    console.log('Toggling activity ID:', activityId);
    const isSelected = selectedActivities.includes(activityId);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedActivities.filter(id => id !== activityId);
    } else {
      newSelection = [...selectedActivities, activityId];
    }
    
    console.log('New selection IDs:', newSelection);
    onActivitiesChange(newSelection);
  };

  const filteredActivities = allActivities.filter(activity =>
    activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedActivitiesDetails = () => {
    return allActivities.filter(activity => 
      selectedActivities.includes(activity._id)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search activities..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Selected Activities Summary */}
      {selectedActivities.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            Selected Activities ({selectedActivities.length})
          </h3>
          <div className="space-y-2">
            {getSelectedActivitiesDetails().map(activity => {
              const price = Number(activity.price) || 0;
              const total = price * guests;
              
              return (
                <div key={activity._id} className="flex justify-between items-center bg-white p-2 rounded">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{activity.title}</span>
                    <div className="text-xs text-gray-500">
                      Rs {price.toFixed(2)} per person × {guests} guests = Rs {total.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleActivityToggle(activity._id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
        {filteredActivities.map(activity => {
          const isSelected = selectedActivities.includes(activity._id);
          const price = Number(activity.price) || 0;
          const total = price * guests;
          
          return (
            <div
              key={activity._id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
              onClick={() => handleActivityToggle(activity._id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleActivityToggle(activity._id)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    <span className="text-sm font-semibold text-blue-600">
                      Rs {price.toFixed(2)} <span className="text-xs text-gray-500">per person</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {activity.shortDescription || activity.description?.substring(0, 100)}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span className="mr-3 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {activity.duration} hrs
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {activity.type?.replace('-', ' ') || 'Activity'}
                    </span>
                  </div>
                  {isSelected && guests > 0 && (
                    <div className="mt-1 text-xs text-green-600 font-medium">
                      Total for {guests} guests: Rs{total.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No activities found. Try a different search term.
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}
    </div>
  );
};

export default ActivitySelector;