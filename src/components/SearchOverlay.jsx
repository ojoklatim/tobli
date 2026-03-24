import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function SearchOverlay() {
  const [text, setText] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lat, setLat] = useState(0.3476);
  const [lng, setLng] = useState(32.5825);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fullText = "Looking for something?";

  const {
    setSelectedBusiness,
    setSearchResults,
    setCurrentIndex,
    setShowDirections,
    searchResults,
  } = useStore();

  useEffect(() => {
    let currentPos = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, currentPos + 1));
      currentPos++;
      if (currentPos === fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setTimeout(() => {
            setShowSearchInput(true);
          }, 1200);
        }, 55);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => { }
    );
  }, []);

  // Mock search
  useEffect(() => {
    const doSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setNoResultsMessage('');
        return;
      }

      setIsLoading(true);

      await new Promise(r => setTimeout(r, 500));

      // MOCK DATA — will be replaced with D1 backend calls
      const mockDB = [
        { business_id: '1', item_id: '1', item_name: 'Premium Coffee Beans', business_name: 'Café Javas', sector: 'Goods', price: 25000, distance_km: 0.8, lat: 0.3486, lng: 32.5835, whatsapp: '256700000001', phone: '+256700000001', instagram: 'cafejavas', x_handle: 'cafejavas', website: 'cafejavas.ug' },
        { business_id: '2', item_id: '2', item_name: 'Cappuccino', business_name: 'Endiro Coffee', sector: 'Goods', price: 15000, distance_km: 1.2, lat: 0.3466, lng: 32.5815, whatsapp: '256700000002', phone: '+256700000002', instagram: 'endirocoffee' },
        { business_id: '3', item_id: '3', item_name: 'Cold Brew Coffee', business_name: '1000 Cups', sector: 'Goods', price: 12000, distance_km: 2.5, lat: 0.3496, lng: 32.5845, phone: '+256700000003' },
        { business_id: '4', item_id: '4', item_name: 'Website Design', business_name: 'Digital Agency', sector: 'Services', price: 800000, distance_km: 0.5, lat: 0.3470, lng: 32.5830, whatsapp: '256700000004', website: 'digitalagency.ug' },
        { business_id: '5', item_id: '5', item_name: 'Haircut', business_name: 'Kampala Barbers', sector: 'Services', price: 30000, distance_km: 1.8, lat: 0.3460, lng: 32.5810, phone: '+256700000005', instagram: 'kampalabarbers' },
        { business_id: '6', item_id: '6', item_name: 'Car Wash', business_name: 'Sparkle Auto', sector: 'Services', price: 20000, distance_km: 3.0, lat: 0.3500, lng: 32.5860, whatsapp: '256700000006', phone: '+256700000006' },
      ];

      const results = mockDB
        .filter(item =>
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sector.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.distance_km - b.distance_km);

      if (results.length === 0) {
        setNoResultsMessage('Nothing found near you');
      } else {
        setNoResultsMessage('');
      }

      setSearchResults(results);
      setCurrentIndex(0);
      setIsLoading(false);
    };

    const handler = setTimeout(doSearch, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, lat, lng, setSearchResults, setCurrentIndex]);


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleSelectResult = (res, idx) => {
    // Always start from the nearest (index 0) — the results are sorted by distance
    setSelectedBusiness(searchResults[0]);
    setCurrentIndex(0);
    setShowDirections(false);
    setIsDropdownOpen(false); // Hide the dropdown but PRESERVE the search results and pins!
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex flex-col items-center">
      <AnimatePresence>
        {!showSearchInput && (
          <Motion.div
            key="text-backdrop"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-[#080A0F]/50 backdrop-blur-sm pointer-events-auto"
          >
            <Motion.h1 
              initial={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -30, opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: "easeIn" }}
              className="text-2xl md:text-3xl lg:text-4xl font-syne font-black text-white tracking-tighter text-center px-8"
            >
              {text}
              <span className="animate-pulse">|</span>
            </Motion.h1>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearchInput && (
          <Motion.div
            key="search-bar"
            initial={{ y: "45vh", scale: 0.85, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: "15vh", scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 22,
              mass: 0.8,
              delay: 0.1 
            }}
            className="absolute top-0 w-full max-w-lg lg:max-w-xl px-6 pointer-events-auto"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-white transition-colors duration-300">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Search products or services..."
                className="w-full bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-full py-3 md:py-3.5 pl-12 pr-6 text-white text-sm md:text-sm font-sans focus:outline-none focus:border-white transition-all shadow-2xl placeholder-neutral-500"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsDropdownOpen(true)}
              />

              {/* Results Dropdown */}
              <AnimatePresence>
                {(isDropdownOpen && searchTerm.length >= 2 && (isLoading || searchResults)) && (
                  <Motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute top-full mt-3 w-full bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] max-h-[60vh] overflow-y-auto no-scrollbar"
                  >
                    {isLoading ? (
                      <div className="p-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-white/70" />
                        <span className="text-sm text-neutral-400 font-medium">Searching nearby...</span>
                      </div>
                    ) : searchResults?.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((res, idx) => (
                          <button
                            key={`${res.business_id}-${res.item_id}`}
                            onClick={() => handleSelectResult(res, idx)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 active:bg-white/10 border-b border-white/[0.04] last:border-0 transition-colors text-left group"
                          >
                            <div className="flex-1 pr-4">
                              <div className="text-white font-medium text-base mb-1 group-hover:text-blue-400 transition-colors">{res.item_name}</div>
                              <div className="text-neutral-400 text-sm flex items-center gap-2">
                                <span>{res.business_name}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                <span>{res.sector}</span>
                                {res.distance_km != null && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                    <span className="text-white/70 font-medium">{res.distance_km.toFixed(1)}km</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-white/90 font-mono font-medium tracking-tight bg-white/10 px-3 py-1.5 rounded-lg text-sm">
                                {res.price ? `UGX ${res.price.toLocaleString()}` : '—'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 text-neutral-600 mb-2" />
                        <span className="text-neutral-400 font-medium text-base">
                          {noResultsMessage || 'Nothing found near you'}
                        </span>
                        <span className="text-neutral-500 text-sm">Try exploring different keywords</span>
                      </div>
                    )}
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
