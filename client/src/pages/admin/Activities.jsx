import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { activitiesAPI } from '../../utils/api';

const AdminActivities = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll();
      if (response.data.success) {
        setActivities(response.data.data || []);
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to load excursions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (searchParams.get('refetch') === 'true') {
      fetchActivities();
      navigate('/admin/activities', { replace: true });
    }
  }, [searchParams, navigate]);

  const filteredActivities = (activities || []).filter((activity) => {
    const matchesSearch =
      (activity?.title || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (activity?.location &&
        activity.location.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filter === 'all') return matchesSearch;
    if (filter === 'featured') return matchesSearch && activity?.featured;
    if (filter === 'active')
      return matchesSearch && activity?.status === 'active';
    if (filter === 'inactive')
      return matchesSearch && activity?.status === 'inactive';

    return matchesSearch && activity?.type === filter;
  });

  // ✅ Optimistic Delete (Instant UI)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this excursion?'))
      return;

    // Instantly remove item UI (FAST)
    const previousActivities = [...activities];
    setActivities((prev) => prev.filter((a) => a._id !== id));

    try {
      const response = await activitiesAPI.delete(id);

      if (!response.data.success) {
        throw new Error('Failed to delete activity');
      }

      alert('Excursion deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert(
        'Failed to delete excursion: ' +
          (error.response?.data?.error || error.message)
      );

      // Restore old list if API failed
      setActivities(previousActivities);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Excursions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Total {activities.length} excursions • {filteredActivities.length} filtered
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row gap-3">
          {/* View Mode Toggle - Mobile Only */}
          <div className="flex sm:hidden">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg border ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <i className="fas fa-list mr-1"></i> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg border ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <i className="fas fa-th-large mr-1"></i> Grid
              </button>
            </div>
          </div>
          
          <Link
            to="/admin/activities/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i> Add New
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2.5 border-gray-300 rounded-lg h-12"
                placeholder="Search excursions by name or location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                      filter === 'all'
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('featured')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                      filter === 'featured'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-star mr-1"></i> Featured
                  </button>
                  <button
                    onClick={() => setFilter('active')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                      filter === 'active'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilter('inactive')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                      filter === 'inactive'
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div>
                <select
                  className="block w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option disabled>───────────</option>
                  <option value="water-sports">Water Sports</option>
                  <option value="cruises">Cruises</option>
                  <option value="island-tours">Island Tours</option>
                  <option value="diving">Diving</option>
                  <option value="cultural">Cultural</option>
                  <option value="adventure">Adventure</option>
                  <option value="wellness">Wellness</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Grid View */}
      {viewMode === 'grid' && (
        <div className="block md:hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredActivities.map((activity) => (
                <div key={activity._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start">
                      <img
                        className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                        src={activity.image}
                        alt={activity.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/64?text=NA';
                        }}
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                              {activity.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {activity.location}
                            </p>
                          </div>
                          {activity.featured && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <i className="fas fa-star mr-1"></i>
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              ${activity.price}
                            </span>
                            <span className="text-xs text-gray-500">/package</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs ${
                              activity.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between pt-3 border-t border-gray-100">
                          <Link
                            to={`/admin/activities/view/${activity._id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            <i className="fas fa-eye mr-1"></i> View
                          </Link>
                          <Link
                            to={`/admin/activities/${activity._id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            <i className="fas fa-edit mr-1"></i> Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(activity._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            <i className="fas fa-trash mr-1"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-umbrella-beach text-gray-300 text-4xl mb-3"></i>
              <p className="text-gray-500">No excursions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table View / Mobile List View */}
      <div className={viewMode === 'grid' ? 'hidden md:block' : 'block'}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Excursion
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
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
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, index) => (
                      <tr
                        key={activity._id}
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-md object-cover mr-3"
                              src={activity.image}
                              alt={activity.title}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/48?text=NA';
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {activity.title}
                                {activity.featured && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    <i className="fas fa-star mr-1"></i> Featured
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {activity.location}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">
                              {activity.type}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            ${activity.price}
                          </div>
                          <div className="text-xs text-gray-500">per package</div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {activity.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/admin/activities/view/${activity._id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              <span className="hidden sm:inline">View</span>
                            </Link>
                            <Link
                              to={`/admin/activities/${activity._id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                            >
                              <i className="fas fa-edit mr-1"></i>
                              <span className="hidden sm:inline">Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(activity._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                            >
                              <i className="fas fa-trash mr-1"></i>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <i className="fas fa-umbrella-beach text-gray-300 text-4xl mb-3"></i>
                          <p className="text-gray-600">No excursions found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Try adjusting your search or filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            {filteredActivities.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                  Showing {filteredActivities.length} of {activities.length} excursions
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block text-sm text-gray-500">
                    View:
                  </div>
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 text-sm font-medium rounded-l-lg border ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <i className="fas fa-list"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 text-sm font-medium rounded-r-lg border ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <i className="fas fa-th-large"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminActivities;