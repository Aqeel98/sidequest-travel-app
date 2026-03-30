import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Car, Map, ArrowRight, Check, 
  Palmtree, Mountain, Waves, Zap, MapPin, X
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import SEO from '../components/SEO';

const TravelAgency = () => {
  const navigate = useNavigate();
  const { currentUser } = useSideQuest();
  
  const [activeTab, setActiveTab] = useState('packs'); 
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  
  // Phase 2 State: Which trip are we currently looking at?
  const [selectedTrip, setSelectedTrip] = useState(null);

  const darkCyan = "#107870";

  return (
    <div className="min-h-screen bg-[#E6D5B8] pb-24">
      <SEO title="Travel Agency | SideQuest Sri Lanka" />

      {/* --- MINIMALIST HEADER --- */}
      <div className="bg-[#107870] text-white pt-24 pb-16 px-6 rounded-b-[3rem] shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Travel Agency</h1>
          <p className="text-teal-50 opacity-80 font-medium">Premium Sri Lankan journeys. Curated and simplified.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        
        {/* --- CLEAN PILL NAVIGATION --- */}
        <div className="flex overflow-x-auto gap-3 mb-10 pb-2 scrollbar-hide justify-start md:justify-center">
          {[
            { id: 'packs', label: 'Best Sellers' },
            { id: 'ai', label: 'AI Planner' },
            { id: 'custom', label: 'Custom Loop' },
            { id: 'driver', label: 'Hire Driver' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-8 py-3 rounded-full font-bold transition-all shadow-md ${
                activeTab === tab.id 
                ? 'bg-white text-[#107870]' 
                : 'bg-[#107870]/20 text-white border border-white/10 backdrop-blur-md'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT AREA --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* TAB 1: BEST SELLERS */}
          {activeTab === 'packs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { id: 1, title: "Southern Surf Loop", days: 5, price: 450, vibe: "Surf", img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f" },
                { id: 2, title: "Cultural Triangle Zen", days: 7, price: 820, vibe: "Zen", img: "https://images.unsplash.com/photo-1546708973-b339540b5162" },
                { id: 3, title: "Deep Jungle Adventure", days: 4, price: 380, vibe: "Extreme", img: "https://images.unsplash.com/photo-1580313095315-748983050965" },
              ].map((pack) => (
                <div key={pack.id} className="bg-white rounded-[2rem] overflow-hidden shadow-xl group border border-white">
                  <div className="h-56 relative">
                    <img src={pack.img} className="w-full h-full object-cover" alt={pack.title} />
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#107870]">{pack.days} Days</div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-1">{pack.title}</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Vibe: {pack.vibe}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-black text-[#107870]">${pack.price}</p>
                      <button 
                        onClick={() => setSelectedTrip(pack)}
                        className="bg-[#107870] text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                      >
                        Details <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: AI PLANNER */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl text-center max-w-2xl mx-auto border border-white">
               <h2 className="text-2xl font-black text-gray-900 mb-2 text-[#107870]">AI Trip Builder</h2>
               <p className="text-gray-400 font-medium mb-10">Select your vibes for a custom match.</p>
               <div className="grid grid-cols-2 gap-3 mb-10">
                  {['#Surf', '#Zen', '#Extreme', '#Culture'].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setSelectedVibe(v)} 
                      className={`py-4 rounded-2xl font-black transition-all border-2 ${selectedVibe === v ? 'border-[#107870] bg-[#107870]/5 text-[#107870]' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                    >
                      {v}
                    </button>
                  ))}
               </div>
               <button className="w-full bg-[#107870] text-white py-4 rounded-full font-black text-lg shadow-xl active:scale-95 transition-all">Match My Trip</button>
            </div>
          )}

          {/* TAB 4: DRIVER HIRE */}
          {activeTab === 'driver' && (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white">
               <div className="flex-1">
                  <h2 className="text-3xl font-black text-[#107870] mb-4">Solo Driver</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed font-medium">Book a verified SideQuest driver for pure transport. Includes Fuel, Insurance, and Island-wide Knowledge.</p>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#107870]"><Check size={18}/> Licensed</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#107870]"><Check size={18}/> 24/7 Support</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div><p className="text-3xl font-black text-gray-900">$70</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Per Day</p></div>
                    <button className="bg-[#107870] text-white px-10 py-4 rounded-full font-black shadow-xl">Hire Now</button>
                  </div>
               </div>
               <div className="w-full md:w-80 h-72 bg-gray-100 rounded-[2rem] overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d" className="w-full h-full object-cover" alt="Driver" />
               </div>
            </div>
          )}

        </div>
      </div>

      {/* --- PHASE 2 OVERLAY (THE TIER SELECTION) --- */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 relative shadow-2xl border border-white/20 overflow-hidden">
              <button onClick={() => setSelectedTrip(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><X size={24}/></button>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedTrip.title}</h2>
              <p className="text-sm font-bold text-[#107870] uppercase mb-8">{selectedTrip.days} Days · Choose Your Tier</p>
              
              <div className="space-y-4 mb-10">
                 {['Driver Only ($)', 'Essential Pack ($$)', 'Full SideQuest ($$$)'].map((tier, i) => (
                   <button key={i} className="w-full text-left p-6 rounded-3xl border-2 border-gray-100 hover:border-[#107870] transition-all group flex justify-between items-center">
                      <span className="font-bold text-gray-700 group-hover:text-[#107870]">{tier}</span>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-[#107870]" />
                   </button>
                 ))}
              </div>

              <button className="w-full bg-[#107870] text-white py-5 rounded-full font-black text-xl shadow-xl active:scale-95 transition-all">Proceed to Booking</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TravelAgency;