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

// --- CUSTOM ICONS (Your Original Colors) ---
// --- NEW HELPER: CATEGORY COLORS & EMOJIS ---
const getCategoryDetails = (category) => {
  switch (category) {
      // Existing
      case 'Environmental': return { color: '#10b981', emoji: '🌿' }; // Emerald
      case 'Social': return { color: '#f43f5e', emoji: '❤️' }; // Rose
      case 'Animal Welfare': return { color: '#ec4899', emoji: '🐾' }; // Pink
      case 'Cultural': return { color: '#8b5cf6', emoji: '🏯' }; // Violet (Moved here to look mystical)
      case 'Education': return { color: '#3b82f6', emoji: '📚' }; // Blue
      
      // --- NEW (High Contrast) ---
      case 'Adventure': return { color: '#ef4444', emoji: '🧗' }; // RED (High Energy)
      case 'Exploration': return { color: '#eab308', emoji: '🧭' }; // GOLD (Discovery)
      case 'Marine Adventure': return { color: '#06b6d4', emoji: '🤿' }; // CYAN (Water)
      case 'Wildlife Adventure': return { color: '#84cc16', emoji: '🐘' }; // LIME (Jungle)
      
      default: return { color: '#f97316', emoji: '🎯' }; // Orange
  }
};

const createQuestIcon = (status, category) => {
// 1. Get Base Category Style
let { color, emoji } = getCategoryDetails(category);

// 2. Override if Completed or Pending
if (status === 'approved') {
    color = '#10B981'; // Emerald Green
    emoji = '🏆';
} else if (status === 'pending') {
    color = '#F59E0B'; // Amber
    emoji = '⏳';
}

// 3. Return Leaflet Icon
return L.divIcon({
  className: "gamified-marker",
  html: `<div style="
      background-color: ${color};
      width: 36px; height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
  ">
      <span style="transform: rotate(45deg); display: block; line-height: 1;">${emoji}</span>
  </div>`,
  iconSize: [36, 36], 
  iconAnchor: [18, 36], 
  popupAnchor: [0, -36],
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
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1050] w-full max-w-[280px] px-4 pointer-events-none">
          <button
            onClick={(e) => {
               // CHANGE 1: Stop the map from stealing the click
               e.stopPropagation(); 
               
               if (userLocation) {
                   setShowClosest(true);
               } else {
                   onManualLocate(); 
               }
            }}
            // CHANGE 2: Z-Index above was increased to 1050
            className="pointer-events-auto w-full flex items-center justify-center gap-3 bg-white/90 backdrop-blur-md border border-white/20 px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            {isLocating ? (
              <Loader2 size={20} className="text-cyan-600 animate-spin" />
            ) : (
              <Compass size={20} className={`text-cyan-600 group-hover:rotate-45 transition-transform duration-500 ${!userLocation ? 'animate-pulse' : ''}`} />
            )}
            <span className="font-bold text-slate-800 text-sm tracking-tight">
              {isLocating ? "Locating..." : "Find Nearest Quests"}
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