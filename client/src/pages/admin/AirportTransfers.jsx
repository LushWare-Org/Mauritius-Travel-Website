import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { airportTransferAPI } from '../../utils/airportTransferApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AirportTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await airportTransferAPI.getAll();
      
      if (response.data.success) {
        setTransfers(response.data.data);
      } else {
        setError('Failed to load airport transfers');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load airport transfers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await airportTransferAPI.delete(id);
      setTransfers(transfers.filter(transfer => transfer._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting transfer:', err);
      setError('Failed to delete transfer');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await airportTransferAPI.update(id, { isActive: newStatus });
      
      if (response.data.success) {
        setTransfers(transfers.map(transfer => 
          transfer._id === id ? { ...transfer, isActive: newStatus } : transfer
        ));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update transfer status');
    }
  };

  const getVehicleIcon = (type) => {
    switch(type) {
      case 'car': return 'fas fa-car text-blue-500';
      case 'van': return 'fas fa-shuttle-van text-green-500';
      case 'bus': return 'fas fa-bus text-purple-500';
      case 'speedboat': return 'fas fa-ship text-yellow-500';
      case 'seaplane': return 'fas fa-plane text-red-500';
      default: return 'fas fa-car text-gray-500';
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return transfer.isActive;
    if (statusFilter === 'inactive') return !transfer.isActive;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Airport Transfers</h1>
              <p className="text-gray-600">Manage airport transfer services</p>
            </div>
            <Link
              to="/admin/airport-transfers/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Transfer
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                >
                  <option value="all">All Transfers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Showing {filteredTransfers.length} of {transfers.length} transfers
                </p>
              </div>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {filteredTransfers.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-plane-slash text-gray-300 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
                <p className="text-gray-500">
                  {statusFilter === 'all' ? 'Get started by creating your first airport transfer.' : 'No transfers match the selected filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Airport
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prices
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransfers.map((transfer) => (
                      <tr key={transfer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-plane text-blue-600"></i>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {transfer.airportName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transfer.airportCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <i className={`${getVehicleIcon(transfer.vehicleType)} mr-2`}></i>
                            <span className="text-sm text-gray-900 capitalize">{transfer.vehicleType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              One-way: <span className="font-semibold">Rs{transfer.oneWayPrice}</span>
                            </div>
                            <div className="text-gray-500">
                              Round-trip: <span className="font-semibold">Rs{transfer.roundTripPrice}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transfer.capacity} passengers
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(transfer._id, transfer.isActive)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              transfer.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {transfer.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/admin/airport-transfers/${transfer._id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm(transfer._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Transfer</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this airport transfer? This action cannot be undone.
                  </p>
                </div>
                <div className="mt-4 flex justify-center space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AirportTransfers;