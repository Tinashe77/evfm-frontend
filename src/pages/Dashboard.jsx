// src/pages/Dashboard.jsx - Updated to match the design look and feel
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { 
  UsersIcon, 
  MapIcon, 
  FlagIcon,
  ShieldCheckIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Loading from '../components/Loading';
import Error from '../components/Error';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [runnerStats, setRunnerStats] = useState({ count: 0, runners: [] });
  const [routes, setRoutes] = useState({ count: 0, routes: [] });
  const [races, setRaces] = useState({ count: 0, races: [] });
  const [chartData, setChartData] = useState([]);
  const [routeData, setRouteData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch admin users
      const adminsResponse = await axios.get('/auth/admins');
      if (adminsResponse.data?.success) {
        setAdminUsers(adminsResponse.data.data || []);
      }

      // Fetch runners
      const runnersResponse = await axios.get('/runners?limit=10');
      if (runnersResponse.data?.success) {
        setRunnerStats({
          count: runnersResponse.data.count || 0,
          runners: runnersResponse.data.data || []
        });
      }

      // Fetch routes
      const routesResponse = await axios.get('/routes');
      if (routesResponse.data?.success) {
        const routesData = routesResponse.data.data || [];
        setRoutes({
          count: routesResponse.data.count || 0,
          routes: routesData
        });
        processRouteData(routesData);
      }

      // Fetch races
      const racesResponse = await axios.get('/races?limit=10');
      if (racesResponse.data?.success) {
        setRaces({
          count: racesResponse.data.count || 0,
          races: racesResponse.data.data || []
        });
        generateChartData(racesResponse.data.data || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processRouteData = (routesData) => {
    const categoryCounts = {};
    
    routesData.forEach(route => {
      const category = route.category || 'Unknown';
      if (!categoryCounts[category]) {
        categoryCounts[category] = {
          name: category,
          count: 0,
          avgDistance: 0,
          totalDistance: 0
        };
      }
      categoryCounts[category].count++;
      categoryCounts[category].totalDistance += (route.distance || 0);
    });
    
    Object.keys(categoryCounts).forEach(category => {
      categoryCounts[category].avgDistance = 
        categoryCounts[category].totalDistance / categoryCounts[category].count;
    });
    
    const routeChartData = Object.values(categoryCounts);
    setRouteData(routeChartData);
  };

  const generateChartData = (racesData) => {
    const racesByDate = {};
    
    racesData.forEach(race => {
      const date = new Date(race.startTime || race.createdAt);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      
      if (!racesByDate[dateKey]) {
        racesByDate[dateKey] = {
          date: dateKey,
          participants: 0,
          completions: 0
        };
      }
      
      racesByDate[dateKey].participants++;
      if (race.status === 'completed') {
        racesByDate[dateKey].completions++;
      }
    });
    
    const chartData = Object.values(racesByDate);
    chartData.sort((a, b) => {
      const [aMonth, aDay] = a.date.split('/').map(Number);
      const [bMonth, bDay] = b.date.split('/').map(Number);
      return aMonth !== bMonth ? aMonth - bMonth : aDay - bDay;
    });
    
    setChartData(chartData);
  };

  const activeRaces = races.races ? races.races.filter(race => race.status === 'in-progress').length : 0;
  const completedRaces = races.races ? races.races.filter(race => race.status === 'completed').length : 0;

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const COLORS = ['#0067a5', '#6bb944', '#6fb7e3', '#ed1c25'];

  const pieData = [
    { name: 'Active Runners', value: runnerStats.runners.filter(r => r.status === 'active').length, color: '#6bb944' },
    { name: 'Registered', value: runnerStats.runners.filter(r => r.status === 'registered').length, color: '#0067a5' },
    { name: 'Completed', value: runnerStats.runners.filter(r => r.status === 'completed').length, color: '#6fb7e3' },
    { name: 'Inactive', value: runnerStats.runners.filter(r => r.status === 'inactive').length, color: '#ed1c25' }
  ];

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      {/* Top Header Bar - matching the design */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#0067a5' }}
              >
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-sm text-gray-500">Victoria Falls Marathon Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50">
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid - matching the design layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Runners Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6bb944' }}
            >
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(runnerStats.count)}</div>
              <div className="text-sm text-gray-500">Total Runners</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <div 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: '#6bb944' }}
              ></div>
              <span className="text-gray-600">+12% this month</span>
            </div>
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: '#6bb944' }}
            >
              Active
            </div>
          </div>
        </div>

        {/* Active Routes Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#0067a5' }}
            >
              <MapIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{routes.count}</div>
              <div className="text-sm text-gray-500">Active Routes</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <div 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: '#0067a5' }}
              ></div>
              <span className="text-gray-600">{routes.routes.filter(r => r.isActive).length} routes active</span>
            </div>
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: '#0067a5' }}
            >
              Ready
            </div>
          </div>
        </div>

        {/* Ongoing Races Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              <FlagIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{activeRaces}</div>
              <div className="text-sm text-gray-500">Ongoing Races</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <div 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: '#6fb7e3' }}
              ></div>
              <span className="text-gray-600">{completedRaces} completed</span>
            </div>
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: '#6fb7e3' }}
            >
              Live
            </div>
          </div>
        </div>

        {/* Admin Users Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#ed1c25' }}
            >
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{adminUsers.length}</div>
              <div className="text-sm text-gray-500">Admin Users</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <div 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: '#ed1c25' }}
              ></div>
              <span className="text-gray-600">All active</span>
            </div>
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: '#ed1c25' }}
            >
              Secure
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Two Column Layout like the design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Race Participation Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Race Analytics</h3>
                <p className="text-sm text-gray-500">Participation trends over time</p>
              </div>
              <div className="flex items-center space-x-2">
                {/* <button className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600">Week</button>
                <button className="px-3 py-1 text-xs font-medium rounded-lg text-gray-500">Month</button>
                <button className="px-3 py-1 text-xs font-medium rounded-lg text-gray-500">Year</button> */}
              </div>
            </div>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0067a5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0067a5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="participants" 
                      stroke="#0067a5" 
                      strokeWidth={3}
                      fill="url(#colorParticipants)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity - Timeline style like the design */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500">Latest race updates and registrations</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
            <div className="space-y-4">
              {races.races && races.races.slice(0, 4).map((race, index) => (
                <div key={race._id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: index === 0 ? '#6bb944' : 
                                       index === 1 ? '#0067a5' : 
                                       index === 2 ? '#6fb7e3' : '#ed1c25'
                      }}
                    ></div>
                    {index < races.races.length - 1 && (
                      <div className="absolute top-3 left-1.5 w-0.5 h-8 bg-gray-200"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {race.runner?.name || 'Unknown Runner'} - {race.category}
                      </p>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        race.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        race.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {race.status || 'Unknown'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {race.route?.name} • {new Date(race.startTime || race.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Like the design's right panel */}
        <div className="space-y-6">
          {/* Runner Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Runner Status</h3>
                <p className="text-sm text-gray-500">Distribution overview</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions - Like premium subscription in design */}
          <div 
            className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0067a5 0%, #6fb7e3 100%)'
            }}
          >
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2">Marathon Control</h3>
              <p className="text-sm text-white/80 mb-4">
                Manage your marathon operations efficiently with real-time monitoring and control.
              </p>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Real-time race tracking
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Automated communications
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Emergency protocols
                </li>
              </ul>
              {/* <button className="w-full bg-white text-gray-900 font-medium py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors">
                Access Controls
              </button> */}
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5"></div>
          </div>
        </div>
      </div>
    </div>
  );
}