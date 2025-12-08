import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const AdminTourPackageView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'https://maldives-activity-booking-backend.onrender.com/api/v1';

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/tour-packages/${id}`);

        if (response.data.success) {
          setTour(response.data.data);
        } else {
          throw new Error('Failed to fetch tour package details');
        }
      } catch (err) {
        console.error('Error fetching tour package:', err);
        setError('Failed to load tour package details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTour();
  }, [id]);

  // Delete handler
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tour package?')) {
      try {
        setLoading(true);
        const response = await axios.delete(`${API_URL}/tour-packages/${id}`);
        if (response.data.success) {
          navigate('/admin/tour-packages');
        } else {
          throw new Error('Failed to delete tour package');
        }
      } catch (err) {
        console.error('Error deleting tour package:', err);
        alert('Failed to delete tour package: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !tour) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-500"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Tour package not found'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/tour-packages')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          Back to Tour Packages
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tour Package Details</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
          <Link
            to={`/admin/tour-packages/${tour._id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <i className="fas fa-edit mr-2"></i> Edit Tour
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <i className="fas fa-trash mr-2"></i> Delete
          </button>
          <Link
            to="/admin/tour-packages"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{tour.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Tour ID: {tour._id}</p>
          </div>
          <div>
            {tour.featured && (
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Featured
              </span>
            )}
            <span className={`ml-2 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
              tour.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {tour.status ? tour.status.charAt(0).toUpperCase() + tour.status.slice(1) : 'Active'}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* Left column: Images */}
            <div className="md:col-span-1">
              <img 
                src={tour.image} 
                alt={tour.title} 
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
              />
              {tour.galleryImages && tour.galleryImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Gallery Images:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {tour.galleryImages.map((img, index) => (
                      <img 
                        key={index}
                        src={img} 
                        alt={`Gallery ${index + 1}`} 
                        className="w-full h-20 object-cover rounded"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100?text=NA'; }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Details */}
            <div className="md:col-span-2">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-lg text-gray-900">RS {tour.price}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-gray-900">{tour.duration} day{tour.duration !== 1 ? 's' : ''}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-gray-900">{tour.location}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-gray-900">{tour.type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</dd>
                </div>

                {tour.included && tour.included.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 mb-2">What's Included</dt>
                    <dd className="mt-1">
                      <ul className="list-disc pl-5 space-y-1">
                        {tour.included.map((item, i) => (
                          <li key={i} className="text-gray-900">{item}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}

                {tour.notIncluded && tour.notIncluded.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Not Included</dt>
                    <dd className="mt-1">
                      <ul className="list-disc pl-5 space-y-1">
                        {tour.notIncluded.map((item, i) => (
                          <li key={i} className="text-gray-900">{item}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-line">{tour.description}</dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(tour.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link 
          to={`/tour-packages/${tour._id}`} 
          target="_blank" 
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <i className="fas fa-external-link-alt mr-2"></i>
          View on Public Site
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminTourPackageView;
