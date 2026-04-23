
import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, ArrowRight, PlusCircle, Search, Crosshair, Loader2
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import SEO from '../components/SEO';
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

const ICON_SOURCES = [
  '/landing-icons-opt/Anchor_1.webp',
  '/landing-icons-opt/Anchor_2.webp',
  '/landing-icons-opt/Anchor_3.webp',
  '/landing-icons-opt/Boat_1.webp',
  '/landing-icons-opt/Boat_2.webp',
  '/landing-icons-opt/Boat_3.webp',
  '/landing-icons-opt/Bottle.webp',
  '/landing-icons-opt/Coral_1.webp',
  '/landing-icons-opt/Coral_2.webp',
  '/landing-icons-opt/Fish_1.webp',
  '/landing-icons-opt/Fish_2.webp',
  '/landing-icons-opt/Fish_3.webp',
  '/landing-icons-opt/Goggle_1.webp',
  '/landing-icons-opt/Goggle_2.webp',
  '/landing-icons-opt/Hook_1.webp',
  '/landing-icons-opt/Hook_2.webp',
  '/landing-icons-opt/Lifeboat_1.webp',
  '/landing-icons-opt/Lifeboat_2.webp',
  '/landing-icons-opt/Octopus_.webp',
  '/landing-icons-opt/Pearl.webp',
  '/landing-icons-opt/Pearl_2.webp',
  '/landing-icons-opt/Starfish.webp',
  '/landing-icons-opt/Surf_1.webp',
  '/landing-icons-opt/Surf_2.webp',
  '/landing-icons-opt/Surf_3.webp',
  '/landing-icons-opt/Turtle_1.webp',
  '/landing-icons-opt/Turtle_2.webp',
  '/landing-icons-opt/Turtle_3.webp',
  '/landing-icons-opt/Weed.webp',
  '/landing-icons-opt/Wheel.webp',
];

const ICON_COLORS = ['#DFF2EE', '#D8ECE8', '#E3F4F1', '#D5E8E3', '#DCEEEA'];
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

const getIconFamily = (src) => src.split('/').pop().replace('.webp', '').split('_')[0];

const createSeededRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const createLandingDecor = (seed, config) => {
  const rand = createSeededRandom(seed);
  const items = [];
  const shuffledSources = [...ICON_SOURCES].sort(() => rand() - 0.5);
  let sourceIndex = 0;

  const fitsWithoutCollision = (candidate) => !items.some((item) => {
    const dx = item.x - candidate.x;
    const dy = item.y - candidate.y;
    const minDistance = item.radius + candidate.radius + config.minEdgeGap;
    return Math.hypot(dx, dy) < minDistance;
  });

  const canUseFamilyHere = (candidate, family) => !items.some((item) => {
    const dx = item.x - candidate.x;
    const dy = item.y - candidate.y;
    return Math.hypot(dx, dy) < config.nearRadius && item.family === family;
  });

  const totalRows = Math.ceil(config.canvasHeight / config.cellSize);
  const totalCols = Math.ceil(config.canvasWidth / config.cellSize);
  const leftBiasStrength = config.leftBiasStrength || 0;

  for (let row = 0; row < totalRows; row += 1) {
    for (let col = 0; col < totalCols; col += 1) {
      const baseX = col * config.cellSize + config.cellSize / 2;
      const baseY = row * config.cellSize + config.cellSize / 2;
      const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
      const radius = size / 2;
      const edgePadding = Math.max(2, radius * 0.25);
      const src = shuffledSources[sourceIndex % shuffledSources.length];
      sourceIndex += 1;
      const family = getIconFamily(src);
      const maxJitter = config.jitter;

      let placed = false;
      for (let attempt = 0; attempt < 8 && !placed; attempt += 1) {
        const spread = maxJitter * (0.5 + attempt * 0.2);
        const colProgress = totalCols > 1 ? col / (totalCols - 1) : 0;
        const leftBiasShift = (1 - colProgress) * leftBiasStrength * (0.7 + rand() * 0.3);
        const testX = Math.min(
          config.canvasWidth - edgePadding,
          Math.max(edgePadding, baseX + (rand() * 2 - 1) * spread - leftBiasShift),
        );
        const testY = Math.min(
          config.canvasHeight - edgePadding,
          Math.max(edgePadding, baseY + (rand() * 2 - 1) * spread),
        );
        const candidate = { x: testX, y: testY, radius };

        if (!fitsWithoutCollision(candidate)) continue;
        if (attempt < 5 && !canUseFamilyHere(candidate, family)) continue;

        items.push({
          x: testX,
          y: testY,
          radius,
          family,
          src,
          top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
          left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
          size,
          rotate: Math.round(-25 + rand() * 50),
          opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
          color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
          className: '',
        });
        placed = true;
      }
    }
  }

  let remainingTopFill = config.topFillCount || 0;
  let topFillAttempts = 0;
  while (remainingTopFill > 0 && items.length && topFillAttempts < (config.topFillCount || 0) * 20) {
    topFillAttempts += 1;
    const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
    const radius = size / 2;
    const edgePadding = Math.max(2, radius * 0.25);
    const src = shuffledSources[sourceIndex % shuffledSources.length];
    sourceIndex += 1;
    const family = getIconFamily(src);
    const testX = Math.min(
      config.canvasWidth - edgePadding,
      Math.max(edgePadding, edgePadding + rand() * Math.max(1, config.canvasWidth - edgePadding * 2)),
    );
    const topBandPx = config.canvasHeight * 0.14;
    const testY = Math.min(
      topBandPx,
      Math.max(edgePadding, edgePadding + rand() * Math.max(1, topBandPx - edgePadding)),
    );
    const candidate = { x: testX, y: testY, radius };

    if (!fitsWithoutCollision(candidate)) continue;
    if (!canUseFamilyHere(candidate, family)) continue;

    items.push({
      x: testX,
      y: testY,
      radius,
      family,
      src,
      top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
      left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
      size,
      rotate: Math.round(-25 + rand() * 50),
      opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
      color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
      className: '',
    });
    remainingTopFill -= 1;
  }

  let remainingGapFill = config.gapFillCount || 0;
  let gapFillAttempts = 0;
  while (remainingGapFill > 0 && gapFillAttempts < (config.gapFillCount || 0) * 24) {
    gapFillAttempts += 1;
    const size = Math.round(config.minSize + rand() * (config.maxSize - config.minSize));
    const radius = size / 2;
    const edgePadding = Math.max(2, radius * 0.25);
    const src = shuffledSources[sourceIndex % shuffledSources.length];
    sourceIndex += 1;
    const family = getIconFamily(src);
    const testX = edgePadding + rand() * Math.max(1, config.canvasWidth - edgePadding * 2);
    const testY = edgePadding + rand() * Math.max(1, config.canvasHeight * 0.78 - edgePadding * 2);
    const candidate = { x: testX, y: testY, radius };

    if (!fitsWithoutCollision(candidate)) continue;
    if (!canUseFamilyHere(candidate, family)) continue;

    items.push({
      x: testX,
      y: testY,
      radius,
      family,
      src,
      top: `${((testY / config.canvasHeight) * 100).toFixed(2)}%`,
      left: `${((testX / config.canvasWidth) * 100).toFixed(2)}%`,
      size,
      rotate: Math.round(-25 + rand() * 50),
      opacity: Number((config.opacityMin + rand() * (config.opacityMax - config.opacityMin)).toFixed(3)),
      color: ICON_COLORS[Math.floor(rand() * ICON_COLORS.length)],
      className: '',
    });
    remainingGapFill -= 1;
  }

  return items;
};

const LANDING_DECOR_MOBILE = createLandingDecor(20260421, {
  canvasWidth: 390,
  canvasHeight: 760,
  cellSize: 48,
  jitter: 14,
  minSize: 30,
  maxSize: 44,
  minEdgeGap: 3,
  nearRadius: 72,
  opacityMin: 0.3,
  opacityMax: 0.44,
  topFillCount: 10,
  leftBiasStrength: 7,
  gapFillCount: 10,
});

const LANDING_DECOR_TABLET = createLandingDecor(20260422, {
  canvasWidth: 900,
  canvasHeight: 760,
  cellSize: 60,
  jitter: 18,
  minSize: 42,
  maxSize: 60,
  minEdgeGap: 4,
  nearRadius: 88,
  opacityMin: 0.18,
  opacityMax: 0.28,
  topFillCount: 6,
  leftBiasStrength: 10,
  gapFillCount: 8,
});

const LANDING_DECOR_DESKTOP = createLandingDecor(20260423, {
  canvasWidth: 1440,
  canvasHeight: 760,
  cellSize: 70,
  jitter: 22,
  minSize: 50,
  maxSize: 74,
  minEdgeGap: 5,
  nearRadius: 96,
  opacityMin: 0.22,
  opacityMax: 0.34,
  topFillCount: 10,
  leftBiasStrength: 12,
  gapFillCount: 16,
});

const LandingMaskIcon = React.memo(({ src, top, right, bottom, left, size, rotate, opacity, color, className = '' }) => (
  <div
    aria-hidden="true"
    className={`absolute pointer-events-none select-none ${className}`}
    style={{
      top,
      right,
      bottom,
      left,
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      backgroundColor: color,
      transform: `rotate(${rotate}deg)`,
      filter: 'saturate(1.35)',
      WebkitMaskImage: `url(${src})`,
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      WebkitMaskPosition: 'center',
      maskImage: `url(${src})`,
      maskRepeat: 'no-repeat',
      maskSize: 'contain',
      maskPosition: 'center',
    }}
  />
));


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
  const landingDecor = viewportWidth < 768
    ? LANDING_DECOR_MOBILE
    : viewportWidth < 1024
      ? LANDING_DECOR_TABLET
      : LANDING_DECOR_DESKTOP;
  const landingDecorNodes = useMemo(
    () => landingDecor
      .filter((icon) => {
        const topPercent = Number.parseFloat(icon.top);
        return topPercent > 2 && topPercent < 70;
      })
      .map((icon) => (
        <LandingMaskIcon key={`${icon.src}-${icon.top}-${icon.left}`} {...icon} />
      )),
    [landingDecor],
  );

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

    <div className={`pb-12 min-h-screen relative overflow-hidden ${theme === 'dark' ? 'bg-[#062f2f]' : 'bg-[#E6D5B8]'}`}>
      <SEO />

      {/* --- AESTHETIC HEADER START --- */}


      <div className={`relative overflow-hidden ${theme === 'dark' ? 'bg-[#0b5252]' : 'bg-brand-600'}`}>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute inset-0 overflow-hidden">{landingDecorNodes}</div>
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
  <div className={`absolute bottom-0 left-0 w-full h-[150px] md:h-[250px] lg:h-[320px] ${theme === 'dark' ? 'bg-[#062f2f]' : 'bg-[#E6D5B8]'}`}></div>

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
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-cyan-200/70 group-focus-within:text-cyan-100' : 'text-gray-400 group-focus-within:text-brand-600'}`}
            size={20}
        />
        <input
            type="text"
            placeholder="Search by name or location..."
            className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl shadow-sm outline-none font-semibold transition-all ${theme === 'dark' ? 'bg-[#0d4b4b] text-cyan-50 placeholder:text-cyan-200/60 border-cyan-900/40 focus:border-cyan-500/60' : 'bg-white border-transparent focus:border-brand-500/30 text-gray-700 placeholder:text-gray-400'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
    </div>
        <button
            onClick={findClosest}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-4 rounded-2xl font-black active:scale-[0.98] transition-all disabled:opacity-70 ${theme === 'dark' ? 'shadow-[0_0_14px_rgba(45,212,191,0.22)]' : 'shadow-lg shadow-brand-200'}`}        >
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
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[100] bg-brand-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform border-4 border-white/50 backdrop-blur active:bg-brand-700"
        title="Quick Add Quest"
      >
        <PlusCircle size={32} />
      </button>
    )}


        {/* --- CATEGORY FILTER BUTTONS --- */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
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
                            ? 'bg-[#0f5c5c] text-white border-[#1e6b6b] shadow-[0_0_12px_rgba(20,184,166,0.2)] transform scale-105'
                            : 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105')
                        : (theme === 'dark'
                            ? 'bg-[#0d4b4b] text-cyan-100 border-cyan-900/50 hover:bg-[#125454] hover:border-[#1e6b6b]'
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
                    ? 'bg-[#0d4b4b] border-cyan-900/50'
                    : 'bg-white/80 border-white/50'
                }`}
                style={{
                    contentVisibility: 'auto', // Browser keeps the pixels ready
                    containIntrinsicSize: '450px', // Prevents layout jumping
                }}
            >
                    {/* Image Section */}
                    <div className="relative h-64 overflow-hidden bg-[#D9C9A8]" onContextMenu={(e) => e.preventDefault()}>
                        <img
                            src={quest.image || "https://via.placeholder.com/600x400/CCCCCC/808080?text=SideQuest+Image+Missing"}
                            alt={quest.title}
                            loading={index < PRIORITY_QUEST_IMAGE_COUNT ? "eager" : "lazy"}
                            fetchpriority={index < PRIORITY_QUEST_IMAGE_COUNT ? "high" : "low"}
                            decoding="async"
                            draggable="false"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            style={{
                              backgroundColor: '#D9C9A8',
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
                            ? 'bg-[#0a3a3a]/95 text-cyan-100 border border-cyan-900/60'
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
                          theme === 'dark' ? 'text-cyan-50 group-hover:text-cyan-200' : 'text-gray-900 group-hover:text-brand-600'
                        }`}>
                            {quest.title}
                        </h3>

                        <div className={`flex items-center text-sm mt-4 ${theme === 'dark' ? 'text-cyan-200/80' : 'text-gray-500'}`}>
                            <MapPin size={16} className={`mr-1.5 ${theme === 'dark' ? 'text-cyan-300/70' : 'text-gray-400'}`} />
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