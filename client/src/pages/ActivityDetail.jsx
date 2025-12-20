import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ActivityImageGallery from '../components/activity-detail/ActivityImageGallery';
import ActivityInfo from '../components/activity-detail/ActivityInfo';
import ActivityTabs from '../components/activity-detail/ActivityTabs';
import BookingForm from '../components/activity-detail/BookingForm';
import RelatedActivities from '../components/activity-detail/RelatedActivities';
import { activitiesAPI } from '../utils/api';

const ActivityDetail = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedActivities, setRelatedActivities] = useState([]);
    const [currency, setCurrency] = useState(() => {
      // Get currency from URL params or localStorage or default to USD
      return searchParams.get('currency') || localStorage.getItem('preferredCurrency') || 'USD';
    });
    
    useEffect(() => {
      const fetchActivity = async () => {
        setLoading(true);
        try {
          // Get the activity by its ID with currency parameter
          const activityResponse = await activitiesAPI.getById(id, currency);
          const foundActivity = activityResponse?.data?.data;
          
          if (foundActivity) {
            setActivity(foundActivity);
            
            // Fetch related activities with same currency
            const allActivitiesResponse = await activitiesAPI.getAll({ currency });
            const allActivities = allActivitiesResponse?.data?.data || [];
            
            const related = allActivities
              .filter(act => 
                act?._id !== foundActivity._id && 
                (act?.type === foundActivity.type || act?.location === foundActivity.location)
              )
              .slice(0, 4);
            
            setRelatedActivities(related);
          }
        } catch (error) {
          console.error('Error fetching activity details:', error);
        } finally {
          setLoading(false);
        }
      };

      if (id) {
        fetchActivity();
      }
    }, [id, currency]);

    // Function to change currency
    const handleCurrencyChange = (newCurrency) => {
      setCurrency(newCurrency);
      localStorage.setItem('preferredCurrency', newCurrency);
      // Update URL with currency parameter
      setSearchParams({ currency: newCurrency });
    };

    if (loading) {
      return (
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!activity) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h2 className="text-xl font-bold mb-2">Activity Not Found</h2>
            <p>Sorry, we couldn't find the activity you're looking for.</p>
          </div>
        </div>
      );
    }

    return (
        <div className="bg-gray-50">
            {/* Activity Image Gallery */}
            <ActivityImageGallery activity={activity} />
            
            <div className="container mx-auto px-4 py-8">
                {/* Activity Info with Currency Selector */}
                <ActivityInfo 
                  activity={activity} 
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                />
                
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Details Tabs */}
                    <div className="lg:col-span-2">
                        <ActivityTabs activity={activity} />
                    </div>
                    
                    {/* Right Column - Booking Form */}
                    <div>
                        <BookingForm activity={activity} currency={currency} />
                    </div>
                </div>
                
                {/* Related Activities */}
                <div className="mt-16">
                    <RelatedActivities activities={relatedActivities} currency={currency} />
                </div>
            </div>
        </div>
    );
};

export default ActivityDetail;