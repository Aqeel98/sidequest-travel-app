import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { useSideQuest } from '../context/SideQuestContext';
import ClosestQuestsOverlay from '../components/ClosestQuestsOverlay'; 

// Default Center (Colombo)
const SRI_LANKA_CENTER = [6.9271, 79.8612];

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
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
  const [isLocating, setIsLocating] = useState(false); 

  // --- 1. SESSION RESTORE ---
  useEffect(() => {
      const savedLoc = sessionStorage.getItem('sq_last_location');
      if (savedLoc) {
          try { setUserLocation(JSON.parse(savedLoc)); } catch (e) {}
      }
  }, []);

  useEffect(() => {
      if (userLocation) sessionStorage.setItem('sq_last_location', JSON.stringify(userLocation));
  }, [userLocation]);

  // --- 2. ROBUST AUTO-LOCATE (THE FIX) ---
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    // Only auto-locate if we don't have a saved location
    if (userLocation) return;

    let watchId;

    const startWatching = (highAccuracy) => {
        const options = {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 10000 : 20000, // 10s for High, 20s for Low
            maximumAge: 30000 // Accept positions up to 30s old
        };

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                console.log(`SQ-GPS: Location locked (${highAccuracy ? 'High' : 'Low'} Accuracy)`);
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            },
            (err) => {
                console.warn(`SQ-GPS: ${highAccuracy ? 'High' : 'Low'} accuracy failed.`, err.message);
                // IF HIGH ACCURACY FAILS -> FALLBACK TO LOW ACCURACY
                if (highAccuracy) {
                    console.log("SQ-GPS: Switching to Low Accuracy Mode...");
                    navigator.geolocation.clearWatch(watchId);
                    startWatching(false); // <--- RECURSIVE FALLBACK
                }
            },
            options
        );
    };

    // Start by trying High Accuracy
    startWatching(true);

    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []); // Empty dependency array ensures this runs once on mount

  // --- 3. MANUAL LOCATE BUTTON ---
  const handleManualLocate = useCallback(() => {
    if (isLocating) return; 
    setIsLocating(true); 

    if (!navigator.geolocation) { setIsLocating(false); return; }
    
    // Try High Accuracy First
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setIsLocating(false); 
            setShowClosest(true); 
        },
        (err) => {
            console.warn("SQ-GPS: Manual High Accuracy failed, trying Low Accuracy...");
            // FALLBACK TO LOW ACCURACY
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                    setIsLocating(false); 
                    setShowClosest(true);
                },
                (finalErr) => {
                    console.error("SQ-GPS: All attempts failed.");
                    setIsLocating(false); 
                    setShowClosest(true); // Show list based on default center
                },
                { enableHighAccuracy: false, timeout: 10000 }
            );
        },
        { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [isLocating]);

  const sortedQuests = useMemo(() => {
    const center = userLocation || SRI_LANKA_CENTER;
    return quests
      .filter(q => q.lat && q.lng && q.status === 'active') 
      .map(q => ({
        ...q,
        distance: getDistanceKm(center[0], center[1], q.lat, q.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); 
  }, [quests, userLocation]);

  const handleSelectQuest = (quest) => {
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