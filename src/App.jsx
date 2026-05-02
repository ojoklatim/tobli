import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscribe from './pages/Subscribe';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import PresenceManager from './components/PresenceManager';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useStore } from './store/useStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }) {
  const session = useAuthStore(state => state.session);
  const business = useAuthStore(state => state.business);
  const loading = useAuthStore(state => state.loading);
  const location = useLocation();

  if (loading) return null;
  if (!session?.user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function App() {
  const theme = useStore(state => state.theme);

  useEffect(() => {
    useAuthStore.getState().loadSession();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-white text-black'}`}>
          <ScrollToTop />
          <PresenceManager />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<Admin />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
