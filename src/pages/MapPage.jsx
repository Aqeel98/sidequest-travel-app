import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { useSideQuest } from '../context/SideQuestContext';
import ClosestQuestsOverlay from '../components/ClosestQuestsOverlay'; 

// --- 1. SMOOTH CONFIGURATION ---
// Default Center (Colombo) ensures the map is never empty/gray
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
  
  // State for Smooth UI
  const [showClosest, setShowClosest] = useState(false); 
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false); // Controls the button spinner

  // --- 2. SMOOTH AUTO-LOCATE ENGINE ---
  useEffect(() => {
    if (!navigator.geolocation) return;
  
    // Phase 1: Fast (Low Accuracy) Fix immediately
    navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        null,
        { enableHighAccuracy: false, timeout: 4000 }
    );

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
    if (isLocating) return; // Prevent spam clicking
    setIsLocating(true); // START SPINNER

    if (!navigator.geolocation) {
        setIsLocating(false);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            // Success: Precise location found
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setIsLocating(false); // STOP SPINNER
            setShowClosest(true); // Open List
        },
        (err) => {
            // Error: Fail gracefully (No Alerts!)
            console.error("GPS Error:", err.message);
            setIsLocating(false); // STOP SPINNER
            setShowClosest(true); // Open List anyway (using default location)
        },
        { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [isLocating]);

  // --- 4. PERFORMANCE SORTING ---
  const sortedQuests = useMemo(() => {
    // If we don't have a user location yet, calculate from Colombo
    const center = userLocation || SRI_LANKA_CENTER;
    
    return quests
      .filter(q => q.lat && q.lng && q.status === 'active') 
      .map(q => ({
        ...q,
        distance: getDistanceKm(center[0], center[1], q.lat, q.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Performance: Only render closest 10 to keep scrolling smooth
  }, [quests, userLocation]);

  const handleSelectQuest = (quest) => {
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
        isLocating={isLocating} // Connects to the floating button spinner
      />

      {showClosest && (
        <ClosestQuestsOverlay 
            sortedQuests={sortedQuests} 
            onSelectQuest={(q) => { setShowClosest(false); navigate(`/quest/${q.id}`); }} 
            onClose={() => setShowClosest(false)} 
            locationReady={!!userLocation} // Tells user if distances are Real or Default
        />
      )}
    </div>
  );
};

export default MapPage;