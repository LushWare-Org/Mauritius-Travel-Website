import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const AdminTourPackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'https://maldives-activity-booking-backend.onrender.com/api/v1';

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/tour-packages/${id}`);
        if (response.data.success) {
          setPkg(response.data.data);
        } else {
          throw new Error('Failed to fetch tour package');
        }
      } catch (error) {
        console.error('Error fetching tour package:', error);
        setError('Failed to load tour package details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPackage();
  }, [id]);

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
      } catch (error) {
        console.error('Error deleting tour package:', error);
        alert('Failed to delete tour package: ' + (error.response?.data?.error || error.message));
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

  if (error || !pkg) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-500"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || "Tour package not found"}</p>
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
        <div className="mt-3 flex space-x-3 sm:mt-0">
          <Link
            to="/admin/tour-packages"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back
          </Link>
          <Link
            to={`/admin/tour-packages/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <i className="fas fa-edit mr-2"></i> Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <i className="fas fa-trash mr-2"></i> Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{pkg.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Created on {new Date(pkg.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            {pkg.featured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Featured
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              pkg.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {pkg.status ? pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1) : 'Active'}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Left Column */}
            <div>
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Main Image</h4>
                <div className="h-64 rounded-lg overflow-hidden">
                  <img 
                    src={pkg.image} 
                    alt={pkg.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                    }}
                  />
                </div>
              </div>

              {pkg.galleryImages?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Gallery Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pkg.galleryImages.map((img, index) => (
                      <div key={index} className="h-24 rounded-lg overflow-hidden">
                        <img 
                          src={img} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Details */}
              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">RS{pkg.price}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pkg.duration} hours</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pkg.location}</dd>
                </div>
                {/*<div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pkg.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</dd>
                </div>*/}
              </dl>
            </div>

            {/* Right Column */}
            <div>
              {pkg.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{pkg.description}</p>
                  </div>
                </div>
              )}

              {pkg.shortDescription && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Short Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{pkg.shortDescription}</p>
                  </div>
                </div>
              )}

              {pkg.included?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">What's Included</h4>
                  <ul className="bg-gray-50 rounded-lg p-4">
                    {pkg.included.map((item, i) => (
                      <li key={i} className="flex items-start mb-2 last:mb-0">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pkg.notIncluded?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Not Included</h4>
                  <ul className="bg-gray-50 rounded-lg p-4">
                    {pkg.notIncluded.map((item, i) => (
                      <li key={i} className="flex items-start mb-2 last:mb-0">
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Link */}
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">ID: {pkg._id}</span>
            <Link
              to={`/tour-packages/${pkg._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View on website <i className="fas fa-external-link-alt ml-1"></i>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTourPackageDetail;
