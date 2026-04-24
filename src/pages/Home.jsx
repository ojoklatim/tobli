import React from 'react';
import { useNavigate } from 'react-router-dom';
import MapDirectory from '../components/MapDirectory';
import SearchOverlay from '../components/SearchOverlay';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  const navigate = useNavigate();
  const { session, business, isAdmin, loading } = useAuthStore();
  const theme = useStore(state => state.theme);
  
  // A user is fully "signed in" if they have a business profile OR are an admin
  const hasProfile = !!business || isAdmin;
  const signedIn = !loading && !!session?.user && hasProfile;
  
  const label = signedIn ? (isAdmin ? 'Admin' : 'My Dashboard') : '+ Add';
  const target = signedIn ? (isAdmin ? '/admin' : '/dashboard') : '/login';

  return (
    <div className={`relative h-screen w-full overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F]' : 'bg-gray-100'}`}>
      {/* Topbar */}
      <div className={`fixed top-0 inset-x-0 z-[3000] flex justify-between items-center px-6 py-4 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F]/5 border-white/5' : 'bg-white/50 border-black/5'} pointer-events-none`}>
        <div 
          className={`text-xl font-syne font-extrabold tracking-tighter pointer-events-auto cursor-pointer transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
          onClick={() => window.location.reload()}
        >
          TOBLI
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <ThemeToggle />
          <button 
            onClick={() => navigate(target)}
            className="bg-white dark:bg-neutral-800 text-black dark:text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full font-sans font-bold text-xs tracking-tight hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-xl flex items-center gap-2 active:scale-95"
          >
            {signedIn ? <Shield size={14}/> : null}
            {label}
          </button>
        </div>
      </div>

      {/* Main Map */}
      <MapDirectory />

      {/* Search Overlay */}
      <SearchOverlay />
    </div>
  );
}
