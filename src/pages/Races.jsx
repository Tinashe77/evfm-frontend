// src/pages/Races.jsx - Modern design matching the dashboard aesthetic
import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import { 
  ClockIcon,
  MapPinIcon,
  UserIcon,
  FlagIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { 
  connectToAdminDashboard, 
  listenToRunnerLocation, 
  listenToRaceCompleted,
  removeListeners,
  disconnectSocket
} from '../utils/socket';
import { showInfo, showError, showSuccess, showConfirm } from '../utils/modalManager';

// Map component for race visualization
const RaceMap = ({ trackingData, checkpoints, routeData }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window.L === 'undefined') {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
        document.head.appendChild(linkElement);
        
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
        scriptElement.async = true;
        
        scriptElement.onload = () => {
          setMapLoaded(true);
        };
        
        document.body.appendChild(scriptElement);
        
        return () => {
          if (document.head.contains(linkElement)) {
            document.head.removeChild(linkElement);
          }
          if (document.body.contains(scriptElement)) {
            document.body.removeChild(scriptElement);
          }
        };
      } else {
        setMapLoaded(true);
      }
    };
    
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    const initMap = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      
      let centerCoords = [-17.9257, 25.8526]; // Victoria Falls
      let boundsPoints = [];
      
      const L = window.L;
      
      // Wait a bit for the container to be properly sized
      setTimeout(() => {
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        if (trackingData && trackingData.length > 0) {
          const pathPoints = trackingData.map(point => [
            point.location.coordinates[1], 
            point.location.coordinates[0]
          ]);
          
          boundsPoints = [...boundsPoints, ...pathPoints];
          
          const pathLine = L.polyline(pathPoints, {
            color: '#0067a5',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          
          const startPoint = pathPoints[0];
          const endPoint = pathPoints[pathPoints.length - 1];
          
          L.marker(startPoint, {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #6bb944; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(map)
          .bindPopup('Start point');
          
          L.marker(endPoint, {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #ed1c25; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(map)
          .bindPopup('Current position');
          
          centerCoords = endPoint;
        }
        
        if (checkpoints && checkpoints.length > 0) {
          checkpoints.forEach((checkpoint, index) => {
            if (checkpoint.location && checkpoint.location.coordinates) {
              const cpCoords = [
                checkpoint.location.coordinates[1],
                checkpoint.location.coordinates[0]
              ];
              
              boundsPoints.push(cpCoords);
              
              L.marker(cpCoords, {
                icon: L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: #6fb7e3; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
                })
              }).addTo(map)
              .bindPopup(`Checkpoint ${index + 1}: ${checkpoint.name}`);
            }
          });
        }
        
        if (routeData && routeData.length > 0) {
          const routePoints = routeData.map(point => [point.lat, point.lng]);
          boundsPoints = [...boundsPoints, ...routePoints];
          
          L.polyline(routePoints, {
            color: '#9CA3AF',
            weight: 3,
            opacity: 0.6,
            dashArray: '5, 5'
          }).addTo(map);
        }
        
        if (boundsPoints.length > 1) {
          map.fitBounds(boundsPoints, {
            padding: [50, 50]
          });
        } else {
          map.setView(centerCoords, 14);
        }
        
        // Force map to invalidate size after initialization
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
        mapInstanceRef.current = map;
      }, 100);
    };
    
    initMap();
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded, trackingData, checkpoints, routeData]);

  // Add a resize effect to handle container size changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    
    // Set up resize observer to watch for container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }
    
    // Also listen for window resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [mapLoaded]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ 
        minHeight: '384px',
        width: '100%',
        height: '100%'
      }}
    />
  );
};

export default function Races() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'detail'
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  useEffect(() => {
    connectToAdminDashboard();
    
    listenToRunnerLocation(handleRunnerLocationUpdate);
    listenToRaceCompleted(handleRaceCompleted);
    
    fetchRaces();
    
    return () => {
      removeListeners();
      disconnectSocket();
    };
  }, [filters]);

  const handleRunnerLocationUpdate = (data) => {
    if (!data || !data.raceId) return;
    
    console.log('Received location update for race:', data.raceId);
    
    setRaces(prevRaces => {
      return prevRaces.map(race => {
        if (race._id === data.raceId) {
          const newTrackingPoint = {
            timestamp: data.timestamp || new Date().toISOString(),
            location: data.location,
            elevation: data.elevation || 0,
            speed: data.speed || 0
          };
          
          return {
            ...race,
            trackingData: [
              ...(race.trackingData || []),
              newTrackingPoint
            ],
            lastUpdate: new Date().toISOString()
          };
        }
        return race;
      });
    });
    
    if (selectedRace && selectedRace._id === data.raceId) {
      setSelectedRace(prevRace => {
        const newTrackingPoint = {
          timestamp: data.timestamp || new Date().toISOString(),
          location: data.location,
          elevation: data.elevation || 0,
          speed: data.speed || 0
        };
        
        return {
          ...prevRace,
          trackingData: [
            ...(prevRace.trackingData || []),
            newTrackingPoint
          ],
          lastUpdate: new Date().toISOString()
        };
      });
    }
  };

  const handleRaceCompleted = (data) => {
    if (!data || !data.raceId) return;
    
    console.log('Received race completion for race:', data.raceId);
    
    setRaces(prevRaces => {
      return prevRaces.map(race => {
        if (race._id === data.raceId) {
          return {
            ...race,
            status: 'completed',
            finishTime: data.finishTime || new Date().toISOString(),
            completionTime: data.completionTime,
            averagePace: data.averagePace
          };
        }
        return race;
      });
    });
    
    if (selectedRace && selectedRace._id === data.raceId) {
      setSelectedRace(prevRace => {
        return {
          ...prevRace,
          status: 'completed',
          finishTime: data.finishTime || new Date().toISOString(),
          completionTime: data.completionTime,
          averagePace: data.averagePace
        };
      });

      showSuccess(`Race completed by ${selectedRace.runner?.name} in ${formatTime(data.completionTime)}!`);
    }
  };

  const fetchRaces = async () => {
    try {
      setLoading(true);
      
      let query = '';
      if (filters.status || filters.category || filters.search) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        query = `?${params.toString()}`;
      }
      
      console.log('Fetching races with query:', query);
      
      const response = await axios.get(`/races${query}`);
      
      if (response.data && response.data.success) {
        console.log(`Fetched ${response.data.data?.length || 0} races`);
        setRaces(response.data.data || []);
        setError(null);
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching races:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch races');
      
      showError('Unable to fetch races data. Please try again later.');
      setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    fetchRaces();
  };

  const openRaceDetail = async (race) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/races/${race._id}`);
      
      if (response.data && response.data.success) {
        const raceData = response.data.data;
        setSelectedRace(raceData);
        
        if (raceData.route && raceData.route._id && raceData.route.gpxFile) {
          fetchRouteData(raceData.route._id);
        } else {
          setRouteData(null);
        }
        
        setView('detail');
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching race details:', err);
      showError('Failed to load race details. Please try again.');
      
      setSelectedRace(race);
      setRouteData(null);
      setView('detail');
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteData = async (routeId) => {
    try {
      setFetchingRoute(true);
      
      const response = await axios.get(`/routes/${routeId}/gpx`);
      
      if (response.data && response.data.success) {
        setRouteData(response.data.data || []);
      } else {
        console.warn('No GPX data available for route');
        setRouteData(null);
      }
    } catch (err) {
      console.error('Error fetching route GPX data:', err);
      setRouteData(null);
    } finally {
      setFetchingRoute(false);
    }
  };

  const goBackToList = () => {
    setView('list');
    setSelectedRace(null);
    setRouteData(null);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace && pace !== 0) return 'N/A';
    
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return '#0067a5';
      case 'completed': return '#6bb944';
      case 'started': return '#6fb7e3';
      default: return '#ed1c25';
    }
  };

  const generateCertificate = async (raceId) => {
    try {
      setCertificateLoading(true);
      
      const response = await axios.get(`/races/${raceId}/certificate`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `race-certificate-${raceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSuccess('Certificate generated and downloaded successfully.');
      
    } catch (err) {
      console.error('Error generating certificate:', err);
      showError('Failed to generate certificate. Please try again later.');
    } finally {
      setCertificateLoading(false);
    }
  };

  const refreshRaceData = async (raceId) => {
    try {
      setRefreshLoading(true);
      
      const response = await axios.get(`/races/${raceId}`);
      
      if (response.data && response.data.success) {
        const freshData = response.data.data;
        
        if (view === 'detail' && selectedRace?._id === raceId) {
          setSelectedRace(freshData);
          
          if (freshData.route && freshData.route._id && freshData.route.gpxFile) {
            fetchRouteData(freshData.route._id);
          }
        }
        
        setRaces(prevRaces => {
          return prevRaces.map(race => 
            race._id === raceId ? freshData : race
          );
        });
        
        showSuccess('Race data refreshed successfully.');
      } else {
        throw new Error(response.data?.error || 'Invalid API response format');
      }
      
    } catch (err) {
      console.error('Error refreshing race data:', err);
      showError('Failed to refresh race data. Please try again.');
    } finally {
      setRefreshLoading(false);
    }
  };

  // Calculate stats
  const statusCounts = {
    total: races.length,
    inProgress: races.filter(r => r.status === 'in-progress').length,
    completed: races.filter(r => r.status === 'completed').length,
    started: races.filter(r => r.status === 'started').length
  };

  // Race List View
  const RaceListView = () => (
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
                <FlagIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Race Management</h1>
                <p className="text-sm text-gray-500">Monitor ongoing and completed races</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search races..."
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
              <option value="">All Statuses</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="started">Started</option>
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
            <button
              onClick={applyFilters}
              className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              style={{ backgroundColor: '#6bb944' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5fa83c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6bb944'}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Races</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <FlagIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.inProgress}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <PlayIcon className="h-6 w-6 text-white" />
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
              style={{ backgroundColor: '#6bb944' }}
            >
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Started</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.started}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Error message if any */}
      {error && <Error message={error} onRetry={fetchRaces} />}

      {/* Races Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Races</h2>
            <p className="text-sm text-gray-500">Real-time race monitoring and management</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : races.length === 0 ? (
          <div className="text-center py-12">
            <FlagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No races found</h3>
            <p className="text-gray-500">
              {filters.search || filters.status || filters.category
                ? 'No races match your current filters.'
                : 'No races have been started yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map((race) => (
              <div key={race._id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => openRaceDetail(race)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: getStatusColor(race.status) }}
                    >
                      {race.runner?.name?.charAt(0) || 'R'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{race.runner?.name || 'Unknown Runner'}</h3>
                      <p className="text-xs text-gray-500">#{race.runner?.runnerNumber || 'No Number'}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <EllipsisHorizontalIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${getStatusBadgeClass(race.status)}`}>
                      {race.status === 'in-progress' ? 'In Progress' : 
                       race.status === 'completed' ? 'Completed' : 
                       race.status ? race.status.charAt(0).toUpperCase() + race.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Route</span>
                    <span className="text-gray-900 truncate ml-2">{race.route?.name || 'Unknown Route'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Category</span>
                    <span className="text-gray-900">{race.category || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Started</span>
                    <span className="text-gray-900">{formatDateTime(race.startTime)}</span>
                  </div>
                  {race.status === 'completed' && race.completionTime && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Time</span>
                      <span className="text-gray-900 font-semibold">{formatTime(race.completionTime)}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openRaceDetail(race);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0067a5' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    View Details
                  </button>
                  {race.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateCertificate(race._id);
                      }}
                      disabled={certificateLoading}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#6bb944' }}
                    >
                      <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                      Certificate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Race Detail View
  const RaceDetailView = () => {
    if (!selectedRace) return null;

    const lastPosition = selectedRace.trackingData && 
                         selectedRace.trackingData.length > 0 ? 
                         selectedRace.trackingData[selectedRace.trackingData.length - 1] : null;

    return (
      <div className="space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goBackToList}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to races
              </button>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: getStatusColor(selectedRace.status) }}
                >
                  <FlagIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedRace.route?.name || 'Race Details'}</h1>
                  <p className="text-sm text-gray-500">
                    {selectedRace.category || 'Unknown Category'} • {selectedRace.runner?.name || 'Unknown Runner'} (#{selectedRace.runner?.runnerNumber || 'No Number'})
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refreshRaceData(selectedRace._id)}
                disabled={refreshLoading}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {refreshLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Data
                  </>
                )}
              </button>
              {selectedRace.status === 'completed' && (
                <button
                  onClick={() => generateCertificate(selectedRace._id)}
                  disabled={certificateLoading}
                  className="flex items-center px-4 py-2 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#6bb944' }}
                  onMouseEnter={(e) => !certificateLoading && (e.target.style.backgroundColor = '#5fa83c')}
                  onMouseLeave={(e) => !certificateLoading && (e.target.style.backgroundColor = '#6bb944')}
                >
                  {certificateLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Get Certificate
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Race Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedRace.status)}`}>
                  {selectedRace.status === 'in-progress' ? 'In Progress' : 
                   selectedRace.status === 'completed' ? 'Completed' : 
                   selectedRace.status ? selectedRace.status.charAt(0).toUpperCase() + selectedRace.status.slice(1) : 'Unknown'}
                </span>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: getStatusColor(selectedRace.status) }}
              >
                <FlagIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Start Time</p>
                <p className="text-lg font-bold text-gray-900">{formatDateTime(selectedRace.startTime)}</p>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#6fb7e3' }}
              >
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {selectedRace.status === 'completed' && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Finish Time</p>
                    <p className="text-lg font-bold text-gray-900">{formatDateTime(selectedRace.finishTime)}</p>
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
                    <p className="text-sm font-medium text-gray-500">Completion Time</p>
                    <p className="text-lg font-bold text-gray-900">{formatTime(selectedRace.completionTime)}</p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: '#0067a5' }}
                  >
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedRace.averagePace && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Pace</p>
                  <p className="text-lg font-bold text-gray-900">{formatPace(selectedRace.averagePace)}</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#ed1c25' }}
                >
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )}

          {lastPosition && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Position</p>
                    <p className="text-sm font-bold text-gray-900">
                      {lastPosition.location.coordinates[1].toFixed(4)}, {lastPosition.location.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: '#6fb7e3' }}
                  >
                    <MapPinIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-sm font-bold text-gray-900">{formatDateTime(lastPosition.timestamp)}</p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: '#0067a5' }}
                  >
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Map Visualization */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Live Race Tracking</h2>
              {fetchingRoute && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading route data...
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-96 relative">
            {selectedRace.trackingData && selectedRace.trackingData.length > 0 ? (
              <div className="absolute inset-0 w-full h-full">
                <RaceMap 
                  trackingData={selectedRace.trackingData} 
                  checkpoints={selectedRace.checkpointTimes?.map(c => c.checkpoint) || []} 
                  routeData={routeData}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium">No tracking data available for this race</p>
                  <p className="text-xs">Tracking data will appear here once the runner starts moving</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checkpoints and Tracking Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checkpoints */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Checkpoints</h2>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {selectedRace.checkpointTimes && selectedRace.checkpointTimes.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {selectedRace.checkpointTimes.map((checkpoint, idx) => (
                    <div key={idx} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: '#6fb7e3' }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{checkpoint.checkpoint.name}</p>
                            <p className="text-xs text-gray-500">{checkpoint.checkpoint.distanceFromStart} km from start</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatDateTime(checkpoint.time)}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Split time
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <MapPinIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No checkpoint data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tracking Data */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tracking Data</h2>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {selectedRace.trackingData && selectedRace.trackingData.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {selectedRace.trackingData.slice(-10).reverse().map((point, idx) => (
                    <div key={idx} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: idx === 0 ? '#ed1c25' : '#6fb7e3' }}
                          >
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">
                              {point.location.coordinates[1].toFixed(4)}, {point.location.coordinates[0].toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDateTime(point.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-900">{point.elevation || 0} m</p>
                          <p className="text-xs text-gray-500">{(point.speed || 0).toFixed(1)} km/h</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <MapPinIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No tracking data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return view === 'list' ? <RaceListView /> : <RaceDetailView />;
}