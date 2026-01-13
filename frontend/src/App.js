import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Sales from './components/Sales';
import Dashboard from './components/Dashboard';
import GlobalDashboard from './components/GlobalDashboard';
import Enquiries from './components/Enquiries';
import Bookings from './components/Bookings';
import Service from './components/Service';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.defaults.withCredentials = true;

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash;
    const sessionIdMatch = hash.match(/session_id=([^&]+)/);
    
    if (sessionIdMatch) {
      const sessionId = sessionIdMatch[1];
      
      // Exchange session_id for session_token
      axios.post(`${API}/auth/session`, { session_id: sessionId })
        .then(response => {
          const { user } = response.data;
          // Navigate to dashboard with user data
          navigate('/dashboard', { state: { user }, replace: true });
        })
        .catch(error => {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auth check if user data passed from AuthCallback
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuth();
  }, [location, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return React.cloneElement(children, { user, onLogout: async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  }});
}

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id SYNCHRONOUSLY during render
  // This prevents race conditions with ProtectedRoute
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Sales /></ProtectedRoute>
      } />
      <Route path="/enquiries" element={
        <ProtectedRoute><Enquiries /></ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute><Bookings /></ProtectedRoute>
      } />
      <Route path="/service" element={
        <ProtectedRoute><Service /></ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute><Inventory /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
