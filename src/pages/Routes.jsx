// src/pages/Routes.jsx - Modern design matching the dashboard aesthetic
import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import { 
  PlusIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  MapPinIcon,
  MapIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  DocumentArrowUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { showSuccess, showError, showConfirm, initModalManager } from '../utils/modalManager';

export default function RoutesManagement() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Half Marathon',
    distance: 0,
    isActive: false
  });
  const fileInputRef = useRef(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    initModalManager();
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/routes');
      
      if (response.data?.success) {
        setRoutes(response.data.data || []);
        setError(null);
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch routes');
      showError('Unable to load routes. Please try again later.');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (route = null) => {
    setCurrentRoute(route);
    setFormData({
      name: route?.name || '',
      description: route?.description || '',
      category: route?.category || 'Half Marathon',
      distance: route?.distance || 0,
      isActive: route?.isActive || false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRoute(null);
    setSelectedFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const routeData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        distance: parseFloat(formData.distance),
        isActive: formData.isActive
      };

      let response;
      if (currentRoute) {
        response = await axios.put(`/routes/${currentRoute._id}`, routeData);
      } else {
        response = await axios.post('/routes', routeData);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Invalid API response');
      }

      const updatedRoute = response.data.data;
      
      setRoutes(prev => 
        currentRoute
          ? prev.map(r => r._id === updatedRoute._id ? updatedRoute : r)
          : [...prev, updatedRoute]
      );

      showSuccess(currentRoute ? 'Route updated successfully!' : 'New route created successfully!');
      closeModal();
    } catch (err) {
      console.error('Error saving route:', err);
      showError(err.response?.data?.error || err.message || 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (routeId) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      showError('Please select a GPX file to upload', 'No File Selected');
      return;
    }
  
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      showError('Please select a GPX file', 'Wrong File Type');
      return;
    }
  
    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      
      const response = await axios({
        method: 'put',
        url: `/routes/${routeId}/upload`,
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.data?.success) {
        setRoutes(prev => prev.map(route => 
          route._id === routeId ? response.data.data : route
        ));
        
        showSuccess('GPX file uploaded successfully!');
        fileInputRef.current.value = '';
      } else {
        throw new Error(response.data?.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading GPX:', err);
      
      let errorMessage = 'Failed to upload GPX file';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showError(errorMessage, 'Upload Failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleActivate = async (routeId, isActive) => {
    try {
      const response = await axios.put(`/routes/${routeId}/activate`, { isActive });
      
      if (response.data?.success) {
        setRoutes(prev => prev.map(route => 
          route._id === routeId ? { ...route, isActive } : route
        ));
        
        showSuccess(`Route ${isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error(response.data?.error || 'Invalid activation response');
      }
    } catch (err) {
      console.error('Error activating route:', err);
      showError(err.response?.data?.error || err.message || 'Failed to update route status');
    }
  };

  const handleDelete = async (routeId) => {
    showConfirm(
      'Are you sure you want to delete this route? This action cannot be undone.',
      async () => {
        try {
          const response = await axios.delete(`/routes/${routeId}`);
          
          if (response.data?.success) {
            setRoutes(prev => prev.filter(route => route._id !== routeId));
            showSuccess('Route deleted successfully!');
          } else {
            throw new Error(response.data?.error || 'Invalid delete response');
          }
        } catch (err) {
          console.error('Error deleting route:', err);
          showError(err.response?.data?.error || err.message || 'Failed to delete route');
        }
      },
      'Confirm Delete',
      'Delete',
      'Cancel'
    );
  };

  // Filter routes based on search and category
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || route.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const RouteModal = () => (
    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto">
          <button 
            type="button" 
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 z-10"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#0067a5' }}
              >
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900" id="modal-title">
                {currentRoute ? 'Edit Route' : 'Create New Route'}
              </h3>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter route name"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Describe the route"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Half Marathon">Half Marathon</option>
                    <option value="Full Marathon">Full Marathon</option>
                    <option value="Fun Run">Fun Run</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    name="distance"
                    id="distance"
                    min="0"
                    step="0.01"
                    value={formData.distance}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                    style={{ accentColor: '#0067a5' }}
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-700">
                    Active Route
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                style={{ backgroundColor: '#0067a5' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
              >
                {loading ? 'Saving...' : currentRoute ? 'Update Route' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading && routes.length === 0) return <Loading />;
  if (error) return <Error message={error} onRetry={fetchRoutes} />;

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
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Routes Management</h1>
                <p className="text-sm text-gray-500">Manage marathon routes and courses</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Full Marathon">Full Marathon</option>
              <option value="Fun Run">Fun Run</option>
            </select>
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#6bb944' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5fa83c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6bb944'}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Route
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <MapIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.filter(r => r.isActive).length}</p>
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
              <p className="text-sm font-medium text-gray-500">With GPX Files</p>
              <p className="text-2xl font-bold text-gray-900">{routes.filter(r => r.gpxFile).length}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              <DocumentArrowUpIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900">{routes.reduce((sum, r) => sum + (r.distance || 0), 0).toFixed(1)} km</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#ed1c25' }}
            >
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map(route => (
          <div key={route._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: route.isActive ? '#6bb944' : '#94a3b8' }}
                  >
                    <MapIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      route.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{route.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">{route.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Distance</span>
                  <span className="font-medium text-gray-900">{route.distance} km</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Checkpoints</span>
                  <span className="font-medium text-gray-900">{route.checkpoints?.length || 0}</span>
                </div>
                {route.gpxFile && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">GPX File</span>
                    <span className="font-medium text-green-600">✓ Uploaded</span>
                  </div>
                )}
              </div>

              {route.checkpoints?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Checkpoints</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {route.checkpoints.slice(0, 3).map((cp, i) => (
                      <div key={i} className="flex items-center text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-700">{cp.name}</span>
                        <span className="ml-auto text-gray-500">{cp.distanceFromStart} km</span>
                      </div>
                    ))}
                    {route.checkpoints.length > 3 && (
                      <p className="text-xs text-gray-500">+{route.checkpoints.length - 3} more checkpoints</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-2xl">
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => openModal(route)}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: '#0067a5' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
                >
                  <PencilIcon className="h-3 w-3 mr-1" /> Edit
                </button>
                <button
                  onClick={() => handleActivate(route._id, !route.isActive)}
                  className={`flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors ${
                    route.isActive ? 'hover:bg-red-600' : 'hover:bg-green-600'
                  }`}
                  style={{ backgroundColor: route.isActive ? '#ed1c25' : '#6bb944' }}
                >
                  {route.isActive ? (
                    <><XCircleIcon className="h-3 w-3 mr-1" /> Deactivate</>
                  ) : (
                    <><CheckCircleIcon className="h-3 w-3 mr-1" /> Activate</>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(route._id)}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: '#ed1c25' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc1c1c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ed1c25'}
                >
                  <TrashIcon className="h-3 w-3 mr-1" /> Delete
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".gpx"
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <button
                  onClick={() => handleFileUpload(route._id)}
                  disabled={uploadLoading}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#6fb7e3' }}
                  onMouseEnter={(e) => !uploadLoading && (e.target.style.backgroundColor = '#5ba7d9')}
                  onMouseLeave={(e) => !uploadLoading && (e.target.style.backgroundColor = '#6fb7e3')}
                >
                  {uploadLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    <><ArrowUpTrayIcon className="h-3 w-3 mr-1" /> Upload</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <MapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCategory ? 'No routes match your current filters.' : 'Get started by creating your first route.'}
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
            style={{ backgroundColor: '#6bb944' }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Route
          </button>
        </div>
      )}

      {isModalOpen && <RouteModal />}
    </div>
  );
}