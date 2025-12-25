import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { useSideQuest } from '../context/SideQuestContext';
import ClosestQuestsOverlay from '../components/ClosestQuestsOverlay'; 

// Default Center (Colombo) ensures the map is never empty
const SRI_LANKA_CENTER = [6.9271, 79.8612];

// Accurate Haversine Distance Calculator
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371; // Earth Radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapPage = () => {
  const { quests, questProgress, currentUser } = useSideQuest(); 
  const navigate = useNavigate();
  
  // --- STATE ---
  const [showClosest, setShowClosest] = useState(false); 
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false); 

  // --- 1. SESSION RESTORE LOGIC (Preserve state on "Back") ---
  useEffect(() => {
      const savedLoc = sessionStorage.getItem('sq_last_location');
      if (savedLoc) {
          try {
              const parsed = JSON.parse(savedLoc);
              setUserLocation(parsed);
              console.log("SQ-Map: Restored last known location.");
          } catch (e) { sessionStorage.removeItem('sq_last_location'); }
      }
  }, []);

  // Update session storage whenever location changes
  useEffect(() => {
      if (userLocation) {
          sessionStorage.setItem('sq_last_location', JSON.stringify(userLocation));
      }
  }, [userLocation]);

  // --- 2. SMOOTH AUTO-LOCATE ENGINE ---
  useEffect(() => {
    if (!navigator.geolocation) return;
  
    // Phase 1: Fast (Low Accuracy) Fix immediately (only if we don't have a saved location)
    if (!userLocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            null,
            { enableHighAccuracy: false, timeout: 4000 }
        );
    }

    // Phase 2: Background High Accuracy Watch
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.warn(`GPS Background Update Warning: ${err.message}`),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );
  
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // --- 3. ZERO-LAG MANUAL LOCATE ---
  const handleManualLocate = useCallback(() => {
    if (isLocating) return; 
    setIsLocating(true); 

    if (!navigator.geolocation) {
        setIsLocating(false);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setIsLocating(false); 
            setShowClosest(true); 
        },
        (err) => {
            console.error("GPS Error:", err.message);
            setIsLocating(false); 
            setShowClosest(true); // Open List anyway (using default location)
        },
        { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [isLocating]);

  // --- 4. PERFORMANCE SORTING ---
  const sortedQuests = useMemo(() => {
    const center = userLocation || SRI_LANKA_CENTER;
    
    return quests
      .filter(q => q.lat && q.lng && q.status === 'active') 
      .map(q => ({
        ...q,
        distance: getDistanceKm(center[0], center[1], q.lat, q.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Calculate top 10 for speed
  }, [quests, userLocation]);

  const handleSelectQuest = (quest) => {
      // Save location before navigating away so "Back" works perfectly
      if (userLocation) sessionStorage.setItem('sq_last_location', JSON.stringify(userLocation));
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
        onManualLocate={handleManualLocate}
        isLocating={isLocating} 
      />

      {showClosest && (
        <ClosestQuestsOverlay 
            sortedQuests={sortedQuests} 
            onSelectQuest={(q) => { setShowClosest(false); handleSelectQuest(q); }} 
            onClose={() => setShowClosest(false)} 
            locationReady={!!userLocation} 
        />
      )}
    </div>
  );
};

export default MapPage;