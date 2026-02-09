
import React, { useState, useEffect, useLayoutEffect, useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, ArrowRight, Sparkles, PlusCircle, Compass, Mountain, Anchor, 
  Leaf, Waves, Heart, Bird, Palmtree, Backpack, Map, Zap, Ship, 
  Globe, Trees, Tent, Camera, Sun, Moon
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';


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

const ICON_POOL = [
  Compass, Mountain, Anchor, Leaf, Waves, Heart, Bird, Palmtree, 
  Backpack, Map, Zap, Ship, Globe, Trees, Tent, Camera, Sun, Moon, Sparkles
];

// Generate 150 scattered artifacts for a "Crowded" look
const SCATTERED_ICONS = Array.from({ length: 150 }).map((_, i) => ({
  Icon: ICON_POOL[i % ICON_POOL.length],
  // Tighter vertical spacing (80px instead of 160px)
  top: 700 + (i * 85), 
  // Organic horizontal scatter using Sine to fill the "wings" of the screen
  left: (Math.sin(i) * 45 + 50), 
  // Varied sizes for depth
  size: 40 + (i % 5) * 20, 
  rot: (i * 37) % 360,
  // Varying opacity creates a "shimmer" effect in the sand
  opacity: i % 3 === 0 ? 0.09 : 0.05 
}));

const Home = () => {
  const hasRestored = useRef(false);
  const { quests, isLoading, currentUser } = useSideQuest(); 
  const navigate = useNavigate();
  const activeQuests = quests.filter(quest => quest.status === 'active');
  const [selectedCategory, setSelectedCategory] = useState(
    sessionStorage.getItem('sq_selected_category') || 'All'
);

  const categories = [
      'All', 
      'Exploration','Adventure','Marine Adventure','Environmental','Wildlife Adventure', 'Animal Welfare', 'Cultural',
          'Social', 'Education'
  ];


  // Wrapper to save position before leaving
  const handleQuestClick = (questId) => {
    sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
    sessionStorage.setItem('sq_selected_category', selectedCategory); 
    navigate(`/quest/${questId}`);
};


  // Filter & Sort Logic
  const displayQuests = activeQuests
      .filter(q => selectedCategory === 'All' || q.category === selectedCategory)
      // Sort by XP (Highest to Lowest)
      .sort((a, b) => (b.xp_value || 0) - (a.xp_value || 0));



      // --- SCROLL RESTORATION LOGIC ---

      useLayoutEffect(() => {
        if (displayQuests.length > 0 && !hasRestored.current) {
          const savedPosition = sessionStorage.getItem('homeScrollPos');
          if (savedPosition) {
            window.scrollTo({ top: parseInt(savedPosition), behavior: 'instant' });
          }
          hasRestored.current = true; 
        }
      }, [displayQuests.length]);


  useEffect(() => {
    // 2. Save position when LEAVING this page
    const handleScrollSave = () => {
      sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
    };

    // Attach listener to save scroll on clicks (navigation)
    window.addEventListener('beforeunload', handleScrollSave);
    
    return () => {
      // Save position when component unmounts (navigating to Quest Details)
      handleScrollSave(); 
      window.removeEventListener('beforeunload', handleScrollSave);
    };
  }, []);




  return (
    
    <div className="pb-12 bg-[#E6D5B8] min-h-screen relative overflow-hidden">
      
      {/* --- AESTHETIC HEADER START --- */}


      <div className="relative bg-brand-600 overflow-hidden">
        
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full bg-brand-400 opacity-20 blur-3xl"></div>
            <div className="absolute top-1/4 left-[10%] w-[400px] h-[400px] rounded-full bg-teal-300 opacity-20 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-transparent via-white/5 to-transparent rotate-12"></div>
        </div>

        {/* Content Section: 2. CHANGED pb-24 to pb-32 */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-32 pb-64 md:pb-80 lg:pb-96 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-medium mb-6 animate-fade-in-up">
            <Sparkles size={16} className="text-yellow-300" />
            <span>Discover the unseen Sri Lanka</span>
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
                        Complete impact quests, earn rewards, and leave the island better than you found it.
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
<div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
  
  {/* 1. TALLER SAND BASE */}
  <div className="absolute bottom-0 left-0 w-full h-[150px] md:h-[250px] lg:h-[320px] bg-[#E6D5B8]"></div>

  <svg 
    className="relative block w-[210%] h-[150px] md:h-[250px] lg:h-[320px]" 
    viewBox="0 0 1200 320" 
    preserveAspectRatio="none"
  >
    
    {/* 2. GHOST WAVE (Added as requested - Sits behind main foam) */}
    {/* This creates the "Double Wave" look */}
    <path 
      d="M0,0 L1200,0 L1200,130 C900,180 600,90 300,160 L0,120 Z" 
      className="fill-white/30 animate-wave-roll"
      style={{ animationDuration: '15s', animationDelay: '-5s' }}
    ></path>

    {/* 3. WHITE FOAM */}
    <path 
      d="M0,0 L1200,0 L1200,120 C900,160 600,80 300,140 L0,100 Z" 
      className="fill-white animate-wave-roll"
      style={{ animationDuration: '10s', animationDelay: '-2s' }}
    ></path>

    {/* 4. TURQUOISE WATER (Matched to Header) */}
    <path 
      d="M0,0 L1200,0 L1200,100 C900,140 600,60 300,120 L0,80 Z" 
      className="fill-brand-600 animate-wave-roll"
      style={{ animationDuration: '10s' }}
    ></path>
  </svg>
</div>
            </div>

      {/* --- AESTHETIC HEADER END --- */}

        {/* --- BACKGROUND GHOST ICONS ( --- */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          {SCATTERED_ICONS.map((asset, idx) => (
              <asset.Icon 
                  key={idx}
                  size={asset.size}
                  style={{
                      position: 'absolute',
                      top: `${asset.top}px`,
                      left: `${asset.left}%`,
                      transform: `rotate(${asset.rot}deg)`,
                      opacity: asset.opacity, 
                      color: '#5D4037', // Deep Earth Brown
                  }}
              />
          ))}
      </div>

      {/* Quest Grid */}
      <div id="quests-grid" className="max-w-7xl mx-auto px-4 mt-20 relative z-10">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Available Quests</h2>
            <p className="text-gray-500 mt-2">Curated experiences, sorted by highest impact.</p>
          </div>
          <button onClick={() => navigate('/map')} className="hidden md:block text-brand-600 font-bold hover:underline">View All on Map</button>
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
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105'
                        : 'bg-white text-gray-500 border-transparent hover:bg-gray-50 hover:border-gray-200'
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
                className="group bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl shadow-sm overflow-hidden cursor-pointer h-[450px]"
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
                            loading={index < 12 ? "eager" : "lazy"} 
                            fetchpriority={index < 12 ? "high" : "low"}
                            //decoding="async" 
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

                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-brand-600 shadow-lg">
                            ⭐ {quest.xp_value} XP
                        </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                quest.category === 'Environmental' ? 'bg-emerald-100 text-emerald-700' :
                                quest.category === 'Social' ? 'bg-rose-100 text-rose-700' :
                                quest.category === 'Animal Welfare' ? 'bg-pink-100 text-pink-700' :
                                quest.category === 'Education' ? 'bg-blue-100 text-blue-700' :
                                quest.category === 'Cultural' ? 'bg-violet-100 text-violet-700' :
                                quest.category === 'Adventure' ? 'bg-orange-100 text-orange-800' :
                                quest.category === 'Exploration' ? 'bg-yellow-100 text-yellow-800' :
                                quest.category === 'Marine Adventure' ? 'bg-cyan-100 text-cyan-700' :
                                quest.category === 'Wildlife Adventure' ? 'bg-lime-100 text-lime-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                                {quest.category}
                            </span>
                        </div>
                        
                        <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-brand-600 transition-colors">
                            {quest.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-500 text-sm mt-4">
                            <MapPin size={16} className="mr-1.5 text-gray-400" /> 
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