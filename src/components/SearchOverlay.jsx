import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { insforge } from '../lib/insforge';

export default function SearchOverlay() {
  const [text, setText] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fullText = "Looking for something?";

  const setSelectedBusiness = useStore(state => state.setSelectedBusiness);
  const setSearchResults = useStore(state => state.setSearchResults);
  const setCurrentIndex = useStore(state => state.setCurrentIndex);
  const setShowDirections = useStore(state => state.setShowDirections);
  const searchResults = useStore(state => state.searchResults);
  const userLocation = useStore(state => state.userLocation);
  const theme = useStore(state => state.theme);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenWelcome');
    if (hasSeen) {
      setText(fullText);
      setShowSearchInput(true);
      return;
    }

    let currentPos = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, currentPos + 1));
      currentPos++;
      if (currentPos === fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setTimeout(() => {
            setShowSearchInput(true);
            localStorage.setItem('hasSeenWelcome', 'true');
          }, 1200);
        }, 55);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Mock search - only depends on searchTerm
  // Location is used inside the search but doesn't trigger it to avoid refresh loops
  useEffect(() => {
    const doSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setNoResultsMessage('');
        return;
      }

      setIsLoading(true);

      const lat = userLocation?.lat || 0.3476;
      const lng = userLocation?.lng || 32.5825;

      const { data: results, error } = await insforge.database.rpc('search_nearby', {
        search_query: searchTerm,
        user_lat: lat,
        user_lng: lng,
        radius_km: 5,
      });

      if (!results || results.length === 0 || error) {
        setNoResultsMessage('Nothing found near you');
        setSearchResults([]);
      } else {
        setNoResultsMessage('');
        setSearchResults(results);

        // Record impressions for businesses that appeared
        const impressions = results.map(res => ({
          business_id: res.business_id,
          search_query: searchTerm,
        }));

        if (impressions.length > 0) {
          insforge.database.from('search_impressions').insert(impressions)
            .then(({ error: impError }) => {
              if (impError) { /* impression tracking failed silently */ }
            });
        }
      }

      setCurrentIndex(0);
      setIsLoading(false);
    };

    const handler = setTimeout(doSearch, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, setSearchResults, setCurrentIndex, userLocation]);



  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleSelectResult = (res, idx) => {
    // ALWAYS start from the nearest (index 0) as requested, 
    // even if a specific alternative was clicked in the list.
    if (searchResults && searchResults.length > 0) {
      setSelectedBusiness(searchResults[0]);
      setCurrentIndex(0);
    }
    setShowDirections(false);
    setIsDropdownOpen(false); 
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
            className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm pointer-events-auto transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F]/50' : 'bg-white/50'}`}
          >
            <Motion.h1 
              initial={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -30, opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: "easeIn" }}
              className={`text-2xl md:text-3xl lg:text-4xl font-syne font-black tracking-tighter text-center px-8 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
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
              <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors duration-300 ${theme === 'dark' ? 'text-neutral-400 group-focus-within:text-white' : 'text-neutral-500 group-focus-within:text-black'}`}>
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Search products or services..."
                className={`w-full backdrop-blur-2xl border rounded-full py-3 md:py-3.5 pl-12 pr-6 text-sm md:text-sm font-sans focus:outline-none transition-all shadow-2xl ${theme === 'dark' ? 'bg-neutral-900/95 border-white/10 text-white focus:border-white placeholder-neutral-500' : 'bg-white/95 border-black/10 text-black focus:border-black placeholder-neutral-400'}`}
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
                      className={`absolute top-full mt-3 w-full backdrop-blur-2xl border rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] max-h-[60vh] overflow-y-auto no-scrollbar transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900/90 border-neutral-800/80' : 'bg-white/95 border-black/10'}`}
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
                            className={`w-full px-5 py-4 flex items-center justify-between border-b last:border-0 transition-colors text-left group ${theme === 'dark' ? 'hover:bg-white/5 active:bg-white/10 border-white/[0.04]' : 'hover:bg-black/5 active:bg-black/10 border-black/[0.04]'}`}
                          >
                            <div className="flex-1 pr-4">
                              <div className={`font-medium text-base mb-1 transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{res.item_name}</div>
                              <div className="text-neutral-400 text-sm flex items-center gap-2">
                                <span>{res.business_name}</span>
                                {res.distance_km != null && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                    <span className={`font-medium ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>{res.distance_km.toFixed(1)}km</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`font-mono font-medium tracking-tight px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'text-white/90 bg-white/10' : 'text-black/90 bg-black/5'}`}>
                                {res.price ? `UGX ${res.price.toLocaleString()}` : '—'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                        <Search className={`w-8 h-8 mb-2 transition-colors ${theme === 'dark' ? 'text-neutral-600' : 'text-neutral-300'}`} />
                        <span className={`font-medium text-base transition-colors ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {noResultsMessage || 'Nothing found near you'}
                        </span>
                        <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>Try exploring different keywords</span>
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
