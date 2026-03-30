import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Car, Map, ArrowRight, Check, 
  Palmtree, Mountain, Waves, Zap, MapPin, X, Shield
} from 'lucide-react';
import { useSideQuest } from '../context/SideQuestContext';
import SEO from '../components/SEO';

const TravelAgency = () => {
  const navigate = useNavigate();
  const { currentUser } = useSideQuest();
  
  const [activeTab, setActiveTab] = useState('packs'); 
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  return (
    <div className="min-h-screen bg-[#E6D5B8] pb-24">
      <SEO title="Travel Agency | SideQuest Sri Lanka" />

      {/* --- MINIMALIST HEADER --- */}
      <div className="bg-[#107870] text-white pt-24 pb-16 px-6 rounded-b-[3.5rem] shadow-xl text-center">
        <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tighter">Travel Agency</h1>
        <p className="text-teal-50/80 font-medium max-w-xl mx-auto italic">Curated Sri Lankan journeys. Verified drivers. Boutique stays.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        
        {/* --- CLEAN PILL NAVIGATION --- */}
        <div className="flex overflow-x-auto gap-3 mb-12 pb-2 scrollbar-hide justify-center">
          {[
            { id: 'packs', label: 'Best Sellers' },
            { id: 'ai', label: 'AI Planner' },
            { id: 'custom', label: 'Custom Loop' },
            { id: 'driver', label: 'Hire Driver' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
                activeTab === tab.id 
                ? 'bg-white text-[#107870] scale-105' 
                : 'bg-[#0a4d47] text-white/60 hover:text-white'
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
                <div key={pack.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white flex flex-col h-full">
                  {/* Fixed Aspect Ratio for Images */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <img src={pack.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={pack.title} />
                    <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-white border border-white/20">
                      {pack.days} Days
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{pack.title}</h3>
                    <p className="text-[#107870] text-[10px] font-black uppercase tracking-[0.2em] mb-6">Vibe: {pack.vibe}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-3xl font-black text-gray-900">${pack.price}</p>
                      <button 
                        onClick={() => setSelectedTrip(pack)}
                        className="bg-[#107870] text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 shadow-lg transition-all active:scale-95"
                      >
                        Details <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: AI PLANNER */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl text-center max-w-2xl mx-auto border border-white">
               <div className="w-20 h-20 bg-[#107870]/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[#107870]">
                  <Sparkles size={40} />
               </div>
               <h2 className="text-3xl font-black text-gray-900 mb-2">Build My Itinerary</h2>
               <p className="text-gray-400 font-medium mb-10 italic">Tell us your vibe, we match the route.</p>
               <div className="grid grid-cols-2 gap-4 mb-10">
                  {['#Surf', '#Zen', '#Extreme', '#Culture'].map(v => (
                    <button key={v} onClick={() => setSelectedVibe(v)} className={`py-5 rounded-3xl font-black transition-all border-2 ${selectedVibe === v ? 'border-[#107870] bg-[#107870]/5 text-[#107870]' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>{v}</button>
                  ))}
               </div>
               <button className="w-full bg-[#107870] text-white py-5 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all">Match My Trip ⚡</button>
            </div>
          )}

          {/* TAB 3: CUSTOM LOOP */}
          {activeTab === 'custom' && (
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-3xl mx-auto">
               <h2 className="text-2xl font-black text-[#107870] uppercase tracking-widest mb-8 text-center">Select Districts</h2>
               <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {['Colombo', 'Galle', 'Ella', 'Kandy', 'Sigiriya', 'A-Bay', 'Jaffna', 'Mirissa'].map(d => (
                    <button key={d} onClick={() => setSelectedDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} className={`px-8 py-3 rounded-full font-bold transition-all border-2 ${selectedDistricts.includes(d) ? 'bg-[#107870] border-[#107870] text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>{d}</button>
                  ))}
               </div>
               <div className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Duration Estimation</p>
                    <p className="text-2xl font-black text-gray-800">{selectedDistricts.length * 2} Days Loop</p>
                  </div>
                  <button disabled={selectedDistricts.length === 0} className="bg-[#107870] text-white px-12 py-4 rounded-2xl font-black shadow-lg disabled:opacity-30">Plan This Route</button>
               </div>
            </div>
          )}

          {/* TAB 4: HIRE DRIVER */}
          {activeTab === 'driver' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-[#107870]/10 text-[#107870] px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-6"><Shield size={14} /> Verified Partner</div>
                  <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight">Solo Driver Booking</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed font-medium text-lg">Already have hotels? Secure a professional SideQuest driver. Includes fuel, insurance, and local knowledge.</p>
                  <div className="flex items-center gap-8 mb-10">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700"><Check className="text-[#107870]" size={18}/> Licensed</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700"><Check className="text-[#107870]" size={18}/> 24/7 Support</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div><p className="text-4xl font-black text-gray-900">$70</p><p className="text-xs font-bold text-gray-400 uppercase">Per Day Total</p></div>
                    <button className="flex-1 max-w-xs bg-[#107870] text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-[#107870]/20 active:scale-95 transition-all">Hire Now</button>
                  </div>
               </div>
               <div className="w-full md:w-96 h-96 bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Driver" />
               </div>
            </div>
          )}

        </div>
      </div>

      {/* --- SELECTION OVERLAY --- */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 relative shadow-2xl border border-white/20">
              <button onClick={() => setSelectedTrip(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"><X size={32}/></button>
              
              <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">{selectedTrip.title}</h2>
              <div className="flex gap-4 mb-10">
                <span className="text-[10px] font-black uppercase px-4 py-1.5 bg-gray-100 rounded-full text-gray-500">{selectedTrip.days} Days</span>
                <span className="text-[10px] font-black uppercase px-4 py-1.5 bg-[#107870]/10 rounded-full text-[#107870]">{selectedTrip.vibe} Experience</span>
              </div>
              
              <div className="space-y-4 mb-12">
                 {['Driver Only ($)', 'Essential Pack ($$)', 'Full SideQuest Experience ($$$)'].map((tier, i) => (
                   <button key={i} className="w-full text-left p-6 rounded-[2rem] border-2 border-gray-100 hover:border-[#107870] transition-all group flex justify-between items-center bg-gray-50/50 hover:bg-white shadow-sm">
                      <span className="font-bold text-gray-800 text-lg">{tier}</span>
                      <ArrowRight size={20} className="text-gray-300 group-hover:text-[#107870] group-hover:translate-x-1 transition-all" />
                   </button>
                 ))}
              </div>

              <button className="w-full bg-[#107870] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-[#107870]/20 active:scale-95 transition-all">Proceed to Booking</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TravelAgency;