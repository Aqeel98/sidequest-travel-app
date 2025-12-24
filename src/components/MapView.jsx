import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import { Compass, ExternalLink } from 'lucide-react';
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// --- ICONS ---
const createQuestIcon = (status) => {
  const colors = { 'available': '#14b8a6', 'in_progress': '#3B82F6', 'pending': '#F59E0B', 'approved': '#10B981', 'default': '#737373' };
  const color = colors[status] || colors.default;
  const iconHtml = status === 'pending' ? '⏳' : status === 'approved' ? '🏆' : '🎯';
  return L.divIcon({
    className: "gamified-marker",
    html: `<div style="background-color:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,.3);font-size:16px;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg); display:block; height:100%; color:white;">${iconHtml}</span></div>`,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
  });
};

const createAvatarIcon = () => {
    return L.divIcon({
        className: "player-avatar-marker",
        html: `<div style="background-color: #EF4444; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 12px rgba(239, 68, 68, 0.7); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">YOU</div><div class="pulse-ring"></div>`,
        iconSize: [40, 40], iconAnchor: [20, 20],
    });
};

// --- COMPONENT TO RE-CENTER MAP ---
// This handles the "Zoom" when location is found
function RecenterMap({ location }) {
  const map = useMap();
  const hasCentered = React.useRef(false);

  useEffect(() => {
      // Change 13 to 11. This gives a wider view (District level) instead of Street level.
      if (location && !hasCentered.current) {
          map.flyTo(location, 11, { duration: 2 }); 
          hasCentered.current = true;
      }
  }, [location, map]);
  return null;
}

// --- MAIN COMPONENT ---
export function MapView({ quests, questProgress, currentUser, onSelectQuest, setShowClosest, userLocation }) { 
  
  // Default center (Sri Lanka) if no user location yet
  const mapCenter = userLocation || [7.8731, 80.7718];

  const getQuestStatus = (questId) => {
    if (!currentUser) return 'available';
    const progress = questProgress.find(p => p.quest_id === questId && p.traveler_id === currentUser.id);
    if (progress) return progress.status;
    return 'available';
  };

  return (
    <div className="relative h-full w-full overflow-hidden z-0">
      
      {/* Floating CTA */}
      {currentUser && (
        <button
        onClick={() => {
          if (userLocation) {
              setShowClosest(true);
          } else {
              // THIS COMMAND forces the browser to show the "Allow Location" popup
              onManualLocate(); 
          }
       }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]
                     bg-brand-500 text-white px-6 py-3 rounded-full
                     font-bold shadow-xl hover:bg-brand-600 transition flex items-center"
        >
          <Compass size={20} className="mr-2" /> Find Nearest Quests
        </button>
      )}

<MapContainer
  center={mapCenter}
  zoom={9} 
  className="h-full w-full"
  scrollWheelZoom={true} // Allow mouse scroll
  touchZoom={true}       // Allow pinch-to-zoom on mobile
  dragging={true}        // Allow panning
  minZoom={7}            // FIX: Allows zooming out to see the whole island
  maxZoom={18}           // Allows zooming in closely
>
        <TileLayer
           // Switched to a reliable, free dark tile from CARTO
           url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Auto-Zoom when location is found */}
        <RecenterMap location={userLocation} />

        {/* Player Avatar Marker (Red Dot) */}
        {userLocation && (
          <Marker position={userLocation} icon={createAvatarIcon()}>
            <Popup>
              <div className="font-bold text-red-500">Your Current Location</div>
              <div className="text-sm">⭐ {currentUser?.xp || 0} XP</div>
            </Popup>
          </Marker>
        )}

        {/* Quest Markers */}
        {quests.map((quest) => {
          if (!quest.lat || !quest.lng) return null;
          const status = getQuestStatus(quest.id);

          return (
            <Marker
              key={quest.id}
              position={[quest.lat, quest.lng]}
              icon={createQuestIcon(status)}
              // Click event handlers remain the same
            >
              {/* Tooltip component has been REMOVED (Suggestion: 1 box only) */}

              <Popup maxWidth={280}>
                <div className="p-1 flex flex-col items-start">
                  
                  {/* --- TOP SECTION (XP & Category) --- */}
                  <div className="flex justify-between items-center w-full mb-2 pb-2 border-b border-gray-100">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      quest.category === 'Environmental' ? 'bg-emerald-100 text-emerald-700' :
                      quest.category === 'Social' ? 'bg-blue-100 text-blue-700' :
                      quest.category === 'Education' ? 'bg-indigo-100 text-indigo-700' :
                      quest.category === 'Animal Welfare' ? 'bg-pink-100 text-pink-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {quest.category}
                    </span>
                    <span className="text-sm font-extrabold text-brand-600">
                      ⭐ {quest.xp_value} XP
                    </span>
                  </div>

                  {/* --- TITLE & LOCATION --- */}
                  <h3 className="font-bold text-lg mb-1 text-gray-900">{quest.title}</h3>
                  <div className="text-xs text-gray-500 mb-3">{quest.location_address}</div>
                  
                  

                  {/* --- STATUS --- */}
                  <div className={`text-xs font-bold mb-3 p-1 rounded ${status === 'approved' ? 'text-emerald-600 bg-emerald-50' : status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 'text-brand-600 bg-brand-50'}`}>
                     STATUS: {status.replace('_', ' ').toUpperCase()} 
                  </div>

                  {/* --- ACTION BUTTON --- */}
                  <button
                      onClick={() => onSelectQuest(quest)}
                      className="mt-2 w-full bg-brand-500 text-white px-3 py-2 rounded text-sm font-bold flex items-center justify-center hover:bg-brand-600 transition-colors"
                    >
                      View Quest Details →
                    </button>
                    {/* --- GOOGLE MAPS BUTTON (NEW) --- */}
                  <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent map click interference
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`, '_blank');
                      }}
                      className="w-full mb-2 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors border border-blue-200"
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