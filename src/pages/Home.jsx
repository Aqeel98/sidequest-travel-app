
import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, ArrowRight, PlusCircle, Search, Crosshair, Loader2
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import SEO from '../components/SEO';
import LandingDecor from '../components/LandingDecor';
import { useAppPreferences } from '../context/AppPreferencesContext';


const QuestSkeleton = () => (
  /* We change bg-white to bg-transparent and remove the flash */
  <div className="rounded-3xl h-[450px] opacity-20">
      <div className="h-64 bg-black/5 rounded-t-3xl"></div>
      <div className="p-6 space-y-3">
          <div className="h-4 bg-black/5 rounded w-1/4"></div>
          <div className="h-6 bg-black/5 rounded w-3/4"></div>
      </div>
  </div>
);

const MAP_CATEGORY_COLORS = {
  Environmental: '#064e3b',
  Social: '#9f1239',
  'Animal Welfare': '#831843',
  Cultural: '#4c1d95',
  Education: '#1e3a8a',
  Adventure: '#9a3412',
  Exploration: '#854d0e',
  'Marine Adventure': '#164e63',
  'Wildlife Adventure': '#365314',
  'Sports & Recreation': '#1e293b',
};

const hexToRgba = (hex, alpha) => {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};



const Home = () => {
  const PRIORITY_QUEST_IMAGE_COUNT = 10;
  const hasRestored = useRef(false);
  const { quests, isLoading, currentUser } = useSideQuest();
  const { t, theme } = useAppPreferences();
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  );
  const activeQuests = quests.filter(quest => quest.status === 'active');
  const [selectedCategory, setSelectedCategory] = useState(
    sessionStorage.getItem('sq_selected_category') || 'All'
);

  const categories = [
      'All',
      'Exploration','Adventure','Marine Adventure','Environmental','Wildlife Adventure',
      'Education', 'Sports & Recreation','Animal Welfare',  'Cultural','Social'
  ];


  const [searchQuery, setSearchQuery] = useState(
    sessionStorage.getItem('sq_home_search') || ""
);
  const [userLoc, setUserLoc] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const findClosest = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setIsLocating(false);
            // Auto-scroll to results after locating
            document.getElementById('quests-grid').scrollIntoView({ behavior: 'smooth' });
        },
        () => {
            alert("Please enable GPS to find nearest quests.");
            setIsLocating(false);
        },
        { enableHighAccuracy: true }
    );
  };



  // Wrapper to save position before leaving
  const handleQuestClick = (questId) => {
    const questSequence = displayQuests.map(q => q.id);
    sessionStorage.setItem('sq_quest_sequence', JSON.stringify(questSequence));
    sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
    sessionStorage.setItem('sq_selected_category', selectedCategory);
    sessionStorage.setItem('sq_home_search', searchQuery);
    navigate(`/quest/${questId}`);
};


  // Filter & Sort Logic
  const displayQuests = activeQuests
  .filter(q => {
      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
      const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           q.location_address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  })
  .sort((a, b) => {
      if (userLoc) {
          const dA = calculateDistance(userLoc.lat, userLoc.lng, a.lat, a.lng);
          const dB = calculateDistance(userLoc.lat, userLoc.lng, b.lat, b.lng);
          return dA - dB;
      }
      return (b.xp_value || 0) - (a.xp_value || 0);
  });


      // --- SCROLL RESTORATION LOGIC ---

      useLayoutEffect(() => {
        if (!isLoading && displayQuests.length > 0 && !hasRestored.current) {
          const savedPosition = sessionStorage.getItem('homeScrollPos');
          if (savedPosition) {
            requestAnimationFrame(() => {
              window.scrollTo({ top: parseInt(savedPosition), behavior: 'instant' });
            });
          }
          hasRestored.current = true;
        }
      }, [displayQuests.length, isLoading]);


  



  return (

    <div className={`pb-12 min-h-screen relative overflow-hidden ${theme === 'dark' ? 'bg-[#4F452B]' : 'bg-[#E6D5B8]'}`}>
      <SEO description="Discover meaningful quests across Sri Lanka. Join the community, complete impactful quests, and earn rewards." />

      {/* --- AESTHETIC HEADER START --- */}


      <div className={`relative overflow-hidden ${theme === 'dark' ? 'bg-[#0b5252]' : 'bg-brand-600'}`}>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute inset-0 overflow-hidden"><LandingDecor viewportWidth={viewportWidth} /></div>
        </div>

        {/* Content Section: 2. CHANGED pb-24 to pb-32 */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-32 pb-64 md:pb-80 lg:pb-96 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-medium mb-6 animate-fade-in-up">
            <span>{t('travelerTag')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 tracking-tight leading-[1.1]">
                               Adventure with <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white">
                                Impact
          </span>
            </h1>

             {/* Limit width of paragraph to max-w-2xl on desktop */}
       <p className="text-lg md:text-xl lg:text-2xl text-teal-50 mb-12 max-w-2xl mx-auto font-light leading-relaxed opacity-90">
           <span className="block mb-2 font-bold">
                     Don't just visit. Connect.
             </span>
              <span className="block">
              Complete quests, earn rewards, and leave the island better than you found it.
               </span>
            </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('quests-grid').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-brand-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-white/20 transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
              Explore Quests
            </button>
            <button
              onClick={() => navigate('/map')}
              className="bg-brand-700/50 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-700/70 transition-all flex items-center justify-center"
            >
              View Map <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>

     {/* --- THE EXPANDED BEACH (Stable Version with Ghost Wave) --- */}
<div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none overflow-hidden">
  {/* 1. TALLER SAND BASE */}
  <div className={`absolute bottom-0 left-0 w-full h-[150px] md:h-[250px] lg:h-[320px] ${theme === 'dark' ? 'bg-[#4F452B]' : 'bg-[#E6D5B8]'}`}></div>

  <svg
    className="relative -mt-px block w-[210%] h-[150px] md:h-[250px] lg:h-[320px]"
    viewBox="0 0 1200 320"
    preserveAspectRatio="none"
  >

    {/* 2. GHOST WAVE (Added as requested - Sits behind main foam) */}
    <path
      d="M0,0 L1200,0 L1200,130 C900,180 600,90 300,160 L0,120 Z"
      className={`animate-wave-roll ${theme === 'dark' ? 'fill-[#3f6f74]' : 'fill-white/30'}`}
      style={{ animationDuration: '15s', animationDelay: '-5s' }}
    ></path>

    {/* 3. WHITE FOAM */}
    <path
      d="M0,0 L1200,0 L1200,120 C900,160 600,80 300,140 L0,100 Z"
      className={`animate-wave-roll ${theme === 'dark' ? 'fill-[#73a6ad]' : 'fill-white'}`}
      style={{ animationDuration: '10s', animationDelay: '-2s' }}
    ></path>

    {/* 4. TURQUOISE WATER (Matched to Header) */}
    <path
      d="M0,0 L1200,0 L1200,100 C900,140 600,60 300,120 L0,80 Z"
      className={`animate-wave-roll ${theme === 'dark' ? 'fill-[#0b5252]' : 'fill-brand-600'}`}
      style={{ animationDuration: '10s' }}
    ></path>
  </svg>

</div>
            </div>

      {/* --- AESTHETIC HEADER END --- */}

      {/* Quest Grid */}
      <div id="quests-grid" className="max-w-7xl mx-auto px-4 mt-20 relative z-10">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-cyan-50' : 'text-gray-900'}`}>Available Quests</h2>

          </div>
          <button onClick={() => navigate('/map')} className={`hidden md:block font-bold hover:underline ${theme === 'dark' ? 'text-brand-300' : 'text-brand-600'}`}>View All on Map</button>
        </div>




        <div className="flex flex-col gap-3 mb-8">
    {/* 1. The Search Input */}
    <div className="relative w-full group">
        <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-[#D8C29B]/80 group-focus-within:text-[#F4E8D0]' : 'text-gray-400 group-focus-within:text-brand-600'}`}
            size={20}
        />
        <input
            type="text"
            placeholder="Search by name or location..."
            className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl shadow-sm outline-none font-semibold transition-all ${theme === 'dark' ? 'bg-[#6A5738] text-[#F4E8D0] placeholder:text-[#D8C29B]/80 border-[#9F855A] focus:border-[#D1BA8E]' : 'bg-white border-transparent focus:border-brand-500/30 text-gray-700 placeholder:text-gray-400'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
    </div>
        <button
            onClick={findClosest}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black active:scale-[0.98] transition-all disabled:opacity-70 ${
              theme === 'dark'
                ? 'bg-[#0f5c5c] hover:bg-[#125f5f] text-cyan-50 shadow-[0_0_14px_rgba(20,184,166,0.22)]'
                : 'bg-brand-600 text-white shadow-lg shadow-brand-200'
            }`}        >
            {isLocating ? <Loader2 className="animate-spin" size={20}/> : <Crosshair size={20}/>}
            {isLocating ? 'Locating...' : 'Find Closest'}
        </button>
    </div>


          {/* NEW: Partner Quick-Add Floating Button */}
    {/* Only visible to Partners/Admins */}
    {(currentUser?.role === 'Partner' || currentUser?.role === 'Admin') && (
      <button
        onClick={() => navigate('/partner')}
        // Z-Index 100 ensures it is above the background but below the Install Banner (1400)
        className={`fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[100] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform border-4 border-white/50 backdrop-blur ${
          theme === 'dark' ? 'bg-[#0f5c5c] active:bg-[#125f5f]' : 'bg-brand-600 active:bg-brand-700'
        }`}
        title="Quick Add Quest"
      >
        <PlusCircle size={32} />
      </button>
    )}


        {/* --- CATEGORY FILTER BUTTONS --- */}
        <div data-nosnippet className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      sessionStorage.setItem('sq_selected_category', cat);
                  }}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                        selectedCategory === cat
                        ? (theme === 'dark'
                            ? 'bg-[#0a4444] text-cyan-50 border-[#1e6b6b] shadow-[0_0_12px_rgba(15,92,92,0.34)] transform scale-105'
                            : 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105')
                        : (theme === 'dark'
                            ? 'bg-[#7A6A47] text-[#F1E6CD] border-[#A88D62] hover:bg-[#8A7851] hover:border-[#B69B6F]'
                            : 'bg-white text-gray-500 border-transparent hover:bg-gray-50 hover:border-gray-200')
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* --- THE GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* 1. LOADING STATE: Shown ONLY if we have zero data in cache */}
            {isLoading && displayQuests.length === 0 && (
                <>
                    <QuestSkeleton /><QuestSkeleton /><QuestSkeleton />
                    <QuestSkeleton /><QuestSkeleton /><QuestSkeleton />
                </>
            )}

            {/* 2. DATA STATE */}

            {displayQuests.map((quest, index) => (
                <div
                key={quest.id}
                onClick={() => handleQuestClick(quest.id)}
                className={`group backdrop-blur-md rounded-3xl shadow-sm overflow-hidden cursor-pointer h-[450px] border ${
                  theme === 'dark'
                    ? 'bg-[#6A5738] border-[#9F855A]'
                    : 'bg-white/80 border-white/50'
                }`}
                style={{
                    contentVisibility: 'auto', // Browser keeps the pixels ready
                    containIntrinsicSize: '450px', // Prevents layout jumping
                }}
            >
                    {/* Image Section */}
                    <div className={`relative h-64 overflow-hidden ${theme === 'dark' ? 'bg-[#4F452B]' : 'bg-[#D9C9A8]'}`} onContextMenu={(e) => e.preventDefault()}>
                        <img
                            src={quest.image || "https://via.placeholder.com/600x400/CCCCCC/808080?text=SideQuest+Image+Missing"}
                            alt={quest.title}
                            loading={index < PRIORITY_QUEST_IMAGE_COUNT ? "eager" : "lazy"}
                            fetchpriority={index < PRIORITY_QUEST_IMAGE_COUNT ? "high" : "low"}
                            decoding="async"
                            draggable="false"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            style={{
                              backgroundColor: theme === 'dark' ? '#4F452B' : '#D9C9A8',
                              transform: 'translateZ(0)',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              contentVisibility: 'auto'
                          }}
                        />

                        {/* Transparent Shield */}
                        <div className="absolute inset-0 z-10"></div>

                        <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                          theme === 'dark'
                            ? 'bg-[#8A724C]/95 text-[#F4E8D0] border border-[#B89B6A]'
                            : 'bg-white/90 text-brand-600'
                        }`}>
                            ⭐ {quest.xp_value} XP
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            {(() => {
                              const categoryColor = MAP_CATEGORY_COLORS[quest.category] || '#1e293b';
                              const isDarkTheme = theme === 'dark';
                              return (
                            <span
                              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                              style={{
                                backgroundColor: isDarkTheme ? hexToRgba(categoryColor, 0.32) : hexToRgba(categoryColor, 0.09),
                                color: isDarkTheme ? '#f8fafc' : categoryColor,
                                borderColor: isDarkTheme ? hexToRgba(categoryColor, 0.45) : hexToRgba(categoryColor, 0.14),
                              }}
                            >
                                {quest.category}
                            </span>
                              );
                            })()}
                        </div>

                        <h3 className={`font-bold text-xl mb-2 transition-colors ${
                          theme === 'dark' ? 'text-[#F4E8D0] group-hover:text-[#FFF4DE]' : 'text-gray-900 group-hover:text-brand-600'
                        }`}>
                            {quest.title}
                        </h3>

                        <div className={`flex items-center text-sm mt-4 ${theme === 'dark' ? 'text-[#E7D7B9]/90' : 'text-gray-500'}`}>
                            <MapPin size={16} className={`mr-1.5 ${theme === 'dark' ? 'text-[#D8C29B]/80' : 'text-gray-400'}`} />
                            {quest.location_address}
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default Home;