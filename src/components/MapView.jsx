import React, { useEffect, useRef } from "react"; 
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { ExternalLink } from 'lucide-react';
import { useAppPreferences } from '../context/AppPreferencesContext';
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
      default: return { color: '#1e293b', isCustom: false };
  }
};

const createQuestIcon = (status, category) => {
  const detail = getCategoryDetails(category);
  const color = detail.color;
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

  const statusRingColor = status === 'approved'
    ? '#10B981'
    : status === 'pending'
      ? '#F59E0B'
      : null;
  const statusRingShadow = statusRingColor
    ? `, 0 0 0 3px ${statusRingColor}, 0 0 14px ${statusRingColor}55`
    : '';

  // Keep pin size consistent, but tune icon sizes for optical balance per category.
  const iconPixelSize = iconSizeByCategory[normalizedCategory] || 33;
  const iconContent = detail.isCustom 
    ? `<img src="${detail.icon}" style="width: ${iconPixelSize}px; height: ${iconPixelSize}px; object-fit: contain;" />`
    : '';

  return L.divIcon({
    className: "gamified-marker",
    html: `<div style="
        background-color: ${color};
        width: 48px; height: 48px; 
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3.5px solid ${BRAND_TEAL}; /* Identical Thick Teal Border */
        box-shadow: 0 6px 16px rgba(0,0,0,0.4)${statusRingShadow};
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
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';
  
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
   <div className="absolute right-4 bottom-[calc(env(safe-area-inset-bottom)+2.75rem)] md:bottom-6 md:left-[16rem] md:right-auto z-[900] pointer-events-none">
    <button
       className={`pointer-events-auto w-44 sm:w-52 flex items-center justify-center backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all duration-300 ${
        isDark
          ? 'bg-[#0d4b4b]/95 border border-cyan-900/60 text-cyan-50 hover:bg-[#0f5c5c]'
          : 'bg-white/90 border border-white/20 text-[#107870] hover:bg-white'
       }`}
       onClick={(e) => {
          e.stopPropagation(); 
          if (userLocation) { setShowClosest(true); } else { onManualLocate(); }
       }}
    >
            <span className="font-bold text-sm tracking-tight">{isLocating ? "Locating..." : "Find Quest"}</span>
          </button>
        </div>

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
              <div className={`text-xs text-center mt-1 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>lat: {userLocation[0].toFixed(4)}, lng: {userLocation[1].toFixed(4)}</div>
            </Popup>
          </Marker>
        )}

        {/* 2. QUEST MARKERS */}
        {quests.filter(q => q.status === 'active').map((quest) => {
          if (!quest.lat || !quest.lng) return null;
          const status = getQuestStatus(quest.id);
          const categoryColor = getCategoryDetails(quest.category).color;

          return (
            <Marker
              key={quest.id}
              position={[quest.lat, quest.lng]}
              icon={createQuestIcon(status, quest.category)}

            >
              <Popup maxWidth={280} autoPan={true}>
                <div className="p-1 flex flex-col items-start text-left">
                  
                  {/* Category & XP Badge */}
                  <div className={`flex justify-between items-center w-full mb-2 pb-2 border-b ${isDark ? 'border-cyan-900/60' : 'border-gray-100'}`}>
                    <span
                      className="px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap text-white"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {quest.category}
                    </span>
                    <span className={`text-sm font-extrabold ml-2 ${isDark ? 'text-cyan-100' : 'text-brand-600'}`}>
                      ⭐ {quest.xp_value} XP
                    </span>
                  </div>

                  {/* Title & Address */}
                  <h3 className={`font-bold text-lg mb-1 leading-tight ${isDark ? 'text-cyan-50' : 'text-gray-900'}`}>
                    {quest.title}
                  </h3>
                  <div className={`text-xs mb-3 ${isDark ? 'text-cyan-200/80' : 'text-gray-500'}`}>
                    {quest.location_address}
                  </div>

                  {/* Main Action Button */}
                  <button
                      onClick={() => onSelectQuest(quest)}
                      className={`mt-2 w-full text-white px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-colors shadow-sm ${isDark ? 'bg-[#0f5c5c] hover:bg-[#125f5f] border border-cyan-700' : 'bg-brand-500 hover:bg-brand-600'}`}
                    >
                      View Quest Details →
                    </button>
                    
                  {/* Google Maps Shortcut */}
                  <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`, '_blank');
                      }}
                      className={`w-full mt-2 px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center transition-colors border shadow-sm ${isDark ? 'bg-[#0a3a3a] text-cyan-100 hover:bg-[#0f5c5c] border-cyan-900/60' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'}`}
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