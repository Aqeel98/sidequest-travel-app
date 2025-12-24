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
  const [userLocation, setUserLocation] = useState(null);

  // --- FIX 1: AUTO-LOCATE TIMEOUT INCREASED ---
  // Increased timeout to 30s to prevent "Timeout expired" error on slow networks/devices
  useEffect(() => {
    if (!navigator.geolocation) return;
  
    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // FIX: Increased from 15000 to 30000
      maximumAge: 300000 
    };
  
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        // console.log("SQ-GPS: Auto-location updated."); // Optional debug
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.warn(`SQ-GPS Background Warning: ${err.message}`),
      options
    );
  
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // --- FIX 2: ROBUST MANUAL LOCATE FUNCTION ---
  // This function is now guaranteed to exist and handle errors gracefully
  const handleManualLocate = () => {
    console.log("SQ-System: Manual locate triggered by user."); // DEBUG LOG

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
    }
    
    // Explicit options for the manual click
    const manualOptions = {
        enableHighAccuracy: true,
        timeout: 20000, // FIX: Force a 20s wait before failing
        maximumAge: 0   // FIX: Force a fresh reading (don't use cache)
    };

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            console.log("SQ-System: Location found manually.");
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setShowClosest(true); 
        },
        (err) => {
            console.error("SQ-GPS Error:", err.message);
            alert("Could not get your location. Please ensure GPS is enabled.");
        },
        manualOptions // Pass the fixed options
    );
  };

  // 3. SORTING LOGIC
  const sortedQuests = useMemo(() => {
    if (!userLocation) return [];
    
    return quests
      .filter(q => q.lat && q.lng && q.status === 'active') 
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
        userLocation={userLocation}
        onManualLocate={handleManualLocate} // This is the prop that was causing "f is not a function"
      />

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