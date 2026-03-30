import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Car, Map, ArrowRight, Check, 
  Palmtree, Mountain, Waves, Zap, MapPin
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import SEO from '../components/SEO';

const TravelAgency = () => {
  const navigate = useNavigate();
  const { currentUser } = useSideQuest();
  
  // Tabs for the 4 Traveler paths
  const [activeTab, setActiveTab] = useState('packs'); // packs, ai, custom, driver
  
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedDistricts, setSelectedDistricts] = useState([]);

  return (
    <div className="min-h-screen bg-[#E6D5B8] pb-24">
      <SEO title="Travel Agency | SideQuest Sri Lanka" />

      {/* --- HERO HEADER --- */}
      <div className="bg-[#107870] text-white pt-28 pb-16 px-6 rounded-b-[3.5rem] shadow-2xl">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} /> Official SideQuest Agency
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">Your Island Story, Curated.</h1>
          <p className="max-w-xl mx-auto text-teal-50 opacity-80 font-medium">From private drivers to luxury surf loops. Select your path and we handle the math.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10">
        
        {/* --- HUB NAVIGATION --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { id: 'packs', label: 'Best Sellers', icon: Zap },
            { id: 'ai', label: 'AI Planner', icon: Sparkles },
            { id: 'custom', label: 'Custom Loop', icon: Map },
            { id: 'driver', label: 'Hire Driver', icon: Car },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 md:p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-lg ${
                activeTab === tab.id 
                ? 'bg-white border-[#107870] text-[#107870] scale-105 z-10' 
                : 'bg-white/60 border-transparent text-gray-400 hover:bg-white'
              }`}
            >
              <tab.icon size={24} />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* TAB 1: QUICK PACKS */}
          {activeTab === 'packs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Southern Surf Loop", days: 5, price: 450, vibe: "Surf", img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f" },
                { title: "Cultural Triangle Zen", days: 7, price: 820, vibe: "Zen", img: "https://images.unsplash.com/photo-1546708973-b339540b5162" },
                { title: "Deep Jungle Adventure", days: 4, price: 380, vibe: "Extreme", img: "https://images.unsplash.com/photo-1580313095315-748983050965" },
              ].map((pack, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-white group cursor-pointer hover:scale-[1.02] transition-all">
                  <div className="h-48 relative">
                    <img src={pack.img} className="w-full h-full object-cover" alt={pack.title} />
                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#107870]">{pack.days} Days</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-1">{pack.title}</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Vibe: {pack.vibe}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-black text-[#107870]">${pack.price}</p>
                      <button className="bg-[#107870] text-white p-3 rounded-2xl shadow-lg"><ArrowRight size={20} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: AI PLANNER */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl text-center">
               <h2 className="text-2xl font-black text-gray-900 mb-2">Build My Dream Itinerary</h2>
               <p className="text-gray-500 mb-10 italic">Select your vibes and we'll match the perfect route.</p>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-2xl mx-auto">
                  {['#Surf', '#Zen', '#Extreme', '#Culture'].map(v => (
                    <button key={v} onClick={() => setSelectedVibe(v)} className={`py-4 rounded-2xl border-2 font-black transition-all ${selectedVibe === v ? 'border-[#107870] bg-[#107870]/5 text-[#107870]' : 'border-gray-50 text-gray-400'}`}>{v}</button>
                  ))}
               </div>
               <button className="bg-[#107870] text-white px-12 py-5 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all">Match My Trip ⚡</button>
            </div>
          )}

          {/* TAB 3: CUSTOM LOOP */}
          {activeTab === 'custom' && (
            <div className="bg-white rounded-[3rem] p-8 shadow-2xl">
               <h2 className="text-xl font-black text-[#107870] uppercase tracking-widest mb-6">Select Your Districts</h2>
               <div className="flex flex-wrap gap-3 mb-10">
                  {['Colombo', 'Galle', 'Ella', 'Kandy', 'Sigiriya', 'A-Bay'].map(d => (
                    <button key={d} onClick={() => setSelectedDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all text-sm ${selectedDistricts.includes(d) ? 'bg-[#107870] text-white' : 'bg-gray-50 text-gray-400'}`}>{d}</button>
                  ))}
               </div>
               <div className="p-6 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-lg font-black text-gray-800">{selectedDistricts.length * 2} Days Estimated</p>
                  <button disabled={selectedDistricts.length === 0} className="bg-[#107870] text-white px-10 py-4 rounded-2xl font-black shadow-lg disabled:opacity-30">Build Custom Route</button>
               </div>
            </div>
          )}

          {/* TAB 4: HIRE DRIVER */}
          {activeTab === 'driver' && (
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col md:flex-row items-center gap-10">
               <div className="flex-1">
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Solo Driver Hire</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed">Book a verified SideQuest driver for pure transport. Includes Fuel, Insurance, and Island-wide Knowledge.</p>
                  <div className="flex items-center gap-6">
                    <div><p className="text-3xl font-black text-gray-900">$70</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Per Day</p></div>
                    <button className="bg-[#107870] text-white px-10 py-4 rounded-2xl font-black shadow-xl">Book Now</button>
                  </div>
               </div>
               <div className="w-full md:w-80 h-80 bg-gray-100 rounded-[2.5rem] overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d" className="w-full h-full object-cover grayscale" alt="Driver" />
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TravelAgency;