// src/components/Layout.jsx - Updated to match the design with exact colors
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  MapIcon,
  FlagIcon,
  EnvelopeIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useInactivityTracker } from '../utils/inactivityTracker';
import { initModalManager, showConfirm } from '../utils/modalManager';
import logo from '../assets/logo.png';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, count: null },
  { name: 'Runners', href: '/runners', icon: UsersIcon, count: 0 },
  { name: 'Routes', href: '/routes', icon: MapIcon, count: 0 },
  { name: 'Races', href: '/races', icon: FlagIcon, count: 0 },
  { name: 'Communications', href: '/communications', icon: EnvelopeIcon, count: null },
  { name: 'Admin Users', href: '/admin-users', icon: ShieldCheckIcon, count: 0 },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Initialize the modal manager
  useEffect(() => {
    initModalManager();
  }, []);

  // Use our inactivity tracker
  useInactivityTracker();

  const handleLogout = () => {
    showConfirm(
      'Are you sure you want to logout?',
      logout,
      'Confirm Logout',
      'Logout',
      'Cancel'
    );
  };

  // Sidebar navigation component
  const NavLinks = () => (
    <div className="px-3 space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`
              group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-2xl
              transition-all duration-200 ease-in-out
              ${isActive
                ? 'bg-white text-gray-800 shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <div className="flex items-center">
              <item.icon 
                className={`h-5 w-5 mr-3 transition-colors duration-200
                  ${isActive ? 'text-gray-700' : 'text-white/70 group-hover:text-white'}
                `} 
                aria-hidden="true" 
              />
              <span>{item.name}</span>
            </div>
            {/* {item.count !== null && (
              <span className={`
                px-2 py-1 text-xs rounded-full font-medium
                ${isActive 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-white/20 text-white/90'
                }
              `}>
                {item.count}
              </span>
            )} */}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full">
                <div 
                  className="flex-1 h-0 flex flex-col"
                  style={{
                    background: 'linear-gradient(135deg, #0067a5 0%, #6fb7e3 50%, #0067a5 100%)'
                  }}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>

                  {/* Mobile Logo */}
                  <div className="p-6 text-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 inline-block">
                      <img src={logo} alt="Econet Victoria Falls Marathon" className="h-12 w-auto" />
                    </div>
                    <h2 className="text-white text-lg font-semibold mt-3">Victoria Falls Marathon</h2>
                    <p className="text-white/70 text-sm mt-1">Admin Dashboard</p>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 px-2 pb-4">
                    <NavLinks />
                  </nav>

                  {/* Mobile User Profile */}
                  <div className="p-4 border-t border-white/20">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: '#6bb944' }}
                      >
                        {user?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-white font-medium text-sm">{user?.name || 'Admin User'}</div>
                        <div className="text-white/70 text-xs">{user?.email || 'admin@victoria-falls.com'}</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true" />
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div 
          className="flex flex-col w-80 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0067a5 0%, #6fb7e3 50%, #0067a5 100%)'
          }}
        >
          {/* Logo Section */}
                <div className="p-6 text-center border-b border-white/20">
                <div className="bg-white rounded-2xl p-4 border border-gray-200 inline-block">
                  <img src={logo} alt="Econet Victoria Falls Marathon" className="h-16 w-auto" />
                </div>
                <h2 className="text-white text-xl font-bold mt-4">Victoria Falls Marathon</h2>
                </div>

                {/* Navigation Menu */}
          <nav className="flex-1 py-6">
            <div className="text-white/60 text-xs uppercase tracking-wider font-medium px-6 mb-4">
              NAVIGATION
            </div>
            <NavLinks />
          </nav>

          {/* User Profile & Logout - Sticky to bottom */}
          <div className="p-4 border-t border-white/20 bg-black/10">
            <div className="flex items-center mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: '#6bb944' }}
              >
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="ml-3 flex-1">
                <div className="text-white font-semibold text-sm">{user?.name || 'Admin User'}</div>
                <div className="text-white/70 text-xs">{user?.email || 'admin@victoria-falls.com'}</div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 font-medium"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {/* Top navbar */}
        {/* <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            type="button"
            className="lg:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-6 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="text-sm text-gray-500 mr-4">
                Welcome back, {user?.name || 'Admin'}
              </div>
              <button
                type="button"
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">View notifications</span>
                <div className="relative">
                  <Cog6ToothIcon className="h-6 w-6" />
                  <div 
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#ed1c25' }}
                  ></div>
                </div>
              </button>
            </div>
          </div>
        </div> */}

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-8 px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;