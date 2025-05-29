// src/pages/AdminUsers.jsx - Updated with modern design
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  UserIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { showSuccess, showError, showConfirm, initModalManager } from '../utils/modalManager';

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    initModalManager();
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/admins');
      
      if (response.data?.success) {
        setAdmins(response.data.data || []);
        setError(null);
      } else {
        throw new Error(response.data?.error || 'Failed to fetch admin users');
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch admin users');
      showError('Unable to load admin users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (admin = null) => {
    if (admin) {
      setCurrentAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        password: '',
        role: admin.role
      });
    } else {
      setCurrentAdmin(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'editor'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentAdmin(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      
      const apiData = { ...formData };
      if (currentAdmin && !apiData.password) {
        delete apiData.password;
      }
      
      let response;
      if (currentAdmin) {
        response = await axios.put(`/auth/admins/${currentAdmin._id}`, apiData);
      } else {
        response = await axios.post('/auth/create-admin', apiData);
      }
      
      if (response.data?.success) {
        await fetchAdmins();
        showSuccess(currentAdmin ? 'Admin user updated successfully!' : 'New admin user created successfully!');
        closeModal();
      } else {
        throw new Error(response.data?.error || 'Failed to save admin user');
      }
    } catch (err) {
      console.error('Error saving admin:', err);
      showError(err.response?.data?.error || err.message || 'Failed to save admin user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    const adminToDelete = admins.find(a => a._id === adminId);
    const isLastAdmin = admins.filter(a => a.role === 'admin').length === 1 && adminToDelete?.role === 'admin';
    
    if (isLastAdmin) {
      showError('Cannot delete the last admin user. At least one admin must exist.');
      return;
    }
    
    showConfirm(
      'Are you sure you want to delete this admin user? This action cannot be undone.',
      async () => {
        try {
          setDeleteLoading(adminId);
          
          const response = await axios.delete(`/auth/admins/${adminId}`);
          
          if (response.data?.success) {
            setAdmins(admins.filter(admin => admin._id !== adminId));
            showSuccess('Admin user deleted successfully!');
          } else {
            throw new Error(response.data?.error || 'Failed to delete admin user');
          }
        } catch (err) {
          console.error('Error deleting admin:', err);
          showError(err.response?.data?.error || err.message || 'Failed to delete admin user');
        } finally {
          setDeleteLoading(null);
        }
      },
      'Confirm Delete',
      'Delete',
      'Cancel'
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ed1c25';
      case 'editor': return '#0067a5';
      default: return '#94a3b8';
    }
  };

  // Filter admins based on search and role
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || admin.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const stats = {
    total: admins.length,
    admins: admins.filter(a => a.role === 'admin').length,
    editors: admins.filter(a => a.role === 'editor').length,
    active: admins.length // All are considered active for now
  };

  // Admin Modal
  const AdminModal = () => (
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
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900" id="modal-title">
                {currentAdmin ? 'Edit Admin User' : 'Create New Admin User'}
              </h3>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {currentAdmin ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!currentAdmin}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder={currentAdmin ? 'Leave blank to keep current password' : 'Enter password'}
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="admin">Admin (Full Access)</option>
                    <option value="editor">Editor (Limited Access)</option>
                  </select>
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
                disabled={submitLoading}
                className="px-6 py-2 text-sm font-medium text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: '#0067a5' }}
                onMouseEnter={(e) => !submitLoading && (e.target.style.backgroundColor = '#005a94')}
                onMouseLeave={(e) => !submitLoading && (e.target.style.backgroundColor = '#0067a5')}
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentAdmin ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentAdmin ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

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
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Users</h1>
                <p className="text-sm text-gray-500">Manage administrator accounts and permissions</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#6bb944' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5fa83c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6bb944'}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Admin
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-sm font-medium text-gray-500">Full Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#ed1c25' }}
            >
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Editors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.editors}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              <PencilIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6bb944' }}
            >
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <Error message={error} onRetry={fetchAdmins} />}

      {/* Admin Users Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Admin Users</h2>
            <p className="text-sm text-gray-500">Manage system administrators and their permissions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No admin users found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterRole
                ? 'No admin users match your current filters.'
                : 'Get started by creating your first admin user.'}
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#6bb944' }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Admin
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdmins.map((admin) => (
              <div key={admin._id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: getRoleColor(admin.role) }}
                    >
                      {admin.name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{admin.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Role</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getRoleBadgeClass(admin.role)}`}>
                      {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className="px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900">{formatDate(admin.createdAt)}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    <span>Secure account</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(admin)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0067a5' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(admin._id)}
                    disabled={deleteLoading === admin._id || (admin.role === 'admin' && stats.admins === 1)}
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#ed1c25' }}
                    onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#dc1c1c')}
                    onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ed1c25')}
                  >
                    {deleteLoading === admin._id ? (
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <TrashIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>

                {/* Additional Info */}
                {admin.role === 'admin' && stats.admins === 1 && (
                  <div className="mt-3 text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg">
                    <p className="flex items-center">
                      <LockClosedIcon className="h-3 w-3 mr-1" />
                      Cannot delete last admin
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && <AdminModal />}
    </div>
  );
}