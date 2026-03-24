import React from 'react';
import { useNavigate } from 'react-router-dom';
import MapDirectory from '../components/MapDirectory';
import SearchOverlay from '../components/SearchOverlay';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Shield } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuthStore();
  const label = session ? (isAdmin ? 'Admin' : 'My Dashboard') : '+ Add';
  const target = session ? (isAdmin ? '/admin' : '/dashboard') : '/login';

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#080A0F]">
      {/* Topbar */}
      <div className="fixed top-0 inset-x-0 z-[3000] flex justify-between items-center px-6 py-4 bg-[#080A0F]/5 backdrop-blur-md border-b border-white/5 pointer-events-none">
        <div 
          className="text-xl font-syne font-extrabold text-white tracking-tighter pointer-events-auto cursor-pointer"
          onClick={() => window.location.reload()}
        >
          TOBLI
        </div>
        <button 
          onClick={() => navigate(target)}
          className="bg-white text-black px-4 py-2 md:px-5 md:py-2.5 rounded-full font-sans font-bold text-xs tracking-tight hover:bg-neutral-200 transition-all pointer-events-auto shadow-xl flex items-center gap-2 active:scale-95"
        >
          {session ? (isAdmin ? <Shield size={14}/> : <Shield size={14}/>) : null}
          {label}
        </button>
      </div>

      {/* Main Map */}
      <MapDirectory />

      {/* Search Overlay */}
      <SearchOverlay />
    </div>
  );
}
