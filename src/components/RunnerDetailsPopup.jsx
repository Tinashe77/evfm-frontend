// src/components/RunnerDetailsPopup.jsx - Modernized with map loading fix
import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  MapPinIcon, 
  ArrowUpRightIcon, 
  ClockIcon, 
  UserIcon, 
  DocumentTextIcon, 
  EnvelopeIcon,
  CalendarIcon,
  FlagIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const RunnerDetailsPopup = ({ runner, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  
  // Load Leaflet scripts and styles
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (typeof window.L !== 'undefined') {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
    linkElement.integrity = 'sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI=';
    linkElement.crossOrigin = '';
    document.head.appendChild(linkElement);
    
    // Load Leaflet script
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
    scriptElement.integrity = 'sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=';
    scriptElement.crossOrigin = '';
    scriptElement.async = true;
    
    scriptElement.onload = () => {
      // Fix Leaflet's default icon path issue
      const L = window.L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
      });
      setLeafletLoaded(true);
    };
    
    scriptElement.onerror = () => {
      setMapError(true);
    };
    
    document.body.appendChild(scriptElement);
    
    return () => {
      // Don't remove Leaflet as it might be used by other components
    };
  }, []);
  
  // Initialize map after Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !runner?.lastKnownLocation) {
      return;
    }

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (e) {
        console.error('Error removing map:', e);
      }
    }

    // Initialize map after Leaflet is loaded
    const initializeMap = () => {
      try {
        const L = window.L;
        
        const coords = [
          runner.lastKnownLocation.coordinates[1], 
          runner.lastKnownLocation.coordinates[0]
        ];
        
        console.log('Initializing map with coordinates:', coords);
        
        // Create the map
        const map = L.map(mapRef.current, {
          center: coords,
          zoom: 15,
          zoomControl: true,
          attributionControl: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Add a simple default marker
        const marker = L.marker(coords).addTo(map);
        
        // Add popup to marker
        marker.bindPopup(`
          <div style="padding: 8px; min-width: 150px;">
            <strong>${runner.name}</strong><br>
            Runner #${runner.runnerNumber}<br>
            <small>Last updated: ${new Date(runner.lastUpdate || Date.now()).toLocaleTimeString()}</small>
          </div>
        `).openPopup();
        
        // Add a circle to highlight the location
        L.circle(coords, {
          color: '#0067a5',
          fillColor: '#0067a5',
          fillOpacity: 0.2,
          radius: 100
        }).addTo(map);
        
        // Force map to recalculate size
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
        mapInstanceRef.current = map;
        setMapError(false);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError(true);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeMap);
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
    };
  }, [leafletLoaded, runner]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Format coordinates
  const formattedCoordinates = runner?.lastKnownLocation ? 
    `${runner.lastKnownLocation.coordinates[1].toFixed(6)}° N, ${runner.lastKnownLocation.coordinates[0].toFixed(6)}° E` : 
    'Not available';

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#6bb944';
      case 'registered': return '#0067a5';
      case 'completed': return '#6fb7e3';
      case 'inactive': return '#ed1c25';
      default: return '#94a3b8';
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
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="runner-map-modal" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal container */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-6xl mx-auto transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm"
                >
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Runner Location</h2>
                  <p className="text-sm text-white/80">Real-time tracking information</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex flex-col lg:flex-row h-[600px]">
            {/* Map section */}
            <div className="w-full lg:w-2/3 h-[350px] lg:h-full relative bg-gray-100">
              {runner?.lastKnownLocation ? (
                <>
                  <div 
                    ref={mapRef} 
                    className="w-full h-full"
                    style={{ minHeight: '350px' }}
                  />
                  {!leafletLoaded && !mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                  {mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <div className="text-center">
                        <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600">Unable to load map</p>
                        <p className="text-xs text-gray-500 mt-1">Location: {formattedCoordinates}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No location data available</p>
                    <p className="text-sm text-gray-400 mt-1">Location tracking will appear here once available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Info panel */}
            <div className="w-full lg:w-1/3 h-[350px] lg:h-full bg-gray-50 overflow-y-auto">
              <div className="p-6">
                {/* Runner Info Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ backgroundColor: getStatusColor(runner?.status) }}
                    >
                      {runner?.name?.charAt(0) || 'R'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{runner?.name || 'Unknown Runner'}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(runner?.status)}`}>
                          {runner?.status ? runner.status.charAt(0).toUpperCase() + runner.status.slice(1) : 'Unknown'}
                        </span>
                        <span className="text-sm text-gray-500">#{runner?.runnerNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-4">
                  {/* Location */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Location Coordinates</div>
                        <div className="text-gray-900 font-mono text-sm mt-1">{formattedCoordinates}</div>
                      </div>
                    </div>
                  </div>

                  {/* Last Update */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Last Update</div>
                        <div className="text-gray-900 mt-1">
                          {runner?.lastUpdate ? new Date(runner.lastUpdate).toLocaleString() : 'Current'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Categories</div>
                        <div className="mt-2">
                          {runner?.registeredCategories?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {runner.registeredCategories.map((category, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No categories</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registration */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Registration Date</div>
                        <div className="text-gray-900 mt-1">
                          {runner?.createdAt ? new Date(runner.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Contact</div>
                        <div className="text-gray-900 mt-1">
                          <a href={`mailto:${runner?.email}`} className="text-blue-600 hover:text-blue-700">
                            {runner?.email || 'No email available'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Race Data */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <TrophyIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600 mb-2">Race Data</div>
                        {runner?.races && runner.races.length > 0 ? (
                          <div className="space-y-3">
                            {runner.races.map((race, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3">
                                <p className="font-medium text-gray-900">{race.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {new Date(race.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                                {race.completionTime && (
                                  <div className="flex items-center mt-2">
                                    <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Time: {typeof race.completionTime === 'number' ? 
                                        `${Math.floor(race.completionTime / 3600)}:${Math.floor((race.completionTime % 3600) / 60).toString().padStart(2, '0')}:${(race.completionTime % 60).toString().padStart(2, '0')}` : 
                                        race.completionTime}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No race data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start">
                    <ChartBarIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Additional Information</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        View this runner's detailed race history and performance statistics in the Races section.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerDetailsPopup;