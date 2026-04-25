import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/authStore';
import { insforge } from '../lib/insforge';
import { Phone, Instagram, Send, Globe, Navigation, ChevronRight, X as CloseIcon, LocateFixed } from 'lucide-react';



const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const createCustomIcon = (isSelected) => L.divIcon({
  className: 'custom-icon',
  html: `
    <div class="relative flex items-center justify-center">
      ${isSelected ? '<div class="absolute w-8 h-8 bg-white/20 rounded-full animate-ping-glow"></div>' : ''}
      <div class="w-2.5 h-2.5 bg-white rounded-full border-2 border-black shadow-[0_0_15px_rgba(255,255,255,0.5)] ${isSelected ? 'scale-125 transition-transform' : ''}"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Memoized icons to prevent markers from re-rendering on every map update
const ICONS = {
  default: createCustomIcon(false),
  selected: createCustomIcon(true)
};

function MapController({ center, zoom, bounds, selectedBusiness }) {
  const map = useMap();
  const lastSelectedId = useRef(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, duration: 1.1, padding: [60, 60] });
    } else if (selectedBusiness?.lat && selectedBusiness?.lng) {
      // Only fly if the selected business actually changed
      if (lastSelectedId.current !== selectedBusiness.business_id) {
        const targetZoom = 17;
        const targetPoint = map.project([selectedBusiness.lat, selectedBusiness.lng], targetZoom);
        const offsetPoint = L.point(targetPoint.x, targetPoint.y - 260);
        const offsetLatLng = map.unproject(offsetPoint, targetZoom);
        
        map.flyTo(offsetLatLng, targetZoom, { animate: true, duration: 1.2 });
        lastSelectedId.current = selectedBusiness.business_id;
      }
    } else if (center && !hasInitialized.current) {
      // Only auto-fly to user location ONCE on startup
      map.flyTo(center, zoom, { animate: true, duration: 1.1 });
      hasInitialized.current = true;
    }
    
    if (!selectedBusiness) {
      lastSelectedId.current = null;
    }
  }, [center, zoom, bounds, map, selectedBusiness]);

  useEffect(() => {
    map.dragging.enable();
    map.touchZoom.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
  }, [map]);

  return null;
}

/* ─── Popup Card Content ──────────────────────────── */
function BusinessPopupContent() {
  const selectedBusiness = useStore(state => state.selectedBusiness);
  const searchResults = useStore(state => state.searchResults);
  const currentIndex = useStore(state => state.currentIndex);
  const setCurrentIndex = useStore(state => state.setCurrentIndex);
  const setSelectedBusiness = useStore(state => state.setSelectedBusiness);
  const setShowDirections = useStore(state => state.setShowDirections);
  const showDirections = useStore(state => state.showDirections);
  const theme = useStore(state => state.theme);
  
  const [isImgExpanded, setIsImgExpanded] = useState(false);
  const [fetchedImage, setFetchedImage] = useState(null);

  // Only check if user location exists, don't subscribe to coordinate changes here
  const hasUserLocation = useStore(state => !!state.userLocation);

  useEffect(() => {
    // Reset fetched image when business changes
    setFetchedImage(null);
    
    // If the RPC didn't return an image, fetch it from the items table
    if (selectedBusiness?.item_id && !selectedBusiness.image_url && !selectedBusiness.image) {
      insforge.database.from('items').select('image_url').eq('id', selectedBusiness.item_id).single()
        .then(({ data }) => {
          if (data?.image_url) {
            setFetchedImage(data.image_url);
          }
        });
    }
  }, [selectedBusiness]);

  if (!selectedBusiness) return null;

  const biz = {
    business_name: selectedBusiness.business_name || selectedBusiness.name,
    whatsapp: selectedBusiness.whatsapp,
    phone: selectedBusiness.phone,
    instagram: selectedBusiness.instagram,
    x_handle: selectedBusiness.x_handle,
    website: selectedBusiness.website,
    lat: selectedBusiness.lat,
    lng: selectedBusiness.lng,
  };

  const product_name = selectedBusiness.item_name;
  const product_price = selectedBusiness.price;
  const product_image = selectedBusiness.image_url || selectedBusiness.image || fetchedImage;
  const totalResults = searchResults.length;
  const isLast = currentIndex >= totalResults - 1;
  const hasContact = biz.whatsapp || biz.phone || biz.instagram || biz.x_handle || biz.website;
  const canRoute = biz.lat != null && biz.lng != null && hasUserLocation;

  const handleNext = (e) => {
    e?.stopPropagation();
    const next = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(next);
    setSelectedBusiness(searchResults[next]);
    setShowDirections(false);
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    setSelectedBusiness(null);
    setShowDirections(false);
  };

  return (
    <div className={`w-[min(300px,calc(100vw-48px))] transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
      {/* Expanded Image Overlay */}
      <AnimatePresence>
        {isImgExpanded && (
          <div 
            className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out pointer-events-auto"
            onClick={() => setIsImgExpanded(false)}
          >
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={product_image} 
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
              alt={product_name}
            />
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
              <CloseIcon size={32} />
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <div className="flex justify-end -mt-1 -mr-1 mb-1">
        <button onClick={handleClose} className={`p-1 rounded-full transition-colors pointer-events-auto ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
          <CloseIcon size={14} className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'} />
        </button>
      </div>

      {/* Header with Title and Price */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`text-[16px] font-syne font-bold leading-tight mb-1 break-words ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {product_name || 'Offer'}
          </h3>
          <div className={`font-mono text-[15px] font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {product_price ? `UGX ${product_price.toLocaleString()}` : 'Price on request'}
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold max-w-full truncate ${theme === 'dark' ? 'bg-white/10 text-neutral-300' : 'bg-black/5 text-neutral-600'}`}>
            {biz.business_name}
          </span>
        </div>

        {product_image && (
          <div 
            onClick={() => setIsImgExpanded(true)}
            className={`w-24 h-24 rounded-2xl overflow-hidden cursor-zoom-in flex-shrink-0 shadow-2xl border bg-neutral-800 group relative pointer-events-auto ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}
          >
            <img 
              src={product_image} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              alt={product_name || 'Product'} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
        )}
      </div>

      {hasContact && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Contact Provider</div>
          <div className="flex gap-2 mb-2">
            {biz.phone && (
              <a href={`tel:${biz.phone}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-black transition-all pointer-events-auto border-none no-underline ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-neutral-800'}`}>
                <Phone size={14} /> CALL
              </a>
            )}
            {biz.whatsapp && (
              <a href={`https://wa.me/${biz.whatsapp}`} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-2.5 rounded-xl text-[12px] font-black hover:bg-[#22c35e] transition-all pointer-events-auto border-none no-underline">
                <Send size={14} /> WHATSAPP
              </a>
            )}
          </div>
          {(biz.instagram || biz.x_handle || biz.website) && (
            <div className="flex items-center gap-2">
              {biz.instagram && (
                <a href={`https://instagram.com/${biz.instagram}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:opacity-90 transition-opacity pointer-events-auto shadow-lg">
                  <Instagram size={18} />
                </a>
              )}
              {biz.x_handle && (
                <a href={`https://x.com/${biz.x_handle}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-black border border-white/20 text-white hover:bg-neutral-900 transition-colors pointer-events-auto shadow-lg">
                  <XIcon size={18} />

                </a>
              )}
              {biz.website && (
                <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} target="_blank" rel="noreferrer"
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors pointer-events-auto shadow-lg ${theme === 'dark' ? 'bg-neutral-800 border-white/10 text-white hover:bg-neutral-700' : 'bg-gray-100 border-black/10 text-black hover:bg-gray-200'}`}>
                  <Globe size={18} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {canRoute && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowDirections(true); }}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-black mb-3 transition-all pointer-events-auto ${showDirections ? (theme === 'dark' ? 'bg-black border border-white/20 text-white' : 'bg-white border border-black/20 text-black') : (theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20 border border-white/5' : 'bg-black/5 text-black hover:bg-black/10 border border-black/5')}`}
        >
          <Navigation size={14} /> {showDirections ? 'ROUTING...' : 'GET DIRECTIONS'}
        </button>
      )}

      {totalResults > 1 && (
        <div className={`border-t pt-3 flex items-center justify-between ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
          <div className="flex-1">
            <div className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {isLast ? 'Cycle alternatives' : 'Next Alternative'}
            </div>
          </div>
          <button
            onClick={handleNext}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-[11px] font-black transition-all pointer-events-auto shrink-0 shadow-xl ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
          >
            Next <ChevronRight size={13} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Recenter Button ────────────────────────────── */
function RecenterButton() {
  const map = useMap();
  const userLocation = useStore(state => state.userLocation);
  const setUserLocation = useStore(state => state.setUserLocation);
  const setSelectedBusiness = useStore(state => state.setSelectedBusiness);
  const setShowDirections = useStore(state => state.setShowDirections);
  const theme = useStore(state => state.theme);

  const handleRecenter = () => {
    // Refresh location only on manual request
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setSelectedBusiness(null);
        setShowDirections(false);
        map.flyTo([loc.lat, loc.lng], 18, { animate: true, duration: 1.1 });
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="absolute bottom-32 right-8 z-[1000] pointer-events-auto">
      <button
        onClick={handleRecenter}
        className={`w-14 h-14 backdrop-blur-2xl border rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all active:scale-90 group ${theme === 'dark' ? 'bg-neutral-900/95 border-white/10 text-white hover:bg-neutral-800 hover:border-white/20' : 'bg-white/95 border-black/10 text-black hover:bg-neutral-100 hover:border-black/20'}`}
        title="Recenter to my location"
      >
        <LocateFixed size={24} className="group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}

export default function MapDirectory() {
  const userLocation = useStore(state => state.userLocation);
  const setUserLocation = useStore(state => state.setUserLocation);
  const selectedBusiness = useStore(state => state.selectedBusiness);
  const setSelectedBusiness = useStore(state => state.setSelectedBusiness);
  const searchResults = useStore(state => state.searchResults);
  const setCurrentIndex = useStore(state => state.setCurrentIndex);
  const currentIndex = useStore(state => state.currentIndex);
  const showDirections = useStore(state => state.showDirections);
  const setShowDirections = useStore(state => state.setShowDirections);
  const theme = useStore(state => state.theme);

  const hasGeo = "geolocation" in navigator;
  const [mapConfig, setMapConfig] = useState(null);
  const [locReady, setLocReady] = useState(!hasGeo);
  const [routeCoordinates, setRouteCoordinates] = useState(null);

  const { session } = useAuthStore();
  const liveUsers = useStore(state => state.liveUsers);
  const setLiveUsers = useStore(state => state.setLiveUsers);

  useEffect(() => {
    if (showDirections && selectedBusiness?.lat && selectedBusiness?.lng && userLocation) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${selectedBusiness.lng},${selectedBusiness.lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteCoordinates(coords);
          } else {
            setRouteCoordinates([[userLocation.lat, userLocation.lng], [selectedBusiness.lat, selectedBusiness.lng]]);
          }
        } catch (e) {
          setRouteCoordinates([[userLocation.lat, userLocation.lng], [selectedBusiness.lat, selectedBusiness.lng]]);
        }
      };
      fetchRoute();
    } else {
      setRouteCoordinates(null);
    }
  }, [showDirections, selectedBusiness, userLocation]);

  useEffect(() => {
    if (!hasGeo) return;
    
    // Fetch position ONCE at startup
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setMapConfig({ center: [loc.lat, loc.lng], zoom: 18 });
        setLocReady(true);
      },
      () => setLocReady(true),
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
    // No more watchPosition - stops constant refreshing
  }, [hasGeo, setUserLocation]);

  const effectiveMapConfig = useMemo(() => {
    return mapConfig;
  }, [mapConfig]);

  const businesses = useMemo(() => {
    const seen = new Map();
    searchResults.forEach((r) => {
      if (!seen.has(r.business_id) && r.lat != null && r.lng != null) {
        seen.set(r.business_id, r);
      }
    });
    return Array.from(seen.values());
  }, [searchResults]);

  const activeBounds = useMemo(() => {
    if (showDirections && selectedBusiness?.lat && selectedBusiness?.lng && userLocation) {
      return L.latLngBounds([userLocation.lat, userLocation.lng], [selectedBusiness.lat, selectedBusiness.lng]).pad(0.25);
    }
    return null;
  }, [selectedBusiness, showDirections]);

  if (!locReady) return <div className="h-screen w-full flex items-center justify-center bg-[#080A0F] text-white font-syne">Initializing Location...</div>;

  const finalMapConfig = effectiveMapConfig || { center: [0.3476, 32.5825], zoom: 13 };
  const liveUserCount = Object.keys(liveUsers).length;

  const tileLayerUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const labelsLayerUrl = theme === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";

  return (
    <div className={`h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F]' : 'bg-gray-100'}`}>
      <MapContainer center={finalMapConfig.center} zoom={finalMapConfig.zoom} className="h-full w-full" zoomControl={false} scrollWheelZoom={true} doubleClickZoom={true} touchZoom={true} dragging={true}>
        <MapController center={activeBounds ? null : finalMapConfig.center} zoom={finalMapConfig.zoom} bounds={activeBounds} selectedBusiness={!showDirections ? selectedBusiness : null} />
        <TileLayer url={tileLayerUrl} attribution='&copy; OSM' />
        <TileLayer url={labelsLayerUrl} zIndex={10} />
        
        <RecenterButton />


        {userLocation && <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={6} pathOptions={{ color: theme === 'dark' ? 'white' : 'black', fillColor: theme === 'dark' ? 'white' : 'black', fillOpacity: 0.8 }} />}


        {businesses
          .filter(b => !selectedBusiness || selectedBusiness.business_id === b.business_id)
          .map((b) => (
            <Marker 
              key={b.business_id} 
              position={[b.lat, b.lng]} 
              icon={selectedBusiness?.business_id === b.business_id ? ICONS.selected : ICONS.default} 
              eventHandlers={{ click: () => {
                const idx = searchResults.findIndex(r => r.business_id === b.business_id);
                if (idx !== -1) { 
                  setSelectedBusiness(searchResults[idx]); 
                  setCurrentIndex(idx); 
                  setShowDirections(false); 
                }
              }}} 
            />
          ))}

        {selectedBusiness?.lat != null && selectedBusiness?.lng != null && (
          <Popup key={`${selectedBusiness.business_id}-${selectedBusiness.item_id}`} position={[selectedBusiness.lat, selectedBusiness.lng]} offset={[0, -20]} closeButton={false} autoClose={false} closeOnClick={false} className="tobli-popup" autoPan={false}>
            <BusinessPopupContent />
          </Popup>
        )}

        {showDirections && routeCoordinates && <Polyline positions={routeCoordinates} pathOptions={{ color: theme === 'dark' ? 'white' : 'black', weight: 4, dashArray: '8, 8' }} className="animate-pulse" />}
      </MapContainer>
    </div>
  );
}




