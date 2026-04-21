import React, { useEffect, useRef } from "react"; 
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { Compass, ExternalLink, Loader2 } from 'lucide-react';
import "leaflet/dist/leaflet.css";

// --- LEAFLET ICON FIXES (Required for Vite/Webpack) ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ 
    iconRetinaUrl: markerIcon2x, 
    iconUrl: markerIcon, 
    shadowUrl: markerShadow 
});

const getCategoryDetails = (category) => {
  switch (category?.trim()) {
      case 'Environmental': return { color: '#064e3b', icon: '/Environmental_.webp', isCustom: true };
      case 'Social': return { color: '#9f1239', icon: '/Social_.webp', isCustom: true };
      case 'Animal Welfare': return { color: '#831843', icon: '/Animal_Welfare.webp', isCustom: true };
      case 'Cultural': return { color: '#4c1d95', icon: '/Cultural.webp', isCustom: true };
      case 'Education': return { color: '#1e3a8a', icon: '/Edu.webp', isCustom: true };
      case 'Adventure': return { color: '#9a3412', icon: '/Adventure.webp', isCustom: true };
      case 'Exploration': return { color: '#854d0e', icon: '/Exploration.webp', isCustom: true };
      case 'Marine Adventure': return { color: '#164e63', icon: '/Marine_Adventure.webp', isCustom: true };
      case 'Wildlife Adventure': return { color: '#365314', icon: '/Wildlife_Adventure.webp', isCustom: true };
      case 'Sports & Recreation': return { color: '#1e293b', icon: '/Sports_&_Recreational_.webp', isCustom: true };
      default: return { color: '#1e293b', emoji: '🎯', isCustom: false };
  }
};

const createQuestIcon = (status, category) => {
  const detail = getCategoryDetails(category);
  let color = detail.color;
  const normalizedCategory = category?.trim();
  const iconSizeByCategory = {
    Environmental: 33,
    Social: 33,
    'Animal Welfare': 37,
    Cultural: 34,
    Education: 33,
    Adventure: 37,
    Exploration: 34,
    'Marine Adventure': 33,
    'Wildlife Adventure': 34,
    'Sports & Recreation': 32,
  };
  
  // FIX: Force the border to be the EXACT same teal for every single pin
  const BRAND_TEAL = '#107870'; 

  if (status === 'approved') {
    color = '#10B981';
  } else if (status === 'pending') {
    color = '#F59E0B';
  }

  // Keep pin size consistent, but tune icon sizes for optical balance per category.
  const iconPixelSize = iconSizeByCategory[normalizedCategory] || 33;
  const iconContent = detail.isCustom 
    ? `<img src="${detail.icon}" style="width: ${iconPixelSize}px; height: ${iconPixelSize}px; object-fit: contain;" />`
    : `<span style="transform: rotate(45deg); display: block; line-height: 1; font-size: 24px;">${detail.emoji}</span>`;

  return L.divIcon({
    className: "gamified-marker",
    html: `<div style="
        background-color: ${color};
        width: 48px; height: 48px; 
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3.5px solid ${BRAND_TEAL}; /* Identical Thick Teal Border */
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
    ">
        <div style="${detail.isCustom ? 'transform: rotate(45deg);' : ''} display: flex; align-items: center; justify-content: center;">
            ${iconContent}
        </div>
    </div>`,
    iconSize: [48, 48], 
    iconAnchor: [24, 48], 
    popupAnchor: [0, -48],
  });
};


const createAvatarIcon = () => {
    return L.divIcon({
        className: "player-avatar-marker",
        // Your Original Red Pulse Avatar
        html: `<div style="background-color: #EF4444; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 12px rgba(239, 68, 68, 0.7); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">YOU</div><div class="pulse-ring"></div>`,
        iconSize: [40, 40], iconAnchor: [20, 20],
    });
};

// --- HELPER TO RE-CENTER MAP (Smooth FlyTo) ---
function RecenterMap({ location }) {
  const map = useMap();
  const hasCentered = useRef(false); 

  useEffect(() => {
      // Only fly to location if we haven't already (prevents jarring jumps)
      if (location && !hasCentered.current) {
          map.flyTo(location, 13, { duration: 2.5, easeLinearity: 0.25 }); 
          hasCentered.current = true;
      }
  }, [location, map]);
  return null;
}

// --- MAIN COMPONENT ---
export function MapView({ quests, questProgress, currentUser, onSelectQuest, setShowClosest, userLocation, onManualLocate, isLocating }) { 
  
  const mapCenter = userLocation || [7.8731, 80.7718]; // Default Center of Sri Lanka

  const getQuestStatus = (questId) => {
    if (!currentUser) return 'available';
    const progress = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
    return progress ? progress.status : 'available';
  };

  return (
    <div className="relative h-full w-full overflow-hidden z-0">
      
      {/* --- FLOATING SEARCH BUTTON (Z-Index Adjusted to 800) --- */}
      {/* --- FIX: MOBILE FLOATING BUTTON --- */}
      {currentUser && (
   <div className="absolute left-4 bottom-[calc(env(safe-area-inset-bottom)+7rem)] md:bottom-6 md:left-56 z-[1100] pointer-events-none">
    <button
       className="pointer-events-auto flex items-center justify-center gap-2 bg-white/95 backdrop-blur-md border border-gray-200 px-4 py-2.5 rounded-full shadow-xl hover:bg-white active:scale-95 transition-all group"
       onClick={(e) => {
          e.stopPropagation(); 
          if (userLocation) { setShowClosest(true); } else { onManualLocate(); }
       }}
    >
            {isLocating ? (
              <Loader2 size={20} className="text-cyan-600 animate-spin" />
            ) : (
              <Compass size={20} className={`text-cyan-600 group-hover:rotate-45 transition-transform duration-500 ${!userLocation ? 'animate-pulse' : ''}`} />
            )}
            <span className="font-bold text-slate-800 text-sm tracking-tight">
              {isLocating ? "Locating..." : "Find Quests"}
            </span>
          </button>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={8} 
        className="h-full w-full z-0"
        zoomControl={false} // We add custom control below
        scrollWheelZoom={true}
        minZoom={7} // Country Level
        maxZoom={18} // Street Level
        attributionControl={false} 
      >
        <TileLayer
           url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
           attribution='&copy; CARTO'
        />
        
        {/* Custom Positioned Zoom Control */}
        <ZoomControl position="bottomright" />

        <RecenterMap location={userLocation} />

        {/* 1. PLAYER MARKER */}
        {userLocation && (
          <Marker position={userLocation} icon={createAvatarIcon()}>
            <Popup>
              <div className="font-bold text-red-500 text-center">Current Location</div>
              <div className="text-xs text-center text-gray-500 mt-1">lat: {userLocation[0].toFixed(4)}, lng: {userLocation[1].toFixed(4)}</div>
            </Popup>
          </Marker>
        )}

        {/* 2. QUEST MARKERS */}
        {quests.filter(q => q.status === 'active').map((quest) => {
          if (!quest.lat || !quest.lng) return null;
          const status = getQuestStatus(quest.id);

          return (
            <Marker
              key={quest.id}
              position={[quest.lat, quest.lng]}
              icon={createQuestIcon(status, quest.category)}

            >
              <Popup maxWidth={280} autoPan={true}>
                <div className="p-1 flex flex-col items-start text-left">
                  
                  {/* Category & XP Badge */}
                  <div className="flex justify-between items-center w-full mb-2 pb-2 border-b border-gray-100">
                    <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap">
                      {quest.category}
                    </span>
                    <span className="text-sm font-extrabold text-brand-600 ml-2">
                      ⭐ {quest.xp_value} XP
                    </span>
                  </div>

                  {/* Title & Address */}
                  <h3 className="font-bold text-lg mb-1 text-gray-900 leading-tight">
                    {quest.title}
                  </h3>
                  <div className="text-xs text-gray-500 mb-3">
                    {quest.location_address}
                  </div>

                  {/* Status Badge */}
                  <div className={`text-xs font-bold mb-3 px-2 py-1 rounded-full ${
                    status === 'approved' ? 'text-emerald-600 bg-emerald-50' : 
                    status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 
                    'text-brand-600 bg-brand-50'
                  }`}>
                     {status.replace('_', ' ').toUpperCase()} 
                  </div>

                  {/* Main Action Button */}
                  <button
                      onClick={() => onSelectQuest(quest)}
                      className="mt-2 w-full bg-brand-500 text-white px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm"
                    >
                      View Quest Details →
                    </button>
                    
                  {/* Google Maps Shortcut */}
                  <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`, '_blank');
                      }}
                      className="w-full mt-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
                    >
                      <ExternalLink size={14} className="mr-2" /> Open in Google Maps
                  </button>
                
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}