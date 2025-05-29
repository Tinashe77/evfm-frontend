// src/pages/Communications.jsx - Updated to match design consistency
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  CalendarIcon,
  StarIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { showSuccess, showError, showConfirm, initModalManager } from '../utils/modalManager';

export default function Communications() {
  const [view, setView] = useState('templates'); // 'templates' or 'announcements'
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'pre-race',
  });
  const [sendEmailForm, setSendEmailForm] = useState({
    templateId: '',
    subject: '',
    categories: []
  });
  const [sendAnnouncementForm, setSendAnnouncementForm] = useState({
    title: '',
    message: '',
    categories: [],
    scheduleDate: ''
  });
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    initModalManager();
  }, []);

  useEffect(() => {
    if (view === 'templates') {
      fetchTemplates();
    }
  }, [view]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/communications/templates');
      
      if (response.data?.success) {
        const fetchedTemplates = response.data.data || [];
        setTemplates(fetchedTemplates);
        
        if (fetchedTemplates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(fetchedTemplates[0]);
        }
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch email templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch email templates');
      showError('Unable to load email templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setCurrentTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category
      });
    } else {
      setCurrentTemplate(null);
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: 'pre-race'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTemplate(null);
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
      setLoading(true);
      
      let response;
      if (currentTemplate) {
        response = await axios.put(`/communications/templates/${currentTemplate._id}`, formData);
      } else {
        response = await axios.post('/communications/templates', formData);
      }
      
      if (response.data?.success) {
        await fetchTemplates();
        
        if (response.data.data) {
          setSelectedTemplate(response.data.data);
        }
        
        showSuccess(currentTemplate ? 'Template updated successfully!' : 'Template created successfully!');
        closeModal();
      } else {
        throw new Error(response.data?.message || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      showError(err.response?.data?.message || err.message || 'Failed to save email template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    showConfirm(
      'Are you sure you want to delete this template? This action cannot be undone.',
      async () => {
        try {
          const response = await axios.delete(`/communications/templates/${templateId}`);
          
          if (response.data?.success) {
            const updatedTemplates = templates.filter(template => template._id !== templateId);
            setTemplates(updatedTemplates);
            
            if (selectedTemplate && selectedTemplate._id === templateId) {
              setSelectedTemplate(updatedTemplates.length > 0 ? updatedTemplates[0] : null);
            }
            
            showSuccess('Template deleted successfully!');
          } else {
            throw new Error(response.data?.message || 'Failed to delete template');
          }
        } catch (err) {
          console.error('Error deleting template:', err);
          showError(err.response?.data?.message || err.message || 'Failed to delete template');
        }
      },
      'Confirm Delete',
      'Delete',
      'Cancel'
    );
  };

  const openSendModal = () => {
    if (templates.length === 0) {
      showError('No templates available. Please create a template first.');
      return;
    }
    
    setSendEmailForm({
      templateId: templates[0]._id,
      subject: templates[0].subject,
      categories: []
    });
    
    setIsSendModalOpen(true);
  };

  const closeSendModal = () => {
    setIsSendModalOpen(false);
  };

  const handleSendEmailFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'templateId') {
      const selectedTemplate = templates.find(template => template._id === value);
      setSendEmailForm({
        ...sendEmailForm,
        templateId: value,
        subject: selectedTemplate ? selectedTemplate.subject : ''
      });
    } else if (type === 'checkbox') {
      const categories = [...sendEmailForm.categories];
      if (checked) {
        categories.push(value);
      } else {
        const index = categories.indexOf(value);
        if (index !== -1) {
          categories.splice(index, 1);
        }
      }
      setSendEmailForm({
        ...sendEmailForm,
        categories
      });
    } else {
      setSendEmailForm({
        ...sendEmailForm,
        [name]: value
      });
    }
  };

  const handleSendAnnouncementFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const categories = [...sendAnnouncementForm.categories];
      if (checked) {
        categories.push(value);
      } else {
        const index = categories.indexOf(value);
        if (index !== -1) {
          categories.splice(index, 1);
        }
      }
      setSendAnnouncementForm({
        ...sendAnnouncementForm,
        categories
      });
    } else {
      setSendAnnouncementForm({
        ...sendAnnouncementForm,
        [name]: value
      });
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    
    if (sendEmailForm.categories.length === 0) {
      showError('Please select at least one category');
      return;
    }
    
    try {
      setIsSendingEmail(true);
      
      const response = await axios.post('/communications/email', sendEmailForm);
      
      if (response.data?.success) {
        showSuccess('Email notification queued successfully!');
        closeSendModal();
      } else {
        throw new Error(response.data?.message || 'Failed to send email notification');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      showError(err.response?.data?.message || err.message || 'Failed to send email notification');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    
    if (sendAnnouncementForm.categories.length === 0) {
      showError('Please select at least one category');
      return;
    }
    
    try {
      setIsSendingAnnouncement(true);
      
      const response = await axios.post('/communications/announce', sendAnnouncementForm);
      
      if (response.data?.success) {
        showSuccess('Announcement sent successfully!');
        setSendAnnouncementForm({
          title: '',
          message: '',
          categories: [],
          scheduleDate: ''
        });
      } else {
        throw new Error(response.data?.message || 'Failed to send announcement');
      }
    } catch (err) {
      console.error('Error sending announcement:', err);
      showError(err.response?.data?.message || err.message || 'Failed to send announcement');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'pre-race':
        return 'bg-blue-100 text-blue-800';
      case 'race-day':
        return 'bg-green-100 text-green-800';
      case 'post-race':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const stats = {
    total: templates.length,
    preRace: templates.filter(t => t.category === 'pre-race').length,
    raceDay: templates.filter(t => t.category === 'race-day').length,
    postRace: templates.filter(t => t.category === 'post-race').length
  };

  // Template Modal
  const TemplateModal = () => (
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
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900" id="modal-title">
                {currentTemplate ? 'Edit Email Template' : 'Create New Email Template'}
              </h3>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter email subject"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="pre-race">Pre-Race</option>
                    <option value="race-day">Race Day</option>
                    <option value="post-race">Post-Race</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content (HTML)
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Available variables: {'{{'} runner.name {'}}'},  {'{{'} runner.number {'}}'},  {'{{'} race.name {'}}'},  {'{{'} race.date {'}}'}
                  </div>
                  <textarea
                    name="content"
                    id="content"
                    rows="10"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                    placeholder="Enter email content..."
                  />
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
                {currentTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Send Email Modal
  const SendEmailModal = () => (
    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeSendModal}></div>
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto">
          <button 
            type="button" 
            onClick={closeSendModal}
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
                style={{ backgroundColor: '#6bb944' }}
              >
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900" id="modal-title">
                Send Email Notification
              </h3>
            </div>
          </div>
          
          <form onSubmit={sendEmail}>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <select
                    name="templateId"
                    id="templateId"
                    value={sendEmailForm.templateId}
                    onChange={handleSendEmailFormChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={sendEmailForm.subject}
                    onChange={handleSendEmailFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send to Categories
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="category-half"
                        name="categories"
                        type="checkbox"
                        value="Half Marathon"
                        checked={sendEmailForm.categories.includes('Half Marathon')}
                        onChange={handleSendEmailFormChange}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        style={{ accentColor: '#0067a5' }}
                      />
                      <label htmlFor="category-half" className="ml-3 block text-sm text-gray-700">
                        Half Marathon
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="category-full"
                        name="categories"
                        type="checkbox"
                        value="Full Marathon"
                        checked={sendEmailForm.categories.includes('Full Marathon')}
                        onChange={handleSendEmailFormChange}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        style={{ accentColor: '#0067a5' }}
                      />
                      <label htmlFor="category-full" className="ml-3 block text-sm text-gray-700">
                        Full Marathon
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="category-fun"
                        name="categories"
                        type="checkbox"
                        value="Fun Run"
                        checked={sendEmailForm.categories.includes('Fun Run')}
                        onChange={handleSendEmailFormChange}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        style={{ accentColor: '#0067a5' }}
                      />
                      <label htmlFor="category-fun" className="ml-3 block text-sm text-gray-700">
                        Fun Run
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-2xl">
              <button
                type="button"
                onClick={closeSendModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingEmail}
                className="px-6 py-2 text-sm font-medium text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: '#6bb944' }}
                onMouseEnter={(e) => !isSendingEmail && (e.target.style.backgroundColor = '#5fa83c')}
                onMouseLeave={(e) => !isSendingEmail && (e.target.style.backgroundColor = '#6bb944')}
              >
                {isSendingEmail ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const TemplatesView = () => (
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
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Email Templates</h1>
                <p className="text-sm text-gray-500">Manage email templates for runner communications</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
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
              <option value="pre-race">Pre-Race</option>
              <option value="race-day">Race Day</option>
              <option value="post-race">Post-Race</option>
            </select>
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#6bb944' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5fa83c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6bb944'}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Template
            </button>
            <button
              onClick={openSendModal}
              className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#0067a5' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
              disabled={templates.length === 0}
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Send Email
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pre-Race</p>
              <p className="text-2xl font-bold text-gray-900">{stats.preRace}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6bb944' }}
            >
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Race Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.raceDay}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Post-Race</p>
              <p className="text-2xl font-bold text-gray-900">{stats.postRace}</p>
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

      {/* Error Display */}
      {error && <Error message={error} onRetry={fetchTemplates} />}

      {/* Templates Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Templates</h2>
            <p className="text-sm text-gray-500">Create and manage email templates for different race phases</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterCategory 
                ? 'No templates match your current filters.' 
                : 'Get started by creating your first email template.'}
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#6bb944' }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div 
                key={template._id} 
                className={`bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                  selectedTemplate && selectedTemplate._id === template._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#0067a5' }}
                    >
                      <EnvelopeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{template.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                    </div>
                  </div>
                  <button 
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Category</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getCategoryColor(template.category)}`}>
                      {template.category === 'pre-race' ? 'Pre-Race' : 
                       template.category === 'race-day' ? 'Race Day' : 'Post-Race'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900">{formatDate(template.createdAt)}</span>
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {template.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0067a5' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(template);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#6fb7e3' }}
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template._id);
                    }}
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#ed1c25' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc1c1c'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ed1c25'}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Preview Panel */}
      {selectedTemplate && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Template Preview</h2>
                <p className="text-sm text-gray-500">{selectedTemplate.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openModal(selectedTemplate)}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: '#0067a5' }}
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  Edit Template
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500">Subject:</p>
              <p className="text-lg font-medium text-gray-900">{selectedTemplate.subject}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Email Content:</p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                />
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <LinkIcon className="h-4 w-4 mr-2" />
              Category: <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedTemplate.category)}`}>
                {selectedTemplate.category === 'pre-race' ? 'Pre-Race' : 
                 selectedTemplate.category === 'race-day' ? 'Race Day' : 'Post-Race'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const AnnouncementsView = () => (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#6bb944' }}
              >
                <MegaphoneIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Send Announcements</h1>
                <p className="text-sm text-gray-500">Create and send in-app announcements to runners</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MegaphoneIcon className="h-5 w-5 mr-2 text-gray-600" />
            New Announcement
          </h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={sendAnnouncement}>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={sendAnnouncementForm.title}
                  onChange={handleSendAnnouncementFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Race Day Weather Update"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows="6"
                  value={sendAnnouncementForm.message}
                  onChange={handleSendAnnouncementFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Due to expected rain, please bring appropriate gear for the marathon tomorrow."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send to Categories
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="announcement-half"
                        name="categories"
                        type="checkbox"
                        value="Half Marathon"
                        checked={sendAnnouncementForm.categories.includes('Half Marathon')}
                        onChange={handleSendAnnouncementFormChange}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        style={{ accentColor: '#0067a5' }}
                      />
                      <label htmlFor="announcement-half" className="ml-3 block text-sm text-gray-700">
                        Half Marathon
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="announcement-full"
                        name="categories"
                        type="checkbox"
                        value="Full Marathon"
                        checked={sendAnnouncementForm.categories.includes('Full Marathon')}
                        onChange={handleSendAnnouncementFormChange}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        style={{ accentColor: '#0067a5' }}
                      />
                      <label htmlFor="announcement-full" className="ml-3 block text-sm text-gray-700">
                        Full Marathon
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="announcement-fun"
                        name="categories"
                        type="checkbox"
                        value="Fun Run"
                        checked={sendAnnouncementForm.categories.includes('Fun Run')}
                        onChange={handleSendAnnouncementFormChange}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        style={{ accentColor: '#0067a5' }}
                      />
                      <label htmlFor="announcement-fun" className="ml-3 block text-sm text-gray-700">
                        Fun Run
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Date/Time (Optional)
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="scheduleDate"
                      id="scheduleDate"
                      value={sendAnnouncementForm.scheduleDate}
                      onChange={handleSendAnnouncementFormChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to send immediately
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSendingAnnouncement}
                  className="flex items-center px-6 py-3 text-sm font-medium text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#6bb944' }}
                  onMouseEnter={(e) => !isSendingAnnouncement && (e.target.style.backgroundColor = '#5fa83c')}
                  onMouseLeave={(e) => !isSendingAnnouncement && (e.target.style.backgroundColor = '#6bb944')}
                >
                  {isSendingAnnouncement ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MegaphoneIcon className="h-5 w-5 mr-2" />
                      Send Announcement
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <button
            onClick={() => setView('templates')}
            className={`${
              view === 'templates'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 font-medium text-sm flex items-center transition-colors`}
          >
            <EnvelopeIcon className={`${
              view === 'templates' ? 'text-blue-500' : 'text-gray-400'
            } h-5 w-5 mr-2`} />
            Email Templates
          </button>
          <button
            onClick={() => setView('announcements')}
            className={`${
              view === 'announcements'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 font-medium text-sm flex items-center transition-colors`}
          >
            <MegaphoneIcon className={`${
              view === 'announcements' ? 'text-blue-500' : 'text-gray-400'
            } h-5 w-5 mr-2`} />
            Announcements
          </button>
        </nav>
      </div>

      {/* View Content */}
      {view === 'templates' ? <TemplatesView /> : <AnnouncementsView />}
      
      {/* Modals */}
      {isModalOpen && <TemplateModal />}
      {isSendModalOpen && <SendEmailModal />}
    </div>
  );
}