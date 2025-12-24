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

  // 1. AUTO-LOCATE (The background engine)
  useEffect(() => {
    if (!navigator.geolocation) return;
  
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // Use cache for speed
    };
  
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.log("Auto-locate waiting for user interaction..."),
      options
    );
  
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // 2. MANUAL LOCATE (Forces the browser permission popup)
  const handleManualLocate = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setShowClosest(true); // Open the list immediately after finding them
        },
        (err) => {
            alert("Location access denied. Please enable GPS in your browser settings to find quests near you.");
        },
        { enableHighAccuracy: true }
    );
  };

  // 3. SORTING LOGIC
  const sortedQuests = useMemo(() => {
    if (!userLocation) return [];
    
    return quests
      .filter(q => q.lat && q.lng && q.status === 'active') // Only show active quests in nearest list
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
        onManualLocate={handleManualLocate} // <--- PASS THE FIX HERE
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