// src/pages/Login.jsx - Updated for Econet Victoria Falls Marathon
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import vicFalls from '../assets/vicfalls.jpg';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { initModalManager, showError } from '../utils/modalManager';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    initModalManager();
    
    // Add CSS animation for zoom effect
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slowZoom {
        0% {
          transform: scale(1);
        }
        100% {
          transform: scale(1.1);
        }
      }
      .zoom-animation {
        animation: slowZoom 20s ease-in-out infinite alternate;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error in component:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      
      // Show error modal for network errors
      if (err.message.includes('Unable to connect') || err.message.includes('Network Error')) {
        showError(err.message, 'Connection Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-4/5 max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={logo} 
                alt="Econet Victoria Falls Marathon" 
                className="h-48 w-auto" 
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
            <p className="text-sm text-gray-600">
              Access your marathon management dashboard
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderColor: '#0067a5' }}
                onFocus={(e) => e.target.style.borderColor = '#0067a5'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderColor: '#0067a5' }}
                onFocus={(e) => e.target.style.borderColor = '#0067a5'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                  style={{ accentColor: '#0067a5' }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium hover:underline" style={{ color: '#0067a5' }}>
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: '#0067a5',
                  ':hover': { backgroundColor: '#005a94' }
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#005a94'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0067a5'}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Secure access to Victoria Falls Marathon management
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Victoria Falls Image with Logo */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Victoria Falls Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${vicFalls})`,
            filter: 'brightness(0.7)',
            animation: 'slowZoom 15s ease-in-out infinite alternate',
          }}
        >
          {/* Gradient Overlay for better contrast */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, 
                rgba(0, 103, 165, 0.2) 0%, 
                rgba(111, 183, 227, 0.15) 50%, 
                rgba(107, 185, 68, 0.2) 100%)`
            }}
          ></div>
        </div>

        {/* Centered Logo with Glass Effect */}
       

        {/* Bottom text overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-8">
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-2">
              Experience the Thunder
            </h3>
            <p className="text-lg opacity-90 mb-4">
              Victoria Falls Marathon - Where adventure meets endurance
            </p>
            <div className="flex items-center space-x-4 text-sm opacity-80">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#6bb944' }}></div>
                <span>Zimbabwe</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#6fb7e3' }}></div>
                <span>Victoria Falls</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#0067a5' }}></div>
                <span>Marathon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
          <div className="w-1 h-20 rounded-full opacity-60" style={{ backgroundColor: '#6fb7e3' }}></div>
        </div>
        <div className="absolute top-1/3 right-12 transform -translate-y-1/2">
          <div className="w-1 h-12 rounded-full opacity-40" style={{ backgroundColor: '#6bb944' }}></div>
        </div>
      </div>
    </div>
  );
}