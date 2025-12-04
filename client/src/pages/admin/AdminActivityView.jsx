import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { activitiesAPI } from '../../utils/api';
const AdminActivityView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        console.log(`📡 Fetching activity with ID: ${id}`);
        const response = await activitiesAPI.getById(id);
        console.log('📦 API Response:', response.data);
        if (response.data && response.data.success) {
          setActivity(response.data.data);
          console.log('✅ Activity loaded successfully');
        } else if (response.data && response.data.data) {
          setActivity(response.data.data);
          console.log('✅ Activity loaded (direct data format)');
        } else if (response.data) {
          setActivity(response.data);
          console.log('✅ Activity loaded (direct response format)');
        } else {
          throw new Error(
            'Failed to fetch excursion details - invalid response format'
          );
        }
      } catch (error) {
        console.error('❌ Error fetching activity:', error);
        if (error.response?.status === 404) {
          setError('Excursion not found. It may have been deleted.');
        } else if (error.response?.status === 500) {
          setError('Server error. Please try again later.');
        } else if (error.message.includes('Network Error')) {
          setError(
            'Network error. Please check your connection and try again.'
          );
        } else {
          setError('Failed to load excursion details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchActivity();
    } else {
      setError('No excursion ID provided');
      setLoading(false);
    }
  }, [id]);
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this excursion?')) {
      try {
        setLoading(true);
        const response = await activitiesAPI.delete(id);
        if (response.data.success) {
          // Navigate back with refresh flag
          navigate('/admin/activities', {
            state: { refresh: true },
          });
        } else {
          throw new Error('Failed to delete excursion');
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert(
          'Failed to delete excursion: ' +
            (error.response?.data?.error || error.message)
        );
      } finally {
        setLoading(false);
      }
    }
  };
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-600 font-medium">
            Loading excursion details...
          </p>
          <p className="text-gray-500 text-sm mt-1">ID: {id}</p>
        </div>
      </AdminLayout>
    );
  }
  if (error || !activity) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Unable to Load Excursion
              </h3>
              <p className="text-red-700 mt-2">
                {error || 'Excursion not found'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/admin/activities')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Excursions
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  const editPath = `/admin/activities/${activity._id}`;
  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Excursion Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            Viewing: {activity.title}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-wrap gap-3">
          <Link
            to={editPath}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <svg
              className="h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Excursion
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <svg
              className="h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
          <Link
            to="/admin/activities"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <svg
              className="h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Excursions
          </Link>
        </div>
      </div>
      {/* Debug banner - can remove in production */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-green-700">
            <span className="font-medium">✅ API Success:</span> Loaded excursion
            "{activity.title}" (ID: {activity._id})
          </div>
          <button
            onClick={() => console.log('Activity data:', activity)}
            className="text-xs text-green-600 hover:text-green-800"
          >
            View Data in Console
          </button>
        </div>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {activity.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Created on{' '}
              {new Date(activity.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex space-x-2">
            {activity.featured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <svg
                  className="mr-1 h-2 w-2 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Featured
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activity.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <svg
                className="mr-1 h-2 w-2"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx="4" cy="4" r="3" />
              </svg>
              {activity.status
                ? activity.status.charAt(0).toUpperCase() +
                  activity.status.slice(1)
                : 'Active'}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Images */}
            <div className="lg:col-span-1">
              {/* Main Image */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Main Image
                </h4>
                <div className="relative h-64 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>
              </div>
              {/* Gallery Images */}
              {activity.galleryImages && activity.galleryImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Gallery Images
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {activity.galleryImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative h-24 rounded overflow-hidden border border-gray-200"
                      >
                        <img
                          src={img}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://via.placeholder.com/150x100?text=Image';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Basic Details Card */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Quick Details
                </h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Type:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {activity.type
                        ?.replace('-', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                        'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Location:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {activity.location || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Duration:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {activity.duration || 0} hour
                      {activity.duration !== 1 ? 's' : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Max Participants:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {activity.maxParticipants || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Rating:</dt>
                    <dd className="text-sm font-medium text-gray-900 flex items-center">
                      <svg
                        className="h-3 w-3 text-yellow-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {activity.rating || 0} ({activity.reviewCount || 0}{' '}
                      reviews)
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            {/* Right Column - Details */}
            <div className="lg:col-span-2">
              {/* Pricing Information */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Pricing Information
                </h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Base Price */}
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500 font-medium">
                        Base Price
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mt-1">
                        ${activity.price || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Standard pricing
                      </div>
                    </div>
                    {/* Half Day Price */}
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-purple-200">
                      <div className="text-sm text-gray-500 font-medium">
                        Half Day Price
                      </div>
                      <div className="text-2xl font-bold text-purple-700 mt-1">
                        ${activity.halfDayPrice || activity.price || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.halfDayPrice
                          ? 'Half day pricing'
                          : 'Uses base price'}
                      </div>
                    </div>
                    {/* Full Day Price */}
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-indigo-200">
                      <div className="text-sm text-gray-500 font-medium">
                        Full Day Price
                      </div>
                      <div className="text-2xl font-bold text-indigo-700 mt-1">
                        ${activity.fullDayPrice || activity.price || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.fullDayPrice
                          ? 'Full day pricing'
                          : 'Uses base price'}
                      </div>
                    </div>
                  </div>
                  {/* Pricing Type Badge */}
                  <div className="mt-4 flex items-center justify-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        activity.pricingType === 'half-full-day'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <svg
                        className="mr-1.5 h-2 w-2"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      {activity.pricingType === 'half-full-day'
                        ? 'Half/Full Day Pricing'
                        : 'Single Price'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Description */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Description
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {activity.description || 'No description available'}
                  </p>
                </div>
              </div>
              {/* Short Description */}
              {activity.shortDescription && (
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Short Description
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{activity.shortDescription}</p>
                  </div>
                </div>
              )}
              {/* Included & Not Included */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Included */}
                {activity.included && activity.included.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      What's Included
                    </h4>
                    <ul className="bg-green-50 rounded-lg p-4 space-y-2">
                      {activity.included.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Not Included */}
                {activity.notIncluded && activity.notIncluded.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Not Included
                    </h4>
                    <ul className="bg-red-50 rounded-lg p-4 space-y-2">
                      {activity.notIncluded.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {/* Requirements */}
              {activity.requirements && activity.requirements.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Requirements
                  </h4>
                  <ul className="bg-blue-50 rounded-lg p-4 space-y-2">
                    {activity.requirements.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Activity ID */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Excursion ID
                    </h4>
                    <p className="text-sm font-mono text-gray-700 mt-1">
                      {activity._id}
                    </p>
                  </div>
                  <Link
                    to={`/activities/${activity._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View on Public Site
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
export default AdminActivityView;