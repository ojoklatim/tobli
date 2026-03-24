import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { Phone, Instagram, Send, Twitter, Globe, Navigation, ChevronRight, X } from 'lucide-react';

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

function MapController({ center, zoom, bounds, selectedBusiness }) {
  const map = useMap();
  const [wasSelected, setWasSelected] = useState(false);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, duration: 1.1, padding: [60, 60] });
      setWasSelected(false);
    } else if (selectedBusiness?.lat && selectedBusiness?.lng) {
      // Focus on business: shift camera 150px north of the pin so the pin lands in the lower-center
      const targetZoom = 17;
      const targetPoint = map.project([selectedBusiness.lat, selectedBusiness.lng], targetZoom);
      const offsetPoint = L.point(targetPoint.x, targetPoint.y - 260);
      const offsetLatLng = map.unproject(offsetPoint, targetZoom);
      
      map.flyTo(offsetLatLng, targetZoom, { animate: true, duration: 1.2 });
      setWasSelected(true);
    } else if (center && !wasSelected) {
      // Only fly to user location if we aren't currently focusing a business
      map.flyTo(center, zoom, { animate: true, duration: 1.1 });
    }
    
    // Reset "wasSelected" if business clears
    if (!selectedBusiness) {
      setWasSelected(false);
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

/* ── Popup Card Content ──────────────────────────── */
function BusinessPopupContent() {
  const { selectedBusiness, searchResults, currentIndex, setCurrentIndex, setSelectedBusiness, setShowDirections, showDirections, userLocation } = useStore();

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
  const totalResults = searchResults.length;
  const remaining = totalResults - (currentIndex + 1);
  const isLast = currentIndex >= totalResults - 1;
  const hasContact = biz.whatsapp || biz.phone || biz.instagram || biz.x_handle || biz.website;
  const canRoute = biz.lat != null && biz.lng != null && userLocation;

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
    <div className="min-w-[260px] max-w-[300px] text-white">
      {/* Close button */}
      <div className="flex justify-end -mt-1 -mr-1 mb-1">
        <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/10 transition-colors pointer-events-auto">
          <X size={14} className="text-neutral-400" />
        </button>
      </div>

      <div className="mb-3">
        <h3 className="text-[15px] font-syne font-bold text-white leading-tight mb-1">
          {product_name || 'Offer'}
        </h3>
        <div className="font-mono text-sm text-indigo-400 mb-1.5 font-bold">
          {product_price ? `UGX ${product_price.toLocaleString()}` : 'Price on request'}
        </div>
        <span className="inline-block px-2 py-0.5 bg-white/10 rounded-full text-[10px] uppercase tracking-widest text-neutral-300 font-bold">
          {biz.business_name}
        </span>
      </div>

      {hasContact && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Contact Provider</div>
          <div className="flex gap-2 mb-2">
            {biz.phone && (
              <a href={`tel:${biz.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black py-2.5 rounded-xl text-[12px] font-black hover:bg-neutral-100 transition-all pointer-events-auto border-none no-underline">
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
                  <Twitter size={18} />
                </a>
              )}
              {biz.website && (
                <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 border border-white/10 text-white hover:bg-neutral-700 transition-colors pointer-events-auto shadow-lg">
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
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-black mb-3 transition-all pointer-events-auto ${showDirections ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'}`}
        >
          <Navigation size={14} /> {showDirections ? 'ROUTING...' : 'GET DIRECTIONS'}
        </button>
      )}

      {totalResults > 1 && (
        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-white text-[11px] font-bold">
              {isLast ? 'Cycle alternatives' : 'Next Alternative'}
            </div>
            <div className="text-neutral-400 text-[10px] truncate pr-2">
              {currentIndex + 1} of {totalResults} 
              {remaining > 0 ? ` · ${remaining} more` : ' · loop'}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 bg-white text-black px-4 py-2 rounded-full text-[11px] font-black hover:bg-neutral-200 transition-all pointer-events-auto shrink-0 shadow-xl"
          >
            Next <ChevronRight size={13} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MapDirectory() {
  const { userLocation, setUserLocation, selectedBusiness, setSelectedBusiness, searchResults, setCurrentIndex, currentIndex, showDirections, setShowDirections } = useStore();
  const hasGeo = "geolocation" in navigator;
  const [mapConfig, setMapConfig] = useState(null);
  const [locReady, setLocReady] = useState(!hasGeo);
  const [routeCoordinates, setRouteCoordinates] = useState(null);

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
    const fillLocation = (loc) => {
      setUserLocation(loc);
      setMapConfig({ center: [loc.lat, loc.lng], zoom: 18 });
      setLocReady(true);
    };
    navigator.geolocation.getCurrentPosition(
      (position) => fillLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setLocReady(true),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    const watcher = navigator.geolocation.watchPosition(
      (position) => fillLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [hasGeo, setUserLocation]);

  const effectiveMapConfig = useMemo(() => {
    if (userLocation) return { center: [userLocation.lat, userLocation.lng], zoom: 18 };
    return mapConfig;
  }, [userLocation, mapConfig]);

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
  }, [selectedBusiness, userLocation, showDirections]);

  if (!locReady) return <div className="h-screen w-full flex items-center justify-center bg-[#080A0F] text-white">Initializing Location...</div>;

  const finalMapConfig = effectiveMapConfig || { center: [0.3476, 32.5825], zoom: 13 };

  return (
    <div className="h-screen w-full bg-[#080A0F]">
      <MapContainer center={finalMapConfig.center} zoom={finalMapConfig.zoom} className="h-full w-full" zoomControl={false}>
        <MapController center={activeBounds ? null : finalMapConfig.center} zoom={finalMapConfig.zoom} bounds={activeBounds} selectedBusiness={!showDirections ? selectedBusiness : null} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OSM' />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" zIndex={10} />

        {userLocation && <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={6} pathOptions={{ color: 'white', fillColor: 'white', fillOpacity: 0.8 }} className="animate-pulse-white" />}

        {businesses.map((b) => (
          <Marker key={b.business_id} position={[b.lat, b.lng]} icon={createCustomIcon(selectedBusiness?.business_id === b.business_id)} 
            eventHandlers={{ click: () => {
              const idx = searchResults.findIndex(r => r.business_id === b.business_id);
              if (idx !== -1) { setSelectedBusiness(searchResults[idx]); setCurrentIndex(idx); setShowDirections(false); }
            }}} 
          />
        ))}

        {selectedBusiness?.lat != null && selectedBusiness?.lng != null && (
          <Popup key={`${selectedBusiness.business_id}-${selectedBusiness.item_id}`} position={[selectedBusiness.lat, selectedBusiness.lng]} offset={[0, -20]} closeButton={false} autoClose={false} closeOnClick={false} className="tobli-popup" autoPan={false}>
            <BusinessPopupContent />
          </Popup>
        )}

        {showDirections && routeCoordinates && <Polyline positions={routeCoordinates} pathOptions={{ color: '#6366f1', weight: 4, dashArray: '8, 8' }} className="animate-pulse" />}
      </MapContainer>
    </div>
  );
}
