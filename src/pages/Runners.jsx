// src/pages/Runners.jsx - Complete modern design with enhanced CSV export
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  UsersIcon,
  UserIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { listenToRunnerLocation, removeListeners, connectToAdminDashboard } from '../utils/socket';
import RunnerMapPopup from '../components/RunnerDetailsPopup';
import { showError, showSuccess } from '../utils/modalManager';

export default function Runners() {
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [locationUpdateCounter, setLocationUpdateCounter] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    connectToAdminDashboard();
    listenToRunnerLocation(handleRunnerLocationUpdate);
    
    return () => {
      removeListeners();
    };
  }, []);

  useEffect(() => {
    fetchRunners();
  }, [pagination.page, filters, locationUpdateCounter]);

  const handleRunnerLocationUpdate = (data) => {
    if (!data || !data.runnerId) return;
    
    console.log('Received location update for runner:', data.runnerId);
    
    setRunners(prevRunners => {
      const updated = prevRunners.map(runner => {
        if (runner._id === data.runnerId || runner.runnerNumber === data.runnerNumber) {
          return {
            ...runner,
            lastKnownLocation: data.location,
            status: data.status || runner.status,
            lastUpdate: new Date().toISOString()
          };
        }
        return runner;
      });
      
      if (updated.some(r => r._id === data.runnerId || r.runnerNumber === data.runnerNumber)) {
        return updated;
      }
      
      setLocationUpdateCounter(prev => prev + 1);
      return prevRunners;
    });
    
    if (selectedRunner && (selectedRunner._id === data.runnerId || selectedRunner.runnerNumber === data.runnerNumber)) {
      setSelectedRunner(prev => ({
        ...prev,
        lastKnownLocation: data.location,
        status: data.status || prev.status,
        lastUpdate: new Date().toISOString()
      }));
    }
  };

  const fetchRunners = async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const { status, category, search } = filters;
      
      let query = `?page=${page}&limit=${limit}`;
      if (status) query += `&status=${status}`;
      if (category) query += `&category=${category}`;
      if (search) query += `&search=${search}`;
      
      console.log(`Fetching runners with query: ${query}`);
      
      const response = await axios.get(`/runners${query}`);
      
      if (response.data?.success) {
        console.log(`Received ${response.data.data?.length || 0} runners out of ${response.data.count || 0} total`);
        setRunners(response.data.data || []);
        setPagination({
          ...pagination,
          total: response.data.count || 0,
          totalPages: Math.ceil((response.data.count || 0) / pagination.limit)
        });
        setError(null);
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching runners:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch runners');
      
      setRunners([]);
      setPagination({
        ...pagination,
        total: 0,
        totalPages: 0
      });
      
      showError('Unable to fetch runners data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRunners();
  };

  const exportRunners = async () => {
    try {
      setExportLoading(true);
      
      const response = await axios.get('/runners/export', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `victoria-falls-marathon-runners-${currentDate}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      showSuccess('Runners data exported successfully!');
    } catch (err) {
      console.error('Error exporting runners:', err);
      showError('Failed to export runners data. Please try again later.');
    } finally {
      setExportLoading(false);
    }
  };

  const updateRunnerStatus = async (runnerId, status, location = null) => {
    try {
      const data = { status };
      if (location) {
        data.lastKnownLocation = location;
      }
      
      const response = await axios.put(`/runners/${runnerId}`, data);
      
      if (response.data?.success) {
        setRunners(prevRunners => 
          prevRunners.map(runner => 
            runner._id === runnerId ? { ...runner, status, ...(location && { lastKnownLocation: location }) } : runner
          )
        );
        
        showSuccess(`Runner status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
      } else {
        throw new Error(response.data?.error || 'Invalid update response');
      }
    } catch (err) {
      console.error('Error updating runner status:', err);
      showError(err.response?.data?.error || err.message || 'Failed to update runner status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#6bb944';
      case 'registered': return '#0067a5';
      case 'completed': return '#6fb7e3';
      case 'inactive': return '#ed1c25';
      default: return '#94a3b8';
    }
  };

  const viewRunnerDetails = (runner) => {
    setSelectedRunner(runner);
  };

  const statusCounts = {
    total: pagination.total,
    active: runners.filter(r => r.status === 'active').length,
    registered: runners.filter(r => r.status === 'registered').length,
    completed: runners.filter(r => r.status === 'completed').length,
    inactive: runners.filter(r => r.status === 'inactive').length
  };

  if (loading && pagination.page === 1) return <Loading />;
  
  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#0067a5' }}
              >
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Runners Management</h1>
                <p className="text-sm text-gray-500">Manage marathon participants and track their progress</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search runners..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  name="search"
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="registered">Registered</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Half Marathon">Half Marathon</option>
                <option value="Full Marathon">Full Marathon</option>
                <option value="Fun Run">Fun Run</option>
              </select>
            </form>
            <button
              onClick={exportRunners}
              disabled={exportLoading}
              className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50"
              style={{ backgroundColor: '#6bb944' }}
              onMouseEnter={(e) => !exportLoading && (e.target.style.backgroundColor = '#5fa83c')}
              onMouseLeave={(e) => !exportLoading && (e.target.style.backgroundColor = '#6bb944')}
            >
              {exportLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Runners</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.active}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6bb944' }}
            >
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Registered</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.registered}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <UserIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.completed}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.inactive}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#ed1c25' }}
            >
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <Error message={error} onRetry={fetchRunners} />}

      {/* Runners Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Runners</h2>
            <p className="text-sm text-gray-500">Showing {runners.length} of {pagination.total} runners</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : runners.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No runners found</h3>
            <p className="text-gray-500">
              {filters.search || filters.status || filters.category
                ? 'No runners match your current filters.'
                : 'No runners have been registered yet.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {runners.map((runner) => (
              <div key={runner._id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: getStatusColor(runner.status) }}
                    >
                      {runner.name?.charAt(0) || 'R'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{runner.name}</h3>
                      <p className="text-xs text-gray-500">#{runner.runnerNumber}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getStatusBadgeClass(runner.status)}`}>
                      {runner.status?.charAt(0).toUpperCase() + runner.status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900 truncate ml-2">{runner.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Categories</span>
                    <span className="text-gray-900">{runner.registeredCategories?.length || 0}</span>
                  </div>
                  {runner.lastKnownLocation && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      <span>Last location available</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => viewRunnerDetails(runner)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0067a5' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      const newStatus = runner.status === 'active' ? 'completed' : 'active';
                      updateRunnerStatus(runner._id, newStatus);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: runner.status === 'active' ? '#6fb7e3' : '#6bb944' }}
                  >
                    {runner.status === 'active' ? 'Complete' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Runner</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Categories</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Registered</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runners.map((runner) => (
                  <tr key={runner._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: getStatusColor(runner.status) }}
                        >
                          {runner.name?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{runner.name}</div>
                          <div className="text-xs text-gray-500">#{runner.runnerNumber}</div>
                          <div className="text-xs text-gray-500">{runner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {runner.registeredCategories && runner.registeredCategories.length > 0 ? (
                          runner.registeredCategories.map((category) => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No categories</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(runner.status)}`}>
                        {runner.status ? runner.status.charAt(0).toUpperCase() + runner.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {runner.lastKnownLocation ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="font-mono text-xs">
                            {runner.lastKnownLocation.coordinates[1].toFixed(4)}, {runner.lastKnownLocation.coordinates[0].toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not available</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {runner.createdAt ? (
                          new Date(runner.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        ) : (
                          'Unknown'
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewRunnerDetails(runner)}
                          className="flex items-center px-2 py-1 text-xs font-medium text-white rounded-lg transition-colors"
                          style={{ backgroundColor: '#0067a5' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = runner.status === 'active' ? 'completed' : 'active';
                            updateRunnerStatus(runner._id, newStatus);
                          }}
                          className="flex items-center px-2 py-1 text-xs font-medium text-white rounded-lg transition-colors"
                          style={{ backgroundColor: runner.status === 'active' ? '#6fb7e3' : '#6bb944' }}
                        >
                          {runner.status === 'active' ? 'Complete' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Showing <span className="font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium text-gray-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium text-gray-900">{pagination.total}</span> results
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  pagination.page === 1
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 text-sm font-medium rounded-xl transition-colors ${
                        pagination.page === pageNum
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                      style={pagination.page === pageNum ? { backgroundColor: '#0067a5' } : {}}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  pagination.page === pagination.totalPages
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Next
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Runner Details Popup */}
      {selectedRunner && (
        <RunnerMapPopup 
          runner={selectedRunner} 
          onClose={() => setSelectedRunner(null)} 
        />
      )}
    </div>
  );
}