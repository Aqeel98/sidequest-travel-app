import React, { useState, useEffect, useMemo } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { useSideQuest } from '../context/SideQuestContext';
import ClosestQuestsOverlay from '../components/ClosestQuestsOverlay'; 

// Distance calculation helper
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapPage = () => {
  const { quests, questProgress, currentUser } = useSideQuest(); 
  const navigate = useNavigate();
  const [showClosest, setShowClosest] = useState(false); 
  
  // 1. STATE: Track User Location HERE
  const [userLocation, setUserLocation] = useState(null);

  // 2. EFFECT: Get Real GPS Location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }
  
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      // SPEED FIX: Allow a cached position from the last 5 minutes (300,000ms).
      // This makes the blue dot appear INSTANTLY if the phone has moved recently.
      maximumAge: 300000 
    };
  
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        console.log("GPS update received:", pos.coords.accuracy, "meters accuracy");
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        if (err.code === 1) {
          console.warn("User denied Geolocation.");
        } else {
          console.error("GPS Error:", err.message);
        }
      },
      options
    );
  
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // 3. MEMO: Sort Quests based on REAL userLocation
  const sortedQuests = useMemo(() => {
    if (!userLocation) return []; // Return empty if no location yet
    
    return quests
      .filter(q => q.lat && q.lng)
      .map(q => ({
        ...q,
        distance: getDistanceKm(userLocation[0], userLocation[1], q.lat, q.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [quests, userLocation]);

  const handleSelectQuest = (quest) => {
      navigate(`/quest/${quest.id}`);
  };

  const handleClosestQuestSelect = (quest) => {
      setShowClosest(false);
      navigate(`/quest/${quest.id}`);
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full relative">
      <MapView 
        quests={quests} 
        questProgress={questProgress} 
        currentUser={currentUser}     
        onSelectQuest={handleSelectQuest} 
        setShowClosest={setShowClosest}
        userLocation={userLocation} // <--- PASS LOCATION TO MAP
      />

      {/* RENDER OVERLAY HERE */}
      {showClosest && (
        <ClosestQuestsOverlay 
            sortedQuests={sortedQuests} 
            onSelectQuest={handleClosestQuestSelect} 
            onClose={() => setShowClosest(false)} 
        />
      )}
    </div>
  );
};

export default MapPage;