import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { tourPackagesAPI } from '../../utils/api';

const AdminTourPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await tourPackagesAPI.getAll();
        if (response.data.success) {
          setPackages(response.data.data || []);
        } else {
          throw new Error('Failed to fetch tour packages');
        }
      } catch (error) {
        console.error('Error fetching tour packages:', error);
        setError('Failed to load tour packages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Filter packages based on search term and filter
  const filteredPackages = (packages || []).filter(pkg => {
    const matchesSearch = (pkg?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (pkg?.location && pkg.location.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filter === 'all') return matchesSearch;
    if (filter === 'featured') return matchesSearch && pkg?.featured;
    if (filter === 'active') return matchesSearch && pkg?.status === 'active';
    if (filter === 'inactive') return matchesSearch && pkg?.status === 'inactive';

    return matchesSearch;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tour package?')) {
      try {
        setLoading(true);
        const response = await tourPackagesAPI.delete(id);

        if (response.data.success) {
          setPackages(packages.filter(pkg => pkg._id !== id));
          alert('Tour package deleted successfully');
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

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-500"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          Try Again
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Tour Packages</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Link
            to="/admin/tour-packages/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <i className="fas fa-plus mr-2"></i> Add New Package
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label htmlFor="search" className="sr-only">Search Tour Packages</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2.5 text-base border-gray-300 rounded-lg h-12"
                  placeholder="Search tour packages by name or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="filter" className="sr-only">Filter</label>
              <select
                id="filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Packages</option>
                <option value="featured">Featured Only</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Packages List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.length > 0 ? (
                  filteredPackages.map((pkg, index) => (
                    <tr key={pkg._id} className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 mr-3">
                            <img 
                              className="h-12 w-12 rounded-md object-cover shadow-sm border border-gray-200" 
                              src={pkg.image} 
                              alt={pkg.title} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/48?text=NA';
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center flex-wrap">
                              {pkg.title}
                              {pkg.featured && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-600 mr-1"></span>
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {pkg.location}
                            </div>
                            {/* Added Duration here as part of the package info */}
                            {pkg.duration && (
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {pkg.duration}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          RS {pkg.price}<span className="text-xs text-gray-500">/person</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          pkg.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                            pkg.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                          }`}></span>
                          {pkg.status ? pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1) : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/*<Link
                          to={`/admin/tour-packages/view/${pkg._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="View"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>*/}
                        <Link
                          to={`/admin/tour-packages/${pkg._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => handleDelete(pkg._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">
                      No tour packages found. {searchTerm && 'Try a different search term.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Showing {filteredPackages.length} of {packages.length} tour packages
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTourPackages;