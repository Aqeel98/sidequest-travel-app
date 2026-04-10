import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { useSideQuest } from '../context/SideQuestContext';
import ClosestQuestsOverlay from '../components/ClosestQuestsOverlay';
import SEO from '../components/SEO';

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

const CATEGORY_CONFIG = {
  'All': { color: '#334155', icon: '🗺️' },
  'Exploration': { color: '#854d0e', icon: '🧭' }, 
  'Adventure': { color: '#9a3412', icon: '🧗' }, 
  'Marine Adventure': { color: '#164e63', icon: '🤿' }, 
  'Environmental': { color: '#064e3b', icon: '🌿' }, 
  'Wildlife Adventure': { color: '#365314', icon: '🐾' }, 
  'Education': { color: '#1e3a8a', icon: '📚' }, 
  'Sports & Recreation': { color: '#1e293b', icon: '⚽' }, 
  'Animal Welfare': { color: '#831843', icon: '🐘' }, 
  'Cultural': { color: '#4c1d95', icon: '🏯' }, 
  'Social': { color: '#881337', icon: '❤️' }
};


const MapPage = () => {
  const { quests, questProgress, currentUser, setShowAuthModal, showToast, optimizeImage } = useSideQuest();
  const navigate = useNavigate();

  const [showClosest, setShowClosest] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ quest_name: '', description: '', maps_link: '' });
  const [suggestImage, setSuggestImage] = useState(null);
  const [suggestPreview, setSuggestPreview] = useState(null);
  const [isSuggestSubmitting, setIsSuggestSubmitting] = useState(false);
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredQuests = useMemo(() => {
    return quests.filter(q => 
      q.status === 'active' && 
      (selectedCategory === 'All' || q.category === selectedCategory)
    );
  }, [quests, selectedCategory]);
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
      <SEO title="Explore Quests Map" description="View all available SideQuests on the map. Find adventures near you." />

      <div className="absolute top-2 left-0 right-0 z-[1050] px-2 pointer-events-none">
      <div className="max-w-screen-xl mx-auto relative">
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1a1a1a] to-transparent z-20 pointer-events-none"></div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide pointer-events-auto snap-x relative z-10">
            {Object.entries(CATEGORY_CONFIG).map(([name, config]) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 whitespace-nowrap snap-start shadow-2xl
                  ${selectedCategory === name 
                    ? 'scale-105 border-white/30 brightness-110' 
                    : 'bg-black/40 backdrop-blur-md border-white/10 opacity-80 hover:opacity-100'}
                `}
                style={{ 
                  backgroundColor: selectedCategory === name ? config.color : '',
                  color: 'white'
                }}
              >
                <span className="text-base drop-shadow-md">{config.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>



      <MapView
        quests={filteredQuests}
        questProgress={questProgress}
        currentUser={currentUser}
        onSelectQuest={handleSelectQuest}
        setShowClosest={setShowClosest}
        userLocation={userLocation}
        onManualLocate={handleManualLocate}
        isLocating={isLocating}
      />

      {/* --- SUGGEST A QUEST BUTTON --- */}
      <div className="absolute bottom-12 left-4 z-[1100]">
        <button
          onClick={() => {
            if (!currentUser) { setShowAuthModal(true); return; }
            setShowSuggestModal(true);
            setSuggestSuccess(false);
            setSuggestForm({ quest_name: '', description: '', maps_link: '' });
            setSuggestImage(null);
            setSuggestPreview(null);
          }}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-white/20 px-5 py-3 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300"
          style={{ color: '#107870' }}
        >
          <span className="text-lg">📍</span>
          <span className="font-bold text-sm tracking-tight">Suggest a Quest</span>
        </button>
      </div>

      {/* --- SUGGEST A QUEST MODAL --- */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1200] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in duration-300">

            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Suggest a Quest</h2>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Help grow the SideQuest map. Earn 50 XP if approved.</p>
                </div>
                <button
                  onClick={() => setShowSuggestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {suggestSuccess ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Quest Suggestion Submitted!</h3>
                <p className="text-gray-500 text-sm mb-6">Game Masters will review your suggestion. You'll earn 50 XP if it gets approved.</p>
                <button
                  onClick={() => setShowSuggestModal(false)}
                  className="w-full text-white py-3 rounded-2xl font-bold transition-all"
                  style={{ backgroundColor: '#107870' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                {/* Quest Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Quest Name *</label>
                  <input
                    type="text"
                    value={suggestForm.quest_name}
                    onChange={e => setSuggestForm(p => ({ ...p, quest_name: e.target.value }))}
                    placeholder="e.g. Hidden waterfall near Ella"
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none transition-all text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Description *</label>
                  <textarea
                    value={suggestForm.description}
                    onChange={e => setSuggestForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the location and why it would make a great quest..."
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none transition-all text-sm resize-none"
                    rows="3"
                  />
                </div>

                {/* Google Maps Link */}
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                 Google Maps Link
               </label>
    
           <div className="flex gap-2">
            <input 
            type="url" 
            value={suggestForm.maps_link}
            onChange={e => setSuggestForm(p => ({ ...p, maps_link: e.target.value }))}
            placeholder="Paste Link here..."
            className="flex-1 border-2 border-gray-100 p-3 rounded-xl focus:border-brand-500 outline-none transition-all text-sm"
            />
            <button 
            type="button"
            onClick={() => window.open('https://www.google.com/maps', '_blank')}
            className="bg-gray-50 border-2 border-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm whitespace-nowrap"
              >
            Open Maps 📍
              </button>
           </div>
             <p className="text-[10px] text-gray-400 mt-2 italic leading-tight">
              Click "Open Maps", find the spot, select "Share", and copy the link here.
                  </p>
              </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Photo</label>
                  <div className="flex items-center gap-4">
                    {suggestPreview ? (
                      <img src={suggestPreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl">📷</div>
                    )}
                    <label className="cursor-pointer bg-gray-50 border-2 border-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all">
                      {suggestImage ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setSuggestImage(file);
                          setSuggestPreview(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  // --- IMMORTAL SUBMISSION INTERCEPTOR ---
              onClick={async () => {
             if (!suggestForm.quest_name || !suggestForm.description) {
              showToast("Please fill in quest name and description.", 'error');
            return;
           }
  
           setIsSuggestSubmitting(true);
           showToast("Saving to device memory...", "info");

         try {
         let imageString = null;
         if (suggestImage) {
          // 1. Shrink the image locally first
          const optimizedFile = await optimizeImage(suggestImage);
          
          // 2. Convert to string for storage
          imageString = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(optimizedFile);
          });
       }

      // 3. Save everything to localStorage
      const payload = {
          form: suggestForm,
          imageString,
          type: 'auto_suggestion'
      };
      localStorage.setItem('sq_pending_suggestion', JSON.stringify(payload));

      // 4. THE PURGE: Refresh the page to kill "Zombie Sockets"
      window.location.reload();

         } catch (err) {
      console.error("SQ-Submit-Error:", err);
      showToast("Device busy. Try again.", 'error');
      setIsSuggestSubmitting(false);
        }
          }}
                  disabled={isSuggestSubmitting}
                  className={`w-full text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg ${isSuggestSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  style={{ backgroundColor: '#107870' }}
                >
                  {isSuggestSubmitting ? 'Submitting...' : 'Submit Quest Suggestion 📍'}
                </button>

              </div>
            )}
          </div>
        </div>
      )}


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